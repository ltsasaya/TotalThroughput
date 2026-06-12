import type { TaskSize } from './task'

export type GamePhase =
  | 'idle'
  | 'calibration'
  | 'calibrationSummary'
  | 'difficultySelect'
  | 'simulationLab'
  | 'concurrencyRaceSample'
  | 'auth'
  | 'profile'
  | 'instructorDashboard'
  | 'classDashboard'
  | 'joinClass'
  | 'globalData'
  | 'phase1'
  | 'phase1Summary'
  | 'phase2'
  | 'postrun'

export type DifficultyMode = 'beginner' | 'standard' | 'hard' | 'theory'
export type Phase1DifficultyKey = 'easy' | 'medium' | 'hard' | 'impossible'

// Observable load regimes during a run
export type LoadRegime = 'low' | 'moderate' | 'high'

export type Phase2LoadRegime = 'low' | 'moderate' | 'near-saturation'

export type Phase1LoadRegime =
  | 'low'
  | 'moderate-low'
  | 'moderate'
  | 'near-saturation'
  | 'overload'
  | 'overload-plus'

export interface Phase1LevelConfig {
  levelId: string
  label: string
  regime: Phase1LoadRegime
  seed: number
  lambda: number              // requests/sec during the arrival window
  referenceLoad: number       // reference rho = lambda * D_ref
  expectedArrivals: number
  arrivalWindowMs: number
  drainTailMs: number
  minCompletedSamples: number
  responseThresholdMultiplier: number
  isGate: boolean
  isDemo: boolean
}

export interface WpmRange {
  min: number
  max: number
  label: string
}

export interface CalibrationResult {
  rawWpm: number
  effectiveWpm: number
  binIndex: number
  wpmRange: WpmRange
  correctChars: number
  typedChars: number
  accuracy: number
  estimatedServiceDemandMs: number
  reactionSpeedMs: number
  durationMs: number
}

export interface Phase1DifficultyOption {
  key: Phase1DifficultyKey
  label: string
  range: WpmRange
  targetLoad: number
  regime: 'low' | 'moderate' | 'high' | 'near-saturation' | 'overload'
  seed: number
}

export interface Phase1RunConfig {
  difficulty: Phase1DifficultyOption
  seed: number
  lambda: number
  targetLoad: number
  expectedArrivals: number
  arrivalWindowMs: number
  serviceDemandMs: number
  calibrationWpm: number
  calibrationBinIndex: number
}

export interface Phase2SizeWeight {
  size: TaskSize
  weight: number
}

export interface Phase2RunConfig {
  label: string
  regime: Phase2LoadRegime
  seed: number
  lambda: number              // requests/sec during the run's arrival window
  targetPerWorkerLoad: number // reference load = lambda * D_player / workerCount
  expectedArrivals: number
  arrivalWindowMs: number
  serviceDemandMs: number     // Phase 1 measured D used as each worker's baseline
  sizeMix: readonly Phase2SizeWeight[]
}

export interface GameConfig {
  difficulty: DifficultyMode
  phase2CoreCount: number       // 4 | 6 | 8
  phase1Duration: number        // ms
  phase2Duration: number        // ms
  queueSizeLimit: number        // tasks in queue before failure
  dropLimit: number             // total drops/expirations before failure
  showTrueServiceDemand: boolean // theory mode: reveal exact task runtimes
  deadlineMultiplier: number    // scales task deadline windows (1.0 = standard)
  referenceWPM: number          // reference typing speed for size no-spawn zones (Phase 1)
  phase1Levels: readonly Phase1LevelConfig[]
  phase2Run: Phase2RunConfig
}
