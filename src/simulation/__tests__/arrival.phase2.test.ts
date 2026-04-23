import { describe, it, expect } from 'vitest'
import { generateBucketedArrivalSchedule, noSpawnZoneMs, PHASE2_REFERENCE_WPM, SIZE_WORKLOAD } from '../arrival'
import type { BucketBudgets } from '../../types/game'

const PHASE2_DURATION = 120_000
const P2_BEGINNER: BucketBudgets = [1, 3, 9, 8]
const P2_STANDARD: BucketBudgets = [1, 6, 14, 15]
const P2_HARD: BucketBudgets = [3, 8, 23, 25]

function workloadInWindow(
  schedule: Array<{ arrivalTime: number; size: 'S' | 'M' | 'L' }>,
  start: number,
  end: number,
): number {
  return schedule
    .filter(a => a.arrivalTime >= start && a.arrivalTime < end)
    .reduce((sum, a) => sum + SIZE_WORKLOAD[a.size], 0)
}

describe('generateBucketedArrivalSchedule — Phase 2', () => {
  it('returns an array', () => {
    expect(Array.isArray(generateBucketedArrivalSchedule(PHASE2_DURATION, P2_STANDARD, PHASE2_REFERENCE_WPM))).toBe(true)
  })

  it('each bucket emits at least its workload budget across all difficulties', () => {
    const difficulties: BucketBudgets[] = [P2_BEGINNER, P2_STANDARD, P2_HARD]
    for (const budgets of difficulties) {
      for (let run = 0; run < 10; run++) {
        const schedule = generateBucketedArrivalSchedule(PHASE2_DURATION, budgets, PHASE2_REFERENCE_WPM)
        expect(workloadInWindow(schedule, 0, 5_000)).toBeGreaterThanOrEqual(budgets[0])
        expect(workloadInWindow(schedule, 5_000, 20_000)).toBeGreaterThanOrEqual(budgets[1])
        expect(workloadInWindow(schedule, 20_000, 40_000)).toBeGreaterThanOrEqual(budgets[2])
        expect(workloadInWindow(schedule, 40_000, 50_000)).toBeGreaterThanOrEqual(budgets[3])
      }
    }
  })

  it('bucket overshoot stays below 3 workload units (hard budgets)', () => {
    for (let run = 0; run < 20; run++) {
      const schedule = generateBucketedArrivalSchedule(PHASE2_DURATION, P2_HARD, PHASE2_REFERENCE_WPM)
      const bounds: Array<[number, number]> = [[0, 5_000], [5_000, 20_000], [20_000, 40_000], [40_000, 50_000]]
      for (let i = 0; i < 4; i++) {
        const work = workloadInWindow(schedule, bounds[i][0], bounds[i][1])
        expect(work - P2_HARD[i]).toBeLessThan(3)
      }
    }
  })

  it('all arrival times fall within [0, 50000)', () => {
    const schedule = generateBucketedArrivalSchedule(PHASE2_DURATION, P2_HARD, PHASE2_REFERENCE_WPM)
    for (const a of schedule) {
      expect(a.arrivalTime).toBeGreaterThanOrEqual(0)
      expect(a.arrivalTime).toBeLessThan(50_000)
    }
  })

  it('schedule is sorted ascending', () => {
    const schedule = generateBucketedArrivalSchedule(PHASE2_DURATION, P2_STANDARD, PHASE2_REFERENCE_WPM)
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].arrivalTime).toBeGreaterThanOrEqual(schedule[i - 1].arrivalTime)
    }
  })

  it('no task spawns within its size-specific no-spawn zone (universal refWPM=100)', () => {
    for (let run = 0; run < 20; run++) {
      const schedule = generateBucketedArrivalSchedule(PHASE2_DURATION, P2_HARD, PHASE2_REFERENCE_WPM)
      for (const a of schedule) {
        const cutoff = PHASE2_DURATION - noSpawnZoneMs(a.size, PHASE2_REFERENCE_WPM)
        expect(a.arrivalTime).toBeLessThan(cutoff)
      }
    }
  })

  it('bucket D average workload-per-task exceeds bucket A (harder skew at peak)', () => {
    let sumA = 0, nA = 0, sumD = 0, nD = 0
    for (let run = 0; run < 100; run++) {
      const schedule = generateBucketedArrivalSchedule(PHASE2_DURATION, P2_HARD, PHASE2_REFERENCE_WPM)
      for (const a of schedule) {
        if (a.arrivalTime < 5_000) { sumA += SIZE_WORKLOAD[a.size]; nA++ }
        else if (a.arrivalTime >= 40_000) { sumD += SIZE_WORKLOAD[a.size]; nD++ }
      }
    }
    expect(sumD / nD).toBeGreaterThan(sumA / nA)
  })
})
