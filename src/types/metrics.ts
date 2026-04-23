// Grade levels for secondary performance grades
export type GradeLevel = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

// Live metrics updated each game tick
export interface LiveMetrics {
  throughput: number           // tasks completed per second (rolling window)
  queueLength: number          // tasks currently waiting in queue
  avgWaitingTime: number       // ms — average time tasks wait before service starts
  avgResponseTime: number      // ms — average waiting + service time
  avgServiceTime: number       // ms — average active processing time per task
  perCoreUtilization: number[] // 0–1 per core (Phase 2 only)
  droppedCount: number         // tasks dropped or expired so far
  completedCount: number       // tasks fully completed so far
  idealThroughput: number      // tasks/sec if all cores stayed fully busy
  actualThroughput: number     // observed completed tasks/sec
  avgReactionSpeed?: number    // ms — avg from task activation to first keystroke (Phase 1 only)
  avgTypingSpeed?: number      // WPM — avg (chars/5) / typingMinutes per task (Phase 1 only)
}

// Captured from Phase 1 calibration run
export interface Phase1Result {
  measuredTasksPerSecond: number  // player's observed service rate
  avgServiceTime: number          // ms — used as per-task processing time for Phase 2 cores
  avgResponseTime: number         // ms — avg (waitingTime + serviceTime) per completed task
  completedCount: number
  droppedCount: number
  avgReactionSpeed: number
  avgTypingSpeed: number
  failed?: boolean                // true if run ended due to queue overflow or drop limit
}

// Time-series data point (used in post-run graphs)
export interface TimePoint {
  time: number    // ms since run start
  value: number
}

// Full summary computed at run end
export interface RunSummary {
  completedTasks: number
  droppedTasks: number
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
