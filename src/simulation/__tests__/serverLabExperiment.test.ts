import { describe, expect, it } from 'vitest'
import {
  computeServerLabLoadProfile,
  estimateServerLabExperiment,
  runServerLabConcurrencySweep,
  SERVER_LAB_SWEEP_CONCURRENCIES,
} from '../serverLabExperiment'

const BASE_INPUTS = {
  serviceDemandSeconds: 0.5,
  arrivalRatePerSecond: 1.2,
  concurrency: 2,
  durationSeconds: 60,
}

describe('computeServerLabLoadProfile', () => {
  it('classifies stable load bands from per-worker load', () => {
    expect(computeServerLabLoadProfile(BASE_INPUTS).band).toBe('comfortable')
    expect(computeServerLabLoadProfile({ ...BASE_INPUTS, arrivalRatePerSecond: 3 }).band).toBe('busy')
    expect(computeServerLabLoadProfile({ ...BASE_INPUTS, arrivalRatePerSecond: 3.8 }).band).toBe('nearSaturation')
    expect(computeServerLabLoadProfile({ ...BASE_INPUTS, arrivalRatePerSecond: 4 }).band).toBe('unstable')
  })
})

describe('estimateServerLabExperiment', () => {
  it('requires confirmation for unstable inputs without blocking finite runs', () => {
    const estimate = estimateServerLabExperiment({
      ...BASE_INPUTS,
      arrivalRatePerSecond: 4,
    })

    expect(estimate.guardLevel).toBe('confirm')
    expect(estimate.requiresConfirmation).toBe(true)
    expect(estimate.messages).toContain('steady-state M/M/c reference is unstable')
  })

  it('blocks experiments above the browser-side hard budget', () => {
    const estimate = estimateServerLabExperiment({
      ...BASE_INPUTS,
      arrivalRatePerSecond: 20,
      durationSeconds: 3_600,
    })

    expect(estimate.guardLevel).toBe('blocked')
  })
})

describe('runServerLabConcurrencySweep', () => {
  it('runs controlled c = 1, 2, 4, 8 comparisons without chart samples', () => {
    const sweep = runServerLabConcurrencySweep({ ...BASE_INPUTS, seed: 62_056 })

    expect(sweep.map(result => result.concurrency)).toEqual([...SERVER_LAB_SWEEP_CONCURRENCIES])
    expect(new Set(sweep.map(result => result.summary.arrivals)).size).toBe(1)
    expect(sweep[0].seed).toBe(62_056)
  })
})
