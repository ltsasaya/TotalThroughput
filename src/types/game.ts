export type GamePhase = 'idle' | 'phase1' | 'phase2' | 'postrun'

export type DifficultyMode = 'beginner' | 'standard' | 'hard' | 'theory'

// Observable load regimes during a run
export type LoadRegime = 'low' | 'moderate' | 'high'

// Workload budgets (units, not task counts) for the four fixed time buckets of a phase.
// Bucket A: 0-5s (intro), B: 5-20s (training), C: 20-40s (main body), D: 40-50s (peak).
// Each task consumes workload = 1 (S), 2 (M), or 3 (L); a bucket keeps emitting tasks
// until its cumulative workload meets or exceeds the budget. No tasks spawn in 50-60s.
export type BucketBudgets = readonly [number, number, number, number]

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
  phase1Buckets: BucketBudgets  // workload budget per bucket in Phase 1
  phase2Buckets: BucketBudgets  // workload budget per bucket in Phase 2
}
