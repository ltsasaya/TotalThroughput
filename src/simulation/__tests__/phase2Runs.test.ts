import { describe, expect, it } from 'vitest'
import {
  buildPhase2RunConfig,
  generatePhase2ArrivalSchedule,
  phase2WorkerCount,
  PHASE2_DURATION_MS,
} from '../phase2Runs'

describe('Phase 2 run config', () => {
  it('uses difficulty worker counts from the Phase 2 MVP tuning', () => {
    expect(phase2WorkerCount('beginner')).toBe(4)
    expect(phase2WorkerCount('standard')).toBe(4)
    expect(phase2WorkerCount('hard')).toBe(6)
    expect(phase2WorkerCount('theory')).toBe(4)
  })

  it('derives lambda from target per-worker load, workers, and measured D', () => {
    const run = buildPhase2RunConfig('standard', 2_000)

    expect(run.targetPerWorkerLoad).toBe(0.70)
    expect(run.lambda).toBeCloseTo(1.4)
    expect(run.expectedArrivals).toBe(Math.round(1.4 * 60))
  })

  it('falls back to a finite service demand when calibration is invalid', () => {
    const run = buildPhase2RunConfig('beginner', 0)

    expect(run.serviceDemandMs).toBeGreaterThan(0)
    expect(run.lambda).toBeGreaterThan(0)
  })

  it('uses one full-window constant-rate arrival process', () => {
    const run = buildPhase2RunConfig('hard', 3_000)

    expect(run.arrivalWindowMs).toBe(PHASE2_DURATION_MS)
    expect(run.lambda).toBeCloseTo((0.85 * 6) / 3)
  })
})

describe('generatePhase2ArrivalSchedule', () => {
  it('returns the same schedule for the same run config', () => {
    const run = buildPhase2RunConfig('standard', 2_500)

    expect(generatePhase2ArrivalSchedule(run)).toEqual(generatePhase2ArrivalSchedule(run))
  })

  it('emits sorted arrivals inside the configured window', () => {
    const run = buildPhase2RunConfig('beginner', 2_500)
    const schedule = generatePhase2ArrivalSchedule(run)

    expect(schedule.length).toBeGreaterThan(0)
    for (let i = 0; i < schedule.length; i++) {
      expect(schedule[i].arrivalTime).toBeGreaterThanOrEqual(0)
      expect(schedule[i].arrivalTime).toBeLessThan(run.arrivalWindowMs)
      if (i > 0) {
        expect(schedule[i].arrivalTime).toBeGreaterThanOrEqual(schedule[i - 1].arrivalTime)
      }
    }
  })

  it('uses a wider S/M/L size mix for Phase 2', () => {
    const run = buildPhase2RunConfig('hard', 2_000)
    const schedule = generatePhase2ArrivalSchedule(run)
    const sizes = new Set(schedule.map(arrival => arrival.size))

    expect(sizes.has('S')).toBe(true)
    expect(sizes.has('M')).toBe(true)
    expect(sizes.has('L')).toBe(true)
  })
})
