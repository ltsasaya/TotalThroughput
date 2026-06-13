import { describe, expect, it } from 'vitest'
import { HttpError } from './http.js'
import { parsePhase1RunSummaryBody } from './runValidation.js'
import { uuidValue } from './validation.js'

const validRun = {
  difficultyKey: 'easy',
  calibrationWpm: 88,
  calibrationRangeLabel: '75-90',
  calibrationBinIndex: 2,
  targetLoad: 0.25,
  arrivalRate: 0.4,
  expectedArrivals: 24,
  arrivalCount: 22,
  completedCount: 20,
  averageResponseTime: 1400,
  averageServiceDemand: 1200,
  averageTypingSpeed: 84,
  reactionSpeed: 180,
  utilizationPercent: 65,
  averageQueueLength: 1.4,
  maxQueueLength: 4,
  stillWaitingCount: 2,
  durationMs: 60_000,
  serviceDemandEstimateMs: 1200,
  referenceResponseTimeMs: null,
  seed: 12345,
}

describe('run summary validation', () => {
  it('accepts a bounded Phase 1 run summary', () => {
    expect(parsePhase1RunSummaryBody(validRun)).toMatchObject({
      difficultyKey: 'easy',
      classId: null,
      referenceResponseTimeMs: null,
    })
  })

  it('rejects impossible numeric values before persistence', () => {
    expect(() => parsePhase1RunSummaryBody({ ...validRun, calibrationWpm: 999 })).toThrow(HttpError)
    expect(() => parsePhase1RunSummaryBody({ ...validRun, utilizationPercent: -1 })).toThrow(HttpError)
    expect(() => parsePhase1RunSummaryBody({ ...validRun, completedCount: -1 })).toThrow(HttpError)
  })

  it('rejects invalid difficulty keys and malformed UUIDs', () => {
    expect(() => parsePhase1RunSummaryBody({ ...validRun, difficultyKey: 'legendary' })).toThrow(HttpError)
    expect(() => parsePhase1RunSummaryBody({ ...validRun, classId: 'not-a-uuid' })).toThrow(HttpError)
    expect(() => uuidValue('not-a-uuid', 'classId')).toThrow(HttpError)
  })
})
