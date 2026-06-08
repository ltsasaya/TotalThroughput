import type { TaskSize } from '../types/task'

export interface ScheduledArrival {
  arrivalTime: number  // ms since game start
  size: TaskSize
}

export interface ArrivalSizeWeight {
  size: TaskSize
  weight: number
}

export interface PoissonArrivalScheduleOptions {
  lambdaPerSecond: number
  arrivalWindowMs: number
  seed: number
  sizeMix?: readonly ArrivalSizeWeight[]
}

const DEFAULT_POISSON_SIZE_MIX: readonly ArrivalSizeWeight[] = [
  { size: 'S', weight: 1 },
]

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function sampleExponentialMs(random: () => number, lambdaPerSecond: number): number {
  const u = Math.max(Number.MIN_VALUE, 1 - random())
  return (-Math.log(u) / lambdaPerSecond) * 1000
}

function normalizeSizeMix(sizeMix: readonly ArrivalSizeWeight[]): readonly ArrivalSizeWeight[] {
  if (sizeMix.length === 0) throw new RangeError('sizeMix must include at least one size')
  let totalWeight = 0
  for (const entry of sizeMix) {
    if (entry.weight <= 0 || !Number.isFinite(entry.weight)) {
      throw new RangeError('sizeMix weights must be finite positive numbers')
    }
    totalWeight += entry.weight
  }
  return sizeMix.map(entry => ({ ...entry, weight: entry.weight / totalWeight }))
}

function sampleWeightedSize(random: () => number, sizeMix: readonly ArrivalSizeWeight[]): TaskSize {
  const r = random()
  let cumulative = 0
  for (const entry of sizeMix) {
    cumulative += entry.weight
    if (r < cumulative) return entry.size
  }
  return sizeMix[sizeMix.length - 1].size
}

// Generate one constant-rate seeded Poisson schedule. Arrivals are emitted only
// inside the arrival window; any drain-tail timing is handled by the caller.
export function generatePoissonArrivalSchedule({
  lambdaPerSecond,
  arrivalWindowMs,
  seed,
  sizeMix = DEFAULT_POISSON_SIZE_MIX,
}: PoissonArrivalScheduleOptions): ScheduledArrival[] {
  if (lambdaPerSecond <= 0 || !Number.isFinite(lambdaPerSecond)) {
    throw new RangeError('lambdaPerSecond must be a finite positive number')
  }
  if (arrivalWindowMs <= 0 || !Number.isFinite(arrivalWindowMs)) {
    throw new RangeError('arrivalWindowMs must be a finite positive number')
  }

  const arrivalRandom = createSeededRandom(seed)
  const sizeRandom = createSeededRandom(seed ^ 0x9e37_79b9)
  const normalizedSizeMix = normalizeSizeMix(sizeMix)
  const arrivals: ScheduledArrival[] = []
  let arrivalTime = 0

  while (true) {
    arrivalTime += sampleExponentialMs(arrivalRandom, lambdaPerSecond)
    if (arrivalTime >= arrivalWindowMs) break

    arrivals.push({
      arrivalTime: Math.round(arrivalTime),
      size: sampleWeightedSize(sizeRandom, normalizedSizeMix),
    })
  }

  return arrivals
}
