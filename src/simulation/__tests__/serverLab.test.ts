import { describe, expect, it } from 'vitest'
import {
  computeMmCSteadyState,
  runServerLabSimulation,
  SERVER_LAB_LIMITS,
} from '../serverLab'

const BASE_INPUTS = {
  serviceDemandSeconds: 0.5,
  arrivalRatePerSecond: 1.2,
  concurrency: 2,
  durationSeconds: 60,
  seed: 62_056,
}

describe('runServerLabSimulation', () => {
  it('is deterministic for the same seed and inputs', () => {
    const first = runServerLabSimulation(BASE_INPUTS)
    const second = runServerLabSimulation(BASE_INPUTS)

    expect(second.jobs).toEqual(first.jobs)
    expect(second.samples).toEqual(first.samples)
    expect(second.displaySampleCount).toBeLessThanOrEqual(SERVER_LAB_LIMITS.maxDisplaySamples)
    expect(second.summary).toEqual(first.summary)
  })

  it('uses the seed to create different finite runs', () => {
    const first = runServerLabSimulation(BASE_INPUTS)
    const second = runServerLabSimulation({ ...BASE_INPUTS, seed: 62_057 })

    expect(second.jobs).not.toEqual(first.jobs)
  })

  it('reduces response time when the same workload has more workers', () => {
    const oneWorker = runServerLabSimulation({
      ...BASE_INPUTS,
      arrivalRatePerSecond: 1.5,
      concurrency: 1,
      durationSeconds: 120,
    })
    const fourWorkers = runServerLabSimulation({
      ...BASE_INPUTS,
      arrivalRatePerSecond: 1.5,
      concurrency: 4,
      durationSeconds: 120,
    })

    expect(fourWorkers.summary.averageResponseTime).not.toBeNull()
    expect(oneWorker.summary.averageResponseTime).not.toBeNull()
    expect(fourWorkers.summary.averageResponseTime!).toBeLessThan(oneWorker.summary.averageResponseTime!)
  })

  it('rejects simulations that would generate too many arrivals', () => {
    expect(() => runServerLabSimulation({
      ...BASE_INPUTS,
      arrivalRatePerSecond: 10,
      durationSeconds: SERVER_LAB_LIMITS.maxDurationSeconds,
      seed: 1,
    })).not.toThrow()

    expect(() => runServerLabSimulation({
      ...BASE_INPUTS,
      arrivalRatePerSecond: SERVER_LAB_LIMITS.maxArrivalRatePerSecond,
      durationSeconds: SERVER_LAB_LIMITS.maxDurationSeconds,
      seed: 1,
    })).toThrow(RangeError)
  })

  it('uses time-weighted run-level averages over the observation window', () => {
    const run = runServerLabSimulation({ ...BASE_INPUTS, durationSeconds: 120 })
    const durationSeconds = run.inputs.durationSeconds
    const queueArea = run.jobs.reduce((sum, job) => {
      return sum + Math.max(0, Math.min(job.serviceStartTime, durationSeconds) - job.arrivalTime)
    }, 0)
    const systemArea = run.jobs.reduce((sum, job) => {
      return sum + Math.max(0, Math.min(job.completionTime, durationSeconds) - job.arrivalTime)
    }, 0)
    const busySeconds = run.jobs.reduce((sum, job) => {
      return sum + Math.max(0, Math.min(job.completionTime, durationSeconds) - job.serviceStartTime)
    }, 0)

    expect(run.summary.averageQueueLength).toBeCloseTo(queueArea / durationSeconds)
    expect(run.summary.averageSystemCount).toBeCloseTo(systemArea / durationSeconds)
    expect(run.summary.averageUtilization).toBeCloseTo(busySeconds / (run.inputs.concurrency * durationSeconds))
  })

  it('leaves response time undefined until at least one request completes', () => {
    const run = runServerLabSimulation({
      serviceDemandSeconds: 30,
      arrivalRatePerSecond: 0.01,
      concurrency: 1,
      durationSeconds: 5,
      seed: 1,
    })

    expect(run.summary.completedWithinWindow).toBe(0)
    expect(run.summary.averageResponseTime).toBeNull()
    expect(run.samples.every(sample => sample.responseTime === null)).toBe(true)
  })
})

describe('computeMmCSteadyState', () => {
  it('computes an Erlang C M/M/c reference for stable inputs', () => {
    const reference = computeMmCSteadyState(BASE_INPUTS)

    expect(reference.stable).toBe(true)
    expect(reference.offeredLoad).toBeCloseTo(0.6)
    expect(reference.utilization).toBeCloseTo(0.3)
    expect(reference.waitProbability).toBeCloseTo(0.13846, 4)
    expect(reference.responseTime).toBeCloseTo(0.54945, 4)
    expect(reference.systemCount).toBeCloseTo(0.65934, 4)
  })

  it('marks the steady-state reference unstable at or above capacity', () => {
    const reference = computeMmCSteadyState({
      serviceDemandSeconds: 0.5,
      arrivalRatePerSecond: 3,
      concurrency: 1,
    })

    expect(reference.stable).toBe(false)
    expect(reference.responseTime).toBeNull()
    expect(reference.systemCount).toBeNull()
  })
})
