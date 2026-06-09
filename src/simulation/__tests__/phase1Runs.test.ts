import { describe, expect, it } from 'vitest'
import type { CalibrationResult, Phase1DifficultyOption } from '../../types/game'
import type { Task } from '../../types/task'
import {
  buildPhase1RunConfig,
  buildPhase1RunRecord,
  busyTimeWithinWindow,
  generatePhase1RunArrivalSchedule,
  PHASE1_RUN_DURATION_MS,
} from '../phase1Runs'

const CALIBRATION: CalibrationResult = {
  rawWpm: 75,
  effectiveWpm: 75,
  binIndex: 4,
  wpmRange: { min: 75, max: 90, label: '75-90' },
  correctChars: 188,
  typedChars: 190,
  accuracy: 0.99,
  estimatedServiceDemandMs: 2_400,
  reactionSpeedMs: 120,
  durationMs: 30_000,
}

const OPTION: Phase1DifficultyOption = {
  key: 'medium',
  label: 'Medium',
  range: { min: 75, max: 90, label: '75-90' },
  targetLoad: 0.75,
  regime: 'moderate',
  seed: 1234,
}

function completedTask(id: string, arrivalTime: number, serviceStartTime: number, completionTime: number): Task {
  return {
    id,
    arrivalTime,
    size: 'S',
    trueServiceDemand: 0,
    status: 'completed',
    content: 'test task',
    typedContent: 'test task',
    serviceStartTime,
    firstKeystrokeTime: serviceStartTime + 100,
    completionTime,
  }
}

describe('buildPhase1RunConfig', () => {
  it('uses lambda = targetLoad / D', () => {
    const config = buildPhase1RunConfig({ option: OPTION, calibrationResult: CALIBRATION, runIndex: 0 })
    expect(config.lambda).toBeCloseTo(0.75 / 2.4)
    expect(config.arrivalWindowMs).toBe(PHASE1_RUN_DURATION_MS)
    expect(config.expectedArrivals).toBe(Math.round(config.lambda * 60))
  })

  it('generates a deterministic 60-second Poisson schedule', () => {
    const config = buildPhase1RunConfig({ option: OPTION, calibrationResult: CALIBRATION, runIndex: 1 })
    const first = generatePhase1RunArrivalSchedule(config)
    const second = generatePhase1RunArrivalSchedule(config)
    expect(first).toEqual(second)
    expect(first.every(arrival => arrival.arrivalTime < PHASE1_RUN_DURATION_MS)).toBe(true)
  })
})

describe('buildPhase1RunRecord', () => {
  it('records completed-only averages and unfinished work as still waiting', () => {
    const config = buildPhase1RunConfig({ option: OPTION, calibrationResult: CALIBRATION, runIndex: 0 })
    const active: Task = {
      id: 'active',
      arrivalTime: 5_000,
      size: 'S',
      trueServiceDemand: 0,
      status: 'active',
      content: 'queue load',
      typedContent: 'queue',
      serviceStartTime: 55_000,
      firstKeystrokeTime: 55_200,
    }
    const waiting: Task = {
      id: 'waiting',
      arrivalTime: 50_000,
      size: 'S',
      trueServiceDemand: 0,
      status: 'waiting',
      content: 'cache node',
      typedContent: '',
    }
    const tasks = {
      t1: completedTask('t1', 0, 1_000, 3_000),
      t2: completedTask('t2', 4_000, 6_000, 9_000),
      active,
      waiting,
    }

    const record = buildPhase1RunRecord({
      runConfig: config,
      calibrationResult: CALIBRATION,
      tasks,
      maxQueueLength: 2,
    })

    expect(record.completedCount).toBe(2)
    expect(record.stillWaitingCount).toBe(2)
    expect(record.averageServiceDemand).toBe(2_500)
    expect(record.averageResponseTime).toBe(4_000)
    expect(record.reactionSpeed).toBe(100)
    expect(record.utilizationPercent).toBeCloseTo((busyTimeWithinWindow(tasks, 60_000) / 60_000) * 100)
    expect(record.maxQueueLength).toBe(2)
  })
})
