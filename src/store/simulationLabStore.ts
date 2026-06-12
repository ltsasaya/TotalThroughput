import { create } from 'zustand'
import {
  runServerLabSimulation,
  type ServerLabInputs,
  type ServerLabRun,
} from '@/simulation/serverLab'
import {
  estimateServerLabExperiment,
  runServerLabConcurrencySweep,
  type ServerLabExperimentEstimate,
  type ServerLabSweepResult,
} from '@/simulation/serverLabExperiment'

export type SimulationSeriesKey =
  | 'systemCount'
  | 'responseTime'
  | 'utilization'
  | 'arrivalRate'

export type SimulationLabEditableInput = Exclude<keyof ServerLabInputs, 'seed'>

interface SimulationLabRunRecord {
  seed: number
  serviceDemandSeconds: number
  arrivalRatePerSecond: number
  concurrency: number
  durationSeconds: number
  arrivals: number
  completedWithinWindow: number
}

interface SimulationLabStore {
  inputs: Omit<ServerLabInputs, 'seed'>
  activeSeries: Record<SimulationSeriesKey, boolean>
  currentRun: ServerLabRun | null
  sweepResults: ServerLabSweepResult[]
  recentRuns: SimulationLabRunRecord[]
  error: string | null
  pendingEstimate: ServerLabExperimentEstimate | null
  setInput: (key: SimulationLabEditableInput, value: number) => void
  clearPendingEstimate: () => void
  toggleSeries: (key: SimulationSeriesKey) => void
  runSimulation: (inputs?: Omit<ServerLabInputs, 'seed'>) => 'ran' | 'pending' | 'blocked' | 'failed'
  resetInputs: () => void
}

const DEFAULT_INPUTS: Omit<ServerLabInputs, 'seed'> = {
  serviceDemandSeconds: 0.5,
  arrivalRatePerSecond: 1.2,
  concurrency: 2,
  durationSeconds: 60,
}

const DEFAULT_SERIES: Record<SimulationSeriesKey, boolean> = {
  systemCount: true,
  responseTime: true,
  utilization: true,
  arrivalRate: true,
}

function createSimulationSeed(): number {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const values = new Uint32Array(1)
    globalThis.crypto.getRandomValues(values)
    return values[0] % 1_000_000
  }

  return Math.floor(Math.random() * 1_000_000)
}

function recordFromRun(run: ServerLabRun): SimulationLabRunRecord {
  return {
    seed: run.inputs.seed,
    serviceDemandSeconds: run.inputs.serviceDemandSeconds,
    arrivalRatePerSecond: run.inputs.arrivalRatePerSecond,
    concurrency: run.inputs.concurrency,
    durationSeconds: run.inputs.durationSeconds,
    arrivals: run.summary.arrivals,
    completedWithinWindow: run.summary.completedWithinWindow,
  }
}

export const useSimulationLabStore = create<SimulationLabStore>((set, get) => ({
  inputs: DEFAULT_INPUTS,
  activeSeries: DEFAULT_SERIES,
  currentRun: null,
  sweepResults: [],
  recentRuns: [],
  error: null,
  pendingEstimate: null,

  setInput: (key, value) => {
    set(state => ({
      inputs: {
        ...state.inputs,
        [key]: value,
      },
      error: null,
      pendingEstimate: null,
    }))
  },

  clearPendingEstimate: () => {
    set({ pendingEstimate: null })
  },

  toggleSeries: (key) => {
    set(state => ({
      activeSeries: {
        ...state.activeSeries,
        [key]: !state.activeSeries[key],
      },
    }))
  },

  runSimulation: (inputOverride) => {
    const inputs = inputOverride ?? get().inputs
    const estimate = estimateServerLabExperiment(inputs)
    const pendingEstimate = get().pendingEstimate
    const confirmed = pendingEstimate?.signature === estimate.signature

    if (estimate.guardLevel === 'blocked') {
      set({
        inputs,
        error: `Experiment is too large: ${estimate.messages.join('; ')}`,
        pendingEstimate: null,
      })
      return 'blocked'
    }

    if (estimate.requiresConfirmation && !confirmed) {
      set({
        inputs,
        error: null,
        pendingEstimate: estimate,
      })
      return 'pending'
    }

    try {
      const run = runServerLabSimulation({
        ...inputs,
        seed: createSimulationSeed(),
      })
      set(state => ({
        inputs,
        currentRun: run,
        sweepResults: runServerLabConcurrencySweep(run.inputs),
        recentRuns: [recordFromRun(run), ...state.recentRuns].slice(0, 6),
        error: null,
        pendingEstimate: null,
      }))
      return 'ran'
    } catch (error) {
      set({
        inputs,
        error: error instanceof Error ? error.message : 'Simulation failed',
        pendingEstimate: null,
      })
      return 'failed'
    }
  },

  resetInputs: () => {
    set({
      inputs: DEFAULT_INPUTS,
      currentRun: null,
      sweepResults: [],
      recentRuns: [],
      error: null,
      pendingEstimate: null,
    })
  },
}))
