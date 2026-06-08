import type { DifficultyMode, Phase2LoadRegime, Phase2RunConfig, Phase2SizeWeight } from '../types/game'
import { generatePoissonArrivalSchedule, type ScheduledArrival } from './arrival'

export const PHASE2_DURATION_MS = 60_000
const FALLBACK_SERVICE_DEMAND_MS = 3_000

interface Phase2DifficultySpec {
  label: string
  regime: Phase2LoadRegime
  workerCount: number
  targetPerWorkerLoad: number
  seed: number
  sizeMix: readonly Phase2SizeWeight[]
}

const PHASE2_SPECS: Record<DifficultyMode, Phase2DifficultySpec> = {
  beginner: {
    label: 'Low server-pool load',
    regime: 'low',
    workerCount: 4,
    targetPerWorkerLoad: 0.50,
    seed: 52_041,
    sizeMix: [
      { size: 'S', weight: 6 },
      { size: 'M', weight: 3 },
      { size: 'L', weight: 1 },
    ],
  },
  standard: {
    label: 'Moderate server-pool load',
    regime: 'moderate',
    workerCount: 4,
    targetPerWorkerLoad: 0.70,
    seed: 52_070,
    sizeMix: [
      { size: 'S', weight: 5 },
      { size: 'M', weight: 4 },
      { size: 'L', weight: 1 },
    ],
  },
  hard: {
    label: 'Near-saturation server-pool load',
    regime: 'near-saturation',
    workerCount: 6,
    targetPerWorkerLoad: 0.85,
    seed: 52_085,
    sizeMix: [
      { size: 'S', weight: 4 },
      { size: 'M', weight: 4 },
      { size: 'L', weight: 2 },
    ],
  },
  theory: {
    label: 'Repeatable reference load',
    regime: 'moderate',
    workerCount: 4,
    targetPerWorkerLoad: 0.70,
    seed: 52_390,
    sizeMix: [
      { size: 'S', weight: 5 },
      { size: 'M', weight: 4 },
      { size: 'L', weight: 1 },
    ],
  },
}

export function phase2WorkerCount(difficulty: DifficultyMode): number {
  return PHASE2_SPECS[difficulty].workerCount
}

export function buildPhase2RunConfig(
  difficulty: DifficultyMode,
  serviceDemandMs: number,
): Phase2RunConfig {
  const spec = PHASE2_SPECS[difficulty]
  const safeServiceDemandMs = serviceDemandMs > 0 && Number.isFinite(serviceDemandMs)
    ? serviceDemandMs
    : FALLBACK_SERVICE_DEMAND_MS
  const serviceDemandSeconds = safeServiceDemandMs / 1000
  const lambda = spec.targetPerWorkerLoad * spec.workerCount / serviceDemandSeconds
  const expectedArrivals = Math.round(lambda * (PHASE2_DURATION_MS / 1000))

  return {
    label: spec.label,
    regime: spec.regime,
    seed: spec.seed,
    lambda,
    targetPerWorkerLoad: spec.targetPerWorkerLoad,
    expectedArrivals,
    arrivalWindowMs: PHASE2_DURATION_MS,
    serviceDemandMs: safeServiceDemandMs,
    sizeMix: spec.sizeMix,
  }
}

export function generatePhase2ArrivalSchedule(run: Phase2RunConfig): ScheduledArrival[] {
  return generatePoissonArrivalSchedule({
    lambdaPerSecond: run.lambda,
    arrivalWindowMs: run.arrivalWindowMs,
    seed: run.seed,
    sizeMix: run.sizeMix,
  })
}
