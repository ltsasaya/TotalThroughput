// Grade levels for secondary performance grades
export type GradeLevel = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

// Live metrics updated each game tick
export interface LiveMetrics {
  throughput: number           // tasks completed per second (rolling window)
  queueLength: number          // tasks currently waiting in queue
  avgWaitingTime: number       // ms — completed-sample average wait before service starts
  avgResponseTime: number      // ms — completed-sample average waiting + service time
  avgServiceTime: number       // ms — completed-sample active processing time per task
  perCoreUtilization: number[] // 0–1 per core (Phase 2 only)
  droppedCount: number         // tasks dropped or expired so far
  completedCount: number       // tasks fully completed so far
  idealThroughput: number      // tasks/sec if all cores stayed fully busy
  actualThroughput: number     // observed completed tasks/sec
  arrivalRate: number          // configured arrivals/sec during the Phase 2 arrival window
  targetPerWorkerLoad: number  // configured Phase 2 reference load lambda * D / c
  avgReactionSpeed?: number    // ms — avg from task activation to first keystroke (Phase 1 only)
  avgTypingSpeed?: number      // WPM — avg (chars/5) / typingMinutes per task (Phase 1 only)
}

export interface Phase1LevelResult {
  levelId: string
  label: string
  regime: string
  lambda: number
  referenceLoad: number
  isGate: boolean
  isDemo: boolean
  passed: boolean
  arrivalCount: number
  completedCount: number
  activeWindowCompletedCount: number
  tailCompletedCount: number
  backlogAtArrivalEndCount: number
  unfinishedAtEndCount: number
  servedShare: number
  avgWaitingTime: number
  avgServiceTime: number
  avgResponseTime: number
  avgReactionSpeed: number
  avgTypingSpeed: number
  maxQueueLength: number
  responseThresholdMs: number
  arrivalWindowMs: number
  drainTailMs: number
  durationMs: number
}

// Captured from Phase 1 calibration levels
export interface Phase1Result {
  measuredTasksPerSecond: number  // calibrated single-worker capacity, 1 / avgServiceTime
  avgServiceTime: number          // ms — completed-sample service demand used for Phase 2 cores
  avgResponseTime: number         // ms — completed-sample avg waitingTime + serviceTime
  arrivalRate: number             // requests/sec generated during Phase 1 arrival windows
  arrivalCount: number
  completedCount: number
  activeWindowCompletedCount: number
  tailCompletedCount: number
  activeWindowThroughput: number
  droppedCount: number
  unfinishedAtEndCount: number
  servedShare: number
  avgReactionSpeed: number
  avgTypingSpeed: number
  passed: boolean
  levelResults: Phase1LevelResult[]
  arrivalWindowMs: number
  drainTailMs: number
  durationMs: number
  failed?: boolean                // legacy compatibility; Phase 1 no longer drops or overflows
}

export interface Phase1RunRecord {
  id: string
  difficultyKey: string
  difficultyLabel: string
  difficultyRangeLabel: string
  calibrationWpm: number
  calibrationRangeLabel: string
  calibrationBinIndex: number
  targetLoad: number
  arrivalRate: number
  expectedArrivals: number
  arrivalCount: number
  completedCount: number
  totalThroughput: number
  actualThroughput: number
  averageResponseTime: number
  averageServiceDemand: number
  averageTypingSpeed: number
  reactionSpeed: number
  utilizationPercent: number
  maxQueueLength: number
  stillWaitingCount: number
  durationMs: number
  serviceDemandEstimateMs: number
  referenceResponseTimeMs: number | null
  seed: number
}

// Time-series data point (used in post-run graphs)
export interface TimePoint {
  time: number    // ms since run start
  value: number
}

// Full summary computed at run end
export interface RunSummary {
  arrivalRate: number
  arrivalCount: number
  expectedArrivals: number
  targetPerWorkerLoad: number
  serviceDemandMs: number
  completedTasks: number
  droppedTasks: number
  unfinishedAtEndCount: number
  avgWaitingTime: number
  maxWaitingTime: number
  avgResponseTime: number
  maxResponseTime: number
  avgServiceTime: number
  perCoreUtilization: number[]
  throughputHistory: TimePoint[]
  queueLengthHistory: TimePoint[]
  idealThroughput: number
  actualThroughput: number
  // Score
  score: number
  latencyGrade: GradeLevel
  utilizationGrade: GradeLevel
  throughputGrade: GradeLevel
  efficiencyGrade: GradeLevel
  // Run outcome
  failed: boolean
  survivedMs: number
  idleWasteMs: number
}
