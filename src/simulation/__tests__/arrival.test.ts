import { describe, it, expect } from 'vitest'
import { generateBucketedArrivalSchedule, noSpawnZoneMs, SIZE_WORKLOAD } from '../arrival'
import type { BucketBudgets } from '../../types/game'

const PHASE1_DURATION = 60_000
const STANDARD_BUDGETS: BucketBudgets = [1, 3, 4, 6]
const BEGINNER_BUDGETS: BucketBudgets = [1, 2, 4, 4]
const HARD_BUDGETS: BucketBudgets = [3, 5, 5, 8]

function workloadInWindow(
  schedule: Array<{ arrivalTime: number; size: 'S' | 'M' | 'L' }>,
  start: number,
  end: number,
): number {
  return schedule
    .filter(a => a.arrivalTime >= start && a.arrivalTime < end)
    .reduce((sum, a) => sum + SIZE_WORKLOAD[a.size], 0)
}

describe('generateBucketedArrivalSchedule — Phase 1', () => {
  it('returns an array', () => {
    const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, STANDARD_BUDGETS, 70)
    expect(Array.isArray(schedule)).toBe(true)
  })

  it('each bucket emits at least its workload budget (S=1/M=2/L=3)', () => {
    for (let run = 0; run < 20; run++) {
      const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, STANDARD_BUDGETS, 70)
      expect(workloadInWindow(schedule, 0, 5_000)).toBeGreaterThanOrEqual(STANDARD_BUDGETS[0])
      expect(workloadInWindow(schedule, 5_000, 20_000)).toBeGreaterThanOrEqual(STANDARD_BUDGETS[1])
      expect(workloadInWindow(schedule, 20_000, 40_000)).toBeGreaterThanOrEqual(STANDARD_BUDGETS[2])
      expect(workloadInWindow(schedule, 40_000, 50_000)).toBeGreaterThanOrEqual(STANDARD_BUDGETS[3])
    }
  })

  it('each bucket does not vastly overshoot its budget (overshoot < 3 per bucket)', () => {
    for (let run = 0; run < 20; run++) {
      const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, HARD_BUDGETS, 100)
      for (let i = 0; i < 4; i++) {
        const start = [0, 5_000, 20_000, 40_000][i]
        const end = [5_000, 20_000, 40_000, 50_000][i]
        const work = workloadInWindow(schedule, start, end)
        expect(work - HARD_BUDGETS[i]).toBeLessThan(3)
      }
    }
  })

  it('all arrival times fall within [0, 50000)', () => {
    const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, STANDARD_BUDGETS, 70)
    for (const a of schedule) {
      expect(a.arrivalTime).toBeGreaterThanOrEqual(0)
      expect(a.arrivalTime).toBeLessThan(50_000)
    }
  })

  it('schedule is sorted ascending by arrivalTime', () => {
    const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, STANDARD_BUDGETS, 70)
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].arrivalTime).toBeGreaterThanOrEqual(schedule[i - 1].arrivalTime)
    }
  })

  it('all sizes are valid', () => {
    const valid = new Set(['S', 'M', 'L'])
    const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, STANDARD_BUDGETS, 70)
    for (const a of schedule) expect(valid.has(a.size)).toBe(true)
  })

  it('no size spawns within its own no-spawn zone at refWPM=70', () => {
    for (let run = 0; run < 20; run++) {
      const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, STANDARD_BUDGETS, 70)
      for (const a of schedule) {
        const cutoff = PHASE1_DURATION - noSpawnZoneMs(a.size, 70)
        expect(a.arrivalTime).toBeLessThan(cutoff)
      }
    }
  })

  it('beginner refWPM=40 still produces only size-valid arrivals', () => {
    for (let run = 0; run < 20; run++) {
      const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, BEGINNER_BUDGETS, 40)
      for (const a of schedule) {
        const cutoff = PHASE1_DURATION - noSpawnZoneMs(a.size, 40)
        expect(a.arrivalTime).toBeLessThan(cutoff)
      }
    }
  })

  it('bucket A (intro) skews S-heavy: aggregate S share > 50% over many runs', () => {
    const counts = { S: 0, M: 0, L: 0 }
    for (let run = 0; run < 100; run++) {
      const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, HARD_BUDGETS, 100)
      for (const a of schedule.filter(x => x.arrivalTime < 5_000)) counts[a.size]++
    }
    const total = counts.S + counts.M + counts.L
    expect(counts.S / total).toBeGreaterThan(0.5)
  })

  it('bucket D (peak) skews harder than bucket A: mean workload-per-task higher', () => {
    let sumA = 0, nA = 0, sumD = 0, nD = 0
    for (let run = 0; run < 100; run++) {
      const schedule = generateBucketedArrivalSchedule(PHASE1_DURATION, HARD_BUDGETS, 100)
      for (const a of schedule) {
        if (a.arrivalTime < 5_000) { sumA += SIZE_WORKLOAD[a.size]; nA++ }
        else if (a.arrivalTime >= 40_000) { sumD += SIZE_WORKLOAD[a.size]; nD++ }
      }
    }
    const avgA = sumA / nA
    const avgD = sumD / nD
    expect(avgD).toBeGreaterThan(avgA)
  })
})
