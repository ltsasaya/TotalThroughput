import { describe, it, expect } from 'vitest'
import { buildPhase1Levels } from '../phase1Levels'
import { buildPhase1AggregateResult, buildPhase1LevelResult } from '../phase1Results'
import type { Task } from '../../types/task'

const LEVEL = buildPhase1Levels('standard')[0]

function completedTask(id: string, arrivalTime: number, serviceStartTime: number, completionTime: number): Task {
  return {
    id,
    arrivalTime,
    size: 'S',
    trueServiceDemand: 0,
    status: 'completed',
    content: 'test request',
    typedContent: 'test request',
    serviceStartTime,
    firstKeystrokeTime: serviceStartTime + 100,
    completionTime,
  }
}

function waitingTask(id: string, arrivalTime: number): Task {
  return {
    id,
    arrivalTime,
    size: 'S',
    trueServiceDemand: 0,
    status: 'waiting',
    content: 'test request',
    typedContent: '',
  }
}

describe('Phase 1 level results', () => {
  it('passes a gated level when completed samples and response threshold are met', () => {
    const tasks = {
      t1: completedTask('t1', 0, 0, 1000),
      t2: completedTask('t2', 1000, 1000, 2000),
      t3: completedTask('t3', 2000, 2000, 3000),
      t4: completedTask('t4', 3000, 3000, 4000),
      t5: completedTask('t5', 4000, 4000, 5000),
      t6: completedTask('t6', 5000, 5000, 6000),
      t7: completedTask('t7', 6000, 6000, 7000),
      t8: completedTask('t8', 7000, 7000, 8000),
    }
    const result = buildPhase1LevelResult(LEVEL, tasks, 1)
    expect(result.passed).toBe(true)
    expect(result.servedShare).toBe(1)
    expect(result.avgResponseTime).toBe(1000)
  })

  it('passes a gated level with leftover backlog when enough completed samples meet the response threshold', () => {
    const tasks: Record<string, Task> = {
      ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [
        `done${i}`,
        completedTask(`done${i}`, i * 1000, i * 1000, i * 1000 + 1000),
      ])),
      wait1: waitingTask('wait1', 9000),
      wait2: waitingTask('wait2', 10_000),
    }
    const result = buildPhase1LevelResult(LEVEL, tasks, 2)
    expect(result.passed).toBe(true)
    expect(result.unfinishedAtEndCount).toBe(2)
    expect(result.servedShare).toBe(0.8)
  })

  it('fails a gated level when too few samples are completed', () => {
    const tasks: Record<string, Task> = {
      done: completedTask('done', 0, 0, 1000),
      wait1: waitingTask('wait1', 1000),
      wait2: waitingTask('wait2', 2000),
    }
    const result = buildPhase1LevelResult(LEVEL, tasks, 2)
    expect(result.passed).toBe(false)
    expect(result.unfinishedAtEndCount).toBe(2)
  })

  it('records arrival-window, tail, and backlog counts separately', () => {
    const tasks: Record<string, Task> = {
      active: completedTask('active', 0, 0, 1000),
      tail: completedTask('tail', LEVEL.arrivalWindowMs - 500, LEVEL.arrivalWindowMs, LEVEL.arrivalWindowMs + 1000),
      wait: waitingTask('wait', LEVEL.arrivalWindowMs - 250),
    }
    const result = buildPhase1LevelResult(LEVEL, tasks, 2)
    expect(result.activeWindowCompletedCount).toBe(1)
    expect(result.tailCompletedCount).toBe(1)
    expect(result.backlogAtArrivalEndCount).toBe(2)
    expect(result.unfinishedAtEndCount).toBe(1)
  })
})

describe('Phase 1 aggregate results', () => {
  it('unlocks Phase 2 only when all gates pass and enough completions exist', () => {
    const passing = {
      ...buildPhase1LevelResult(
        LEVEL,
        Object.fromEntries(Array.from({ length: 8 }, (_, i) => [
          `t${i}`,
          completedTask(`t${i}`, i * 1000, i * 1000, i * 1000 + 1000),
        ])),
        1,
      ),
      isGate: true,
      passed: true,
    }
    const result = buildPhase1AggregateResult([passing])
    expect(result.passed).toBe(true)
    expect(result.droppedCount).toBe(0)
    expect(result.measuredTasksPerSecond).toBeCloseTo(1)
    expect(result.arrivalRate).toBeCloseTo(result.arrivalCount / (result.arrivalWindowMs / 1000))
  })

  it('keeps Phase 2 locked when a gate fails', () => {
    const failedGate = {
      ...buildPhase1LevelResult(LEVEL, { t1: completedTask('t1', 0, 0, 1000) }, 1),
      isGate: true,
      passed: false,
    }
    const result = buildPhase1AggregateResult([failedGate])
    expect(result.passed).toBe(false)
  })
})
