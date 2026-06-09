import { describe, expect, it } from 'vitest'
import type { Phase1RunConfig } from '../../types/game'
import type { LiveMetrics } from '../../types/metrics'
import type { Task } from '../../types/task'
import { computePhase1RunTick, type Phase1RunTickInput } from '../phase1Tick'
import { PHASE1_RUN_DURATION_MS } from '../phase1Runs'

const RUN_CONFIG: Phase1RunConfig = {
  difficulty: {
    key: 'medium',
    label: 'Medium',
    range: { min: 75, max: 90, label: '75-90' },
    targetLoad: 0.75,
    regime: 'moderate',
    seed: 123,
  },
  seed: 123,
  lambda: 0.3,
  targetLoad: 0.75,
  expectedArrivals: 18,
  arrivalWindowMs: PHASE1_RUN_DURATION_MS,
  serviceDemandMs: 2_500,
  calibrationWpm: 75,
  calibrationBinIndex: 4,
}

const BASE_METRICS: LiveMetrics = {
  throughput: 0,
  queueLength: 0,
  avgWaitingTime: 0,
  avgResponseTime: 0,
  avgServiceTime: 0,
  perCoreUtilization: [],
  droppedCount: 0,
  completedCount: 0,
  idealThroughput: 0,
  actualThroughput: 0,
  arrivalRate: 0,
  targetPerWorkerLoad: 0,
}

function input(overrides: Partial<Phase1RunTickInput> = {}): Phase1RunTickInput {
  return {
    tasks: {},
    queue: [],
    activePhase1TaskId: null,
    liveMetrics: { ...BASE_METRICS },
    arrivalSchedule: [],
    nextArrivalIndex: 0,
    phase1MaxQueueLength: 0,
    phase1RunConfig: RUN_CONFIG,
    ...overrides,
  }
}

function waitingTask(id: string): Task {
  return {
    id,
    arrivalTime: 0,
    size: 'S',
    trueServiceDemand: 0,
    status: 'waiting',
    content: 'test task',
    typedContent: '',
  }
}

function completedTask(id: string, serviceStartTime: number, completionTime: number): Task {
  return {
    id,
    arrivalTime: 0,
    size: 'S',
    trueServiceDemand: 0,
    status: 'completed',
    content: 'test',
    typedContent: 'test',
    serviceStartTime,
    firstKeystrokeTime: serviceStartTime + 100,
    completionTime,
  }
}

describe('computePhase1RunTick', () => {
  it('spawns elapsed arrivals and activates the first waiting request', () => {
    const output = computePhase1RunTick(input({
      arrivalSchedule: [
        { arrivalTime: 100, size: 'S' },
        { arrivalTime: 200, size: 'S' },
      ],
    }), 250)

    expect(Object.values(output.tasks)).toHaveLength(2)
    expect(output.activePhase1TaskId).not.toBeNull()
    expect(output.queue).toHaveLength(1)
    expect(output.nextArrivalIndex).toBe(2)
  })

  it('ends exactly at the 60-second observation window', () => {
    expect(computePhase1RunTick(input(), PHASE1_RUN_DURATION_MS - 1).runEnded).toBe(false)
    expect(computePhase1RunTick(input(), PHASE1_RUN_DURATION_MS).runEnded).toBe(true)
  })

  it('does not drop unfinished work at run end', () => {
    const active: Task = { ...waitingTask('active'), status: 'active', serviceStartTime: 1000, typedContent: 'te' }
    const output = computePhase1RunTick(input({
      tasks: { active, waiting: waitingTask('waiting') },
      queue: ['waiting'],
      activePhase1TaskId: 'active',
    }), PHASE1_RUN_DURATION_MS)

    expect(output.tasks.active.status).toBe('active')
    expect(output.tasks.waiting.status).toBe('waiting')
    expect(output.liveMetrics.droppedCount).toBe(0)
  })

  it('computes completed-only metrics and live utilization', () => {
    const output = computePhase1RunTick(input({
      tasks: {
        done: completedTask('done', 1000, 4000),
        active: { ...waitingTask('active'), status: 'active', serviceStartTime: 8000 },
      },
      activePhase1TaskId: 'active',
    }), 10_000)

    expect(output.liveMetrics.completedCount).toBe(1)
    expect(output.liveMetrics.avgWaitingTime).toBe(1000)
    expect(output.liveMetrics.avgServiceTime).toBe(3000)
    expect(output.liveMetrics.avgResponseTime).toBe(4000)
    expect(output.liveMetrics.avgReactionSpeed).toBe(100)
    expect(output.liveMetrics.perCoreUtilization[0]).toBeCloseTo(0.5)
  })

  it('tracks max queue length', () => {
    const output = computePhase1RunTick(input({
      arrivalSchedule: [
        { arrivalTime: 100, size: 'S' },
        { arrivalTime: 101, size: 'S' },
        { arrivalTime: 102, size: 'S' },
      ],
      phase1MaxQueueLength: 1,
    }), 150)

    expect(output.phase1MaxQueueLength).toBe(2)
  })
})
