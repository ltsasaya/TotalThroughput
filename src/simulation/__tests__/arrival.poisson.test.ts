import { describe, expect, it } from 'vitest'
import { generatePoissonArrivalSchedule } from '../arrival'

describe('generatePoissonArrivalSchedule', () => {
  it('returns the same schedule for the same seed', () => {
    const options = {
      lambdaPerSecond: 0.5,
      arrivalWindowMs: 60_000,
      seed: 12_345,
    }

    expect(generatePoissonArrivalSchedule(options)).toEqual(generatePoissonArrivalSchedule(options))
  })

  it('changes the schedule when the seed changes', () => {
    const baseOptions = {
      lambdaPerSecond: 0.5,
      arrivalWindowMs: 60_000,
    }

    expect(generatePoissonArrivalSchedule({ ...baseOptions, seed: 1 })).not.toEqual(
      generatePoissonArrivalSchedule({ ...baseOptions, seed: 2 }),
    )
  })

  it('emits sorted arrivals within the arrival window', () => {
    const schedule = generatePoissonArrivalSchedule({
      lambdaPerSecond: 0.75,
      arrivalWindowMs: 45_000,
      seed: 22_688,
    })

    expect(schedule.length).toBeGreaterThan(0)
    for (let i = 0; i < schedule.length; i++) {
      expect(schedule[i].arrivalTime).toBeGreaterThanOrEqual(0)
      expect(schedule[i].arrivalTime).toBeLessThan(45_000)
      if (i > 0) {
        expect(schedule[i].arrivalTime).toBeGreaterThanOrEqual(schedule[i - 1].arrivalTime)
      }
    }
  })

  it('keeps the average count near lambda times the arrival window', () => {
    const schedule = generatePoissonArrivalSchedule({
      lambdaPerSecond: 0.5,
      arrivalWindowMs: 120_000,
      seed: 1_234,
    })

    expect(schedule.length).toBeGreaterThanOrEqual(40)
    expect(schedule.length).toBeLessThanOrEqual(80)
  })

  it('defaults to the legacy short-prompt size bucket when no size mix is supplied', () => {
    const schedule = generatePoissonArrivalSchedule({
      lambdaPerSecond: 1,
      arrivalWindowMs: 30_000,
      seed: 1_070,
    })

    expect(schedule.length).toBeGreaterThan(0)
    expect(schedule.every(arrival => arrival.size === 'S')).toBe(true)
  })

  it('supports weighted size mixes when a later phase needs them', () => {
    const schedule = generatePoissonArrivalSchedule({
      lambdaPerSecond: 2,
      arrivalWindowMs: 60_000,
      seed: 2_468,
      sizeMix: [
        { size: 'S', weight: 9 },
        { size: 'M', weight: 1 },
      ],
    })

    const sCount = schedule.filter(arrival => arrival.size === 'S').length
    expect(sCount / schedule.length).toBeGreaterThan(0.8)
  })

  it('matches a researched Phase 1 seed/count pair', () => {
    const schedule = generatePoissonArrivalSchedule({
      lambdaPerSecond: 0.197,
      arrivalWindowMs: Math.round((10 / 0.197) * 1000),
      seed: 1_047,
    })

    expect(schedule).toHaveLength(10)
  })

  it('rejects invalid schedule parameters', () => {
    expect(() => generatePoissonArrivalSchedule({
      lambdaPerSecond: 0,
      arrivalWindowMs: 60_000,
      seed: 1,
    })).toThrow(RangeError)

    expect(() => generatePoissonArrivalSchedule({
      lambdaPerSecond: 1,
      arrivalWindowMs: 0,
      seed: 1,
    })).toThrow(RangeError)

    expect(() => generatePoissonArrivalSchedule({
      lambdaPerSecond: 1,
      arrivalWindowMs: 60_000,
      seed: 1,
      sizeMix: [],
    })).toThrow(RangeError)
  })
})
