import { describe, it, expect } from 'vitest'
import { computePhase1Tick, type Phase1TickInput } from '../phase1Tick'
import { buildPhase1Levels, phase1LevelDurationMs } from '../phase1Levels'
import { buildPhase2RunConfig } from '../phase2Runs'
import type { GameConfig, Phase1LevelConfig } from '../../types/game'
import type { LiveMetrics } from '../../types/metrics'
import type { Task } from '../../types/task'

const LEVEL = buildPhase1Levels('standard')[0]

const BASE_CONFIG: GameConfig = {
  difficulty: 'standard',
  phase2CoreCount: 4,
  phase1Duration: phase1LevelDurationMs(LEVEL),
  phase2Duration: 120_000,
  queueSizeLimit: 6,
  dropLimit: 5,
  showTrueServiceDemand: false,
  deadlineMultiplier: 1.0,
  referenceWPM: 70,
  phase1Levels: [LEVEL],
  phase2Run: buildPhase2RunConfig('standard', 3_000),
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

function minimalInput(level: Phase1LevelConfig = LEVEL): Phase1TickInput {
  return {
    config: { ...BASE_CONFIG, phase1Duration: phase1LevelDurationMs(level), phase1Levels: [level] },
    tasks: {},
    queue: [],
    activePhase1TaskId: null,
    liveMetrics: { ...BASE_METRICS },
    arrivalSchedule: [],
    nextArrivalIndex: 0,
    phaseElapsed: 0,
    currentPhase1Level: level,
    phase1MaxQueueLength: 0,
  }
}

function waitingTask(id: string, deadline?: number): Task {
  return {
    id,
    arrivalTime: 0,
    size: 'S',
    trueServiceDemand: 0,
    status: 'waiting',
    content: 'test task',
    typedContent: '',
    deadline,
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
    completionTime,
  }
}

describe('computePhase1Tick - level timing', () => {
  it('does not end the level before duration elapses', () => {
    const output = computePhase1Tick(minimalInput(), phase1LevelDurationMs(LEVEL) - 1)
    expect(output.levelEnded).toBe(false)
  })

  it('ends the level when elapsed reaches duration', () => {
    const output = computePhase1Tick(minimalInput(), phase1LevelDurationMs(LEVEL))
    expect(output.levelEnded).toBe(true)
  })
})

describe('computePhase1Tick - no-drop task flow', () => {
  it('spawns elapsed Poisson arrivals as Phase 1 S prompts without deadlines', () => {
    const input: Phase1TickInput = {
      ...minimalInput(),
      arrivalSchedule: [
        { arrivalTime: 100, size: 'S' },
        { arrivalTime: 200, size: 'S' },
      ],
    }
    const output = computePhase1Tick(input, 250)
    const spawned = Object.values(output.tasks)
    expect(spawned).toHaveLength(2)
    expect(spawned.every(task => task.size === 'S')).toBe(true)
    expect(spawned.every(task => task.deadline === undefined)).toBe(true)
    expect(output.nextArrivalIndex).toBe(2)
  })

  it('activates the first waiting task when no task is active', () => {
    const task = waitingTask('t1')
    const output = computePhase1Tick({ ...minimalInput(), tasks: { t1: task }, queue: ['t1'] }, 100)
    expect(output.activePhase1TaskId).toBe('t1')
    expect(output.tasks.t1.status).toBe('active')
    expect(output.tasks.t1.serviceStartTime).toBe(100)
  })

  it('does not expire or drop tasks, even if a legacy deadline is present', () => {
    const task = waitingTask('t1', 0)
    const output = computePhase1Tick({ ...minimalInput(), tasks: { t1: task }, queue: ['t1'] }, 100)
    expect(output.tasks.t1.status).toBe('active')
    expect(output.liveMetrics.droppedCount).toBe(0)
  })

  it('leaves unfinished work unchanged when a level ends', () => {
    const waiting = waitingTask('waiting')
    const active: Task = {
      ...waitingTask('active'),
      status: 'active',
      typedContent: 'te',
      serviceStartTime: 1000,
    }
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { waiting, active },
      queue: ['waiting'],
      activePhase1TaskId: 'active',
    }
    const output = computePhase1Tick(input, phase1LevelDurationMs(LEVEL))
    expect(output.levelEnded).toBe(true)
    expect(output.tasks.waiting.status).toBe('waiting')
    expect(output.tasks.active.status).toBe('active')
    expect(output.liveMetrics.droppedCount).toBe(0)
  })
})

describe('computePhase1Tick - metrics', () => {
  it('computes service, waiting, response, and throughput metrics from completed tasks', () => {
    const task = completedTask('t1', 1000, 4000)
    const input: Phase1TickInput = { ...minimalInput(), tasks: { t1: task } }
    const output = computePhase1Tick(input, 10_000)
    expect(output.liveMetrics.completedCount).toBe(1)
    expect(output.liveMetrics.avgWaitingTime).toBe(1000)
    expect(output.liveMetrics.avgServiceTime).toBe(3000)
    expect(output.liveMetrics.avgResponseTime).toBe(4000)
    expect(output.liveMetrics.throughput).toBeCloseTo(0.1)
  })

  it('computes reaction speed and typing speed when firstKeystrokeTime is set', () => {
    const task: Task = {
      ...completedTask('t1', 1000, 5000),
      firstKeystrokeTime: 1500,
      content: 'hello world',
    }
    const output = computePhase1Tick({ ...minimalInput(), tasks: { t1: task } }, 10_000)
    expect(output.liveMetrics.avgReactionSpeed).toBe(500)
    expect(output.liveMetrics.avgTypingSpeed).toBeCloseTo(37.7, 0)
  })

  it('tracks max queue length across ticks', () => {
    const input: Phase1TickInput = {
      ...minimalInput(),
      arrivalSchedule: [
        { arrivalTime: 100, size: 'S' },
        { arrivalTime: 101, size: 'S' },
        { arrivalTime: 102, size: 'S' },
      ],
      phase1MaxQueueLength: 1,
    }
    const output = computePhase1Tick(input, 150)
    expect(output.phase1MaxQueueLength).toBe(2)
  })
})
