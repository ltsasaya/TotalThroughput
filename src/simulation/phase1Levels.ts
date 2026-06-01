import type { DifficultyMode, Phase1LevelConfig } from '../types/game'
import { generatePoissonArrivalSchedule, type ScheduledArrival } from './arrival'

type LevelSpec = Omit<Phase1LevelConfig, 'arrivalWindowMs' | 'drainTailMs'> & {
  durationMs: number
}

const MIN_COMPLETED_SAMPLES = 8

const THRESHOLD_BY_REGIME: Record<Phase1LevelConfig['regime'], number> = {
  low: 2.0,
  'moderate-low': 2.5,
  moderate: 3.25,
  'near-saturation': 4.0,
  overload: 4.0,
  'overload-plus': 4.0,
}

function level(spec: Omit<LevelSpec, 'minCompletedSamples' | 'responseThresholdMultiplier'>): Phase1LevelConfig {
  const arrivalWindowMs = Math.round((spec.expectedArrivals / spec.lambda) * 1000)
  return {
    ...spec,
    arrivalWindowMs,
    drainTailMs: Math.max(0, spec.durationMs - arrivalWindowMs),
    minCompletedSamples: MIN_COMPLETED_SAMPLES,
    responseThresholdMultiplier: THRESHOLD_BY_REGIME[spec.regime],
  }
}

const BEGINNER_LEVELS: readonly Phase1LevelConfig[] = [
  level({
    levelId: 'B1',
    label: 'B1 Low load',
    regime: 'low',
    seed: 1047,
    lambda: 0.197,
    referenceLoad: 0.55,
    expectedArrivals: 10,
    durationMs: 59_000,
    isGate: true,
    isDemo: false,
  }),
  level({
    levelId: 'B2',
    label: 'B2 Moderate load',
    regime: 'moderate',
    seed: 11047,
    lambda: 0.269,
    referenceLoad: 0.75,
    expectedArrivals: 12,
    durationMs: 55_000,
    isGate: true,
    isDemo: false,
  }),
  level({
    levelId: 'B3',
    label: 'B3 Near saturation',
    regime: 'near-saturation',
    seed: 22673,
    lambda: 0.322,
    referenceLoad: 0.9,
    expectedArrivals: 12,
    durationMs: 49_000,
    isGate: false,
    isDemo: true,
  }),
]

const STANDARD_LEVELS: readonly Phase1LevelConfig[] = [
  level({
    levelId: 'S1',
    label: 'S1 Low load',
    regime: 'low',
    seed: 1070,
    lambda: 0.251,
    referenceLoad: 0.4,
    expectedArrivals: 12,
    durationMs: 56_000,
    isGate: true,
    isDemo: false,
  }),
  level({
    levelId: 'S2',
    label: 'S2 Moderate-low load',
    regime: 'moderate-low',
    seed: 14941,
    lambda: 0.345,
    referenceLoad: 0.55,
    expectedArrivals: 12,
    durationMs: 43_000,
    isGate: true,
    isDemo: false,
  }),
  level({
    levelId: 'S3',
    label: 'S3 Moderate load',
    regime: 'moderate',
    seed: 22688,
    lambda: 0.47,
    referenceLoad: 0.75,
    expectedArrivals: 14,
    durationMs: 40_000,
    isGate: true,
    isDemo: false,
  }),
  level({
    levelId: 'S4',
    label: 'S4 Near saturation',
    regime: 'near-saturation',
    seed: 31715,
    lambda: 0.564,
    referenceLoad: 0.9,
    expectedArrivals: 16,
    durationMs: 40_000,
    isGate: false,
    isDemo: true,
  }),
  level({
    levelId: 'S5',
    label: 'S5 Overload',
    regime: 'overload',
    seed: 60542,
    lambda: 0.658,
    referenceLoad: 1.05,
    expectedArrivals: 16,
    durationMs: 38_000,
    isGate: false,
    isDemo: true,
  }),
]

const HARD_LEVELS: readonly Phase1LevelConfig[] = [
  level({
    levelId: 'H1',
    label: 'H1 Low load',
    regime: 'low',
    seed: 1101,
    lambda: 0.492,
    referenceLoad: 0.55,
    expectedArrivals: 16,
    durationMs: 41_000,
    isGate: true,
    isDemo: false,
  }),
  level({
    levelId: 'H2',
    label: 'H2 Moderate load',
    regime: 'moderate',
    seed: 11108,
    lambda: 0.671,
    referenceLoad: 0.75,
    expectedArrivals: 16,
    durationMs: 34_000,
    isGate: true,
    isDemo: false,
  }),
  level({
    levelId: 'H3',
    label: 'H3 Near saturation',
    regime: 'near-saturation',
    seed: 22949,
    lambda: 0.806,
    referenceLoad: 0.9,
    expectedArrivals: 16,
    durationMs: 32_000,
    isGate: true,
    isDemo: false,
  }),
  level({
    levelId: 'H4',
    label: 'H4 Overload',
    regime: 'overload',
    seed: 36000,
    lambda: 0.94,
    referenceLoad: 1.05,
    expectedArrivals: 16,
    durationMs: 31_000,
    isGate: false,
    isDemo: true,
  }),
  level({
    levelId: 'H5',
    label: 'H5 Overload+',
    regime: 'overload-plus',
    seed: 69506,
    lambda: 1.074,
    referenceLoad: 1.2,
    expectedArrivals: 16,
    durationMs: 29_000,
    isGate: false,
    isDemo: true,
  }),
]

export function buildPhase1Levels(difficulty: DifficultyMode): Phase1LevelConfig[] {
  if (difficulty === 'beginner') return [...BEGINNER_LEVELS]
  if (difficulty === 'hard') return [...HARD_LEVELS]
  return [...STANDARD_LEVELS]
}

export function phase1LevelDurationMs(level: Phase1LevelConfig): number {
  return level.arrivalWindowMs + level.drainTailMs
}

export function generatePhase1ArrivalSchedule(level: Phase1LevelConfig): ScheduledArrival[] {
  return generatePoissonArrivalSchedule({
    lambdaPerSecond: level.lambda,
    arrivalWindowMs: level.arrivalWindowMs,
    seed: level.seed,
  })
}
