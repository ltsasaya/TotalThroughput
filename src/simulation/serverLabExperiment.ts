import {
  runServerLabSimulation,
  SERVER_LAB_LIMITS,
  type ServerLabInputs,
  type ServerLabSteadyState,
  type ServerLabSummary,
} from './serverLab'

export type ServerLabLoadBand = 'comfortable' | 'busy' | 'nearSaturation' | 'unstable'
export type ServerLabRunGuardLevel = 'ok' | 'confirm' | 'blocked'

export interface ServerLabLoadProfile {
  band: ServerLabLoadBand
  label: string
  description: string
  offeredLoad: number
  perWorkerLoad: number
}

export interface ServerLabExperimentEstimate {
  signature: string
  guardLevel: ServerLabRunGuardLevel
  requiresConfirmation: boolean
  expectedArrivals: number
  expectedSweepArrivals: number
  displaySamples: number
  loadProfile: ServerLabLoadProfile
  messages: string[]
}

export interface ServerLabSweepResult {
  concurrency: number
  seed: number
  loadProfile: ServerLabLoadProfile
  steadyState: ServerLabSteadyState
  summary: ServerLabSummary
}

export const SERVER_LAB_SWEEP_CONCURRENCIES = [1, 2, 4, 8] as const

const SOFT_EXPECTED_ARRIVALS = 10_000
const SOFT_SWEEP_EXPECTED_ARRIVALS = 30_000
const MAX_SWEEP_EXPECTED_ARRIVALS = 120_000

export function computeServerLabLoadProfile({
  serviceDemandSeconds,
  arrivalRatePerSecond,
  concurrency,
}: Omit<ServerLabInputs, 'seed'>): ServerLabLoadProfile {
  const offeredLoad = arrivalRatePerSecond * serviceDemandSeconds
  const perWorkerLoad = offeredLoad / concurrency

  if (perWorkerLoad >= 1) {
    return {
      band: 'unstable',
      label: 'Unstable',
      description: 'No stable M/M/c reference at this load.',
      offeredLoad,
      perWorkerLoad,
    }
  }

  if (perWorkerLoad >= 0.9) {
    return {
      band: 'nearSaturation',
      label: 'Near Saturation',
      description: 'Stable reference exists, but finite runs can be noisy.',
      offeredLoad,
      perWorkerLoad,
    }
  }

  if (perWorkerLoad >= 0.7) {
    return {
      band: 'busy',
      label: 'Busy',
      description: 'Queueing should appear, but the system can recover.',
      offeredLoad,
      perWorkerLoad,
    }
  }

  return {
    band: 'comfortable',
    label: 'Comfortable',
    description: 'Load is below saturation and queues should stay controlled.',
    offeredLoad,
    perWorkerLoad,
  }
}

export function createServerLabExperimentSignature(inputs: Omit<ServerLabInputs, 'seed'>): string {
  return [
    inputs.serviceDemandSeconds,
    inputs.arrivalRatePerSecond,
    inputs.concurrency,
    inputs.durationSeconds,
  ].join('|')
}

export function estimateServerLabExperiment(
  inputs: Omit<ServerLabInputs, 'seed'>,
  sweepConcurrencies: readonly number[] = SERVER_LAB_SWEEP_CONCURRENCIES,
): ServerLabExperimentEstimate {
  const expectedArrivals = inputs.arrivalRatePerSecond * inputs.durationSeconds
  const expectedSweepArrivals = expectedArrivals * sweepConcurrencies.length
  const displaySamples = Math.min(
    SERVER_LAB_LIMITS.maxDisplaySamples,
    Math.max(SERVER_LAB_LIMITS.minDisplaySamples, Math.ceil(inputs.durationSeconds * 2)),
  )
  const loadProfile = computeServerLabLoadProfile(inputs)
  const messages: string[] = []
  let guardLevel: ServerLabRunGuardLevel = 'ok'

  if (expectedArrivals > SERVER_LAB_LIMITS.maxExpectedArrivals) {
    guardLevel = 'blocked'
    messages.push(`single run expects ${Math.round(expectedArrivals)} arrivals`)
  } else if (expectedArrivals > SOFT_EXPECTED_ARRIVALS) {
    guardLevel = 'confirm'
    messages.push(`single run expects ${Math.round(expectedArrivals)} arrivals`)
  }

  if (expectedSweepArrivals > MAX_SWEEP_EXPECTED_ARRIVALS) {
    guardLevel = 'blocked'
    messages.push(`sweep expects ${Math.round(expectedSweepArrivals)} total arrivals`)
  } else if (expectedSweepArrivals > SOFT_SWEEP_EXPECTED_ARRIVALS && guardLevel !== 'blocked') {
    guardLevel = 'confirm'
    messages.push(`sweep expects ${Math.round(expectedSweepArrivals)} total arrivals`)
  }

  if (loadProfile.band === 'unstable' && guardLevel !== 'blocked') {
    guardLevel = 'confirm'
    messages.push('steady-state M/M/c reference is unstable')
  } else if (loadProfile.band === 'nearSaturation' && guardLevel === 'ok') {
    messages.push('near-saturation finite runs may be noisy')
  }

  return {
    signature: createServerLabExperimentSignature(inputs),
    guardLevel,
    requiresConfirmation: guardLevel === 'confirm',
    expectedArrivals,
    expectedSweepArrivals,
    displaySamples,
    loadProfile,
    messages,
  }
}

export function runServerLabConcurrencySweep(
  inputs: ServerLabInputs,
  concurrencies: readonly number[] = SERVER_LAB_SWEEP_CONCURRENCIES,
): ServerLabSweepResult[] {
  return concurrencies.map(concurrency => {
    const run = runServerLabSimulation(
      { ...inputs, concurrency },
      { includeSamples: false },
    )

    return {
      concurrency,
      seed: inputs.seed,
      loadProfile: computeServerLabLoadProfile(run.inputs),
      steadyState: run.steadyState,
      summary: run.summary,
    }
  })
}
