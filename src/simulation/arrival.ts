import type { TaskSize } from '../types/task'
import type { BucketBudgets } from '../types/game'

export interface ScheduledArrival {
  arrivalTime: number  // ms since game start
  size: TaskSize
}

// Fixed time boundaries for the four named buckets, in ms since phase start.
// A: [0, 5000), B: [5000, 20000), C: [20000, 40000), D: [40000, 50000).
// Nothing spawns after 50s — the 50-60s tail is the "final stretch" for in-flight work.
const BUCKET_BOUNDS: readonly [number, number, number, number, number] =
  [0, 5_000, 20_000, 40_000, 50_000]

// Reference WPM used for Phase 2 no-spawn-zone calculation (universal, not per-difficulty).
export const PHASE2_REFERENCE_WPM = 100

// Average character count per task size, matching content.ts word ranges post-shortening.
// Used only for deriving no-spawn zones; small drift from actual content is acceptable.
const AVG_CHARS: Record<TaskSize, number> = { S: 12, M: 27, L: 53 }

// Workload cost per task size. Buckets budget the total workload they're willing to emit.
// Larger tasks contribute more toward the budget so each bucket's stress level is
// a function of task difficulty, not just raw count.
export const SIZE_WORKLOAD: Record<TaskSize, number> = { S: 1, M: 2, L: 3 }

// Per-bucket size distribution (cumulative thresholds: [S_cum, M_cum, 1.0]).
// Bucket A is S-heavy to ease the player in; Bucket D skews toward L to push the peak.
// No-spawn zones still filter infeasible sizes after sampling — these weights are intent,
// not guarantees.
const BUCKET_SIZE_MIX: ReadonlyArray<readonly [number, number]> = [
  [0.70, 0.95],  // A: 70% S, 25% M, 5% L
  [0.55, 0.90],  // B: 55% S, 35% M, 10% L
  [0.40, 0.80],  // C: 40% S, 40% M, 20% L
  [0.25, 0.65],  // D: 25% S, 40% M, 35% L
]

// No-spawn zone (ms before phase end) for a task of the given size at the reference WPM.
// = expected typing time at that WPM * 1.5 safety buffer.
// WPM uses the standard "5 chars = 1 word" convention, so chars/sec = WPM * 5 / 60.
export function noSpawnZoneMs(size: TaskSize, referenceWPM: number): number {
  const charsPerSec = (referenceWPM * 5) / 60
  const expectedMs = (AVG_CHARS[size] / charsPerSec) * 1000
  return expectedMs * 1.5
}

function sampleSize(mix: readonly [number, number]): TaskSize {
  const r = Math.random()
  if (r < mix[0]) return 'S'
  if (r < mix[1]) return 'M'
  return 'L'
}

// Sample a size by the bucket mix, then accept or resample if invalid at time `t`.
// S is always valid for t < 50000 at reasonable refWPM, so resampling always terminates.
function pickValidSize(
  t: number,
  phaseDuration: number,
  referenceWPM: number,
  mix: readonly [number, number],
): TaskSize {
  for (let attempt = 0; attempt < 10; attempt++) {
    const size = sampleSize(mix)
    if (t < phaseDuration - noSpawnZoneMs(size, referenceWPM)) return size
  }
  return 'S'
}

// Generate arrivals for one bucket: keep drawing tasks until cumulative workload
// reaches the bucket's budget. Each task's size is sampled from the bucket's mix
// (then filtered by no-spawn); its arrival time is uniform within the bucket window.
function generateBucketArrivals(
  bucketStart: number,
  bucketEnd: number,
  budget: number,
  mix: readonly [number, number],
  phaseDuration: number,
  referenceWPM: number,
): ScheduledArrival[] {
  const width = bucketEnd - bucketStart
  const out: ScheduledArrival[] = []
  let workloadSoFar = 0
  // Hard cap defends against any future mix/budget combo that could loop pathologically.
  const hardCap = Math.max(1, Math.ceil(budget)) * 4
  while (workloadSoFar < budget && out.length < hardCap) {
    const raw = bucketStart + Math.random() * width
    const t = Math.min(Math.round(raw), bucketEnd - 1)
    const size = pickValidSize(t, phaseDuration, referenceWPM, mix)
    out.push({ arrivalTime: t, size })
    workloadSoFar += SIZE_WORKLOAD[size]
  }
  return out
}

// Generate a full arrival schedule. Each bucket has a workload budget (units) and a
// size-mix preference; larger task sizes count more toward the budget so the number
// of tasks per run varies slightly but the total workload is stable.
export function generateBucketedArrivalSchedule(
  phaseDuration: number,
  budgets: BucketBudgets,
  referenceWPM: number,
): ScheduledArrival[] {
  const arrivals: ScheduledArrival[] = []
  for (let i = 0; i < 4; i++) {
    const start = BUCKET_BOUNDS[i]
    const end = BUCKET_BOUNDS[i + 1]
    arrivals.push(...generateBucketArrivals(
      start, end, budgets[i], BUCKET_SIZE_MIX[i], phaseDuration, referenceWPM,
    ))
  }
  arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime)
  return arrivals
}

// Sum workload units in a bucket (used by tests to verify budgets).
export function bucketWorkload(arrivals: ScheduledArrival[]): number {
  return arrivals.reduce((sum, a) => sum + SIZE_WORKLOAD[a.size], 0)
}
