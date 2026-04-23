import { describe, it, expect } from 'vitest'
import { computePhase2Tick, type Phase2TickInput } from '../phase2Tick'
import type { Task } from '../../types/task'
import type { Core } from '../../types/core'

const PHASE2_DURATION = 120_000

const BASE_CONFIG = {
  difficulty: 'standard' as const,
  phase2CoreCount: 1,
  phase1Duration: 60_000,
  phase2Duration: PHASE2_DURATION,
  queueSizeLimit: 12,
  dropLimit: 10,
  showTrueServiceDemand: false,
  deadlineMultiplier: 1.0,
  referenceWPM: 70,
  phase1Buckets: [1, 3, 4, 6] as const,
  phase2Buckets: [1, 6, 14, 15] as const,
}

const BASE_METRICS = {
  throughput: 0,
  queueLength: 0,
  avgWaitingTime: 0,
  avgResponseTime: 0,
  avgServiceTime: 0,
  perCoreUtilization: [0],
  droppedCount: 0,
  completedCount: 0,
  idealThroughput: 0,
  actualThroughput: 0,
}

const IDLE_CORE: Core = {
  id: 0,
  status: 'idle',
  currentTaskId: null,
  progress: 0,
  completedTaskCount: 0,
}

function minimalInput(): Phase2TickInput {
  return {
    config: { ...BASE_CONFIG },
    tasks: {},
    queue: [],
    cores: [{ ...IDLE_CORE }],
    liveMetrics: { ...BASE_METRICS },
    arrivalSchedule: [],
    nextArrivalIndex: 0,
    phaseElapsed: 0,
    phase1Result: null,
    coreBusyMs: [0],
    throughputHistory: [],
    queueLengthHistory: [],
    lastHistoryTick: 0,
    idleWasteMs: 0,
  }
}

function completedTask(id: string, arrivalTime: number, serviceStartTime: number, completionTime: number): Task {
  return {
    id,
    arrivalTime,
    size: 'S',
    trueServiceDemand: completionTime - serviceStartTime,
    status: 'completed',
    content: 'test',
    typedContent: 'test',
    serviceStartTime,
    completionTime,
  }
}

describe('computePhase2Tick — phase-end behavior', () => {
  it('returns no runSummary when elapsed < phase2Duration', () => {
    const output = computePhase2Tick(minimalInput(), 1000)
    expect(output.runSummary).toBeUndefined()
    expect(output.phase).toBeUndefined()
  })

  it('returns runSummary and phase=postrun when elapsed >= phase2Duration', () => {
    const output = computePhase2Tick(minimalInput(), PHASE2_DURATION)
    expect(output.runSummary).toBeDefined()
    expect(output.phase).toBe('postrun')
  })
})

describe('computePhase2Tick — score formula', () => {
  it('score is 0 when no tasks completed', () => {
    const output = computePhase2Tick(minimalInput(), PHASE2_DURATION)
    expect(output.runSummary!.score).toBe(0)
  })

  it('score equals completedCount * 10 when avgWaitingTime = 0 and idleWasteMs = 0', () => {
    const tasks: Record<string, Task> = {
      t1: completedTask('t1', 0, 0, 1000),
      t2: completedTask('t2', 0, 0, 1000),
      t3: completedTask('t3', 0, 0, 1000),
    }
    const output = computePhase2Tick({ ...minimalInput(), tasks, idleWasteMs: 0 }, PHASE2_DURATION)
    expect(output.runSummary!.completedTasks).toBe(3)
    expect(output.runSummary!.score).toBe(30)
  })

  it('score is reduced by waiting penalty', () => {
    // 1 task, wait=10000ms, svc=1000ms → waitingPenalty = (10000/1000)*1*0.5 = 5
    const tasks = { t1: completedTask('t1', 0, 10000, 11000) }
    const output = computePhase2Tick({ ...minimalInput(), tasks }, PHASE2_DURATION)
    expect(output.runSummary!.score).toBe(Math.max(0, Math.round(10 - 5)))
  })
})

describe('computePhase2Tick — latencyGrade', () => {
  it('assigns grade S when waitRatio < 0.5', () => {
    // wait=100, svc=1000 → ratio=0.1 → S
    const tasks = { t1: completedTask('t1', 0, 100, 1100) }
    const output = computePhase2Tick({ ...minimalInput(), tasks }, PHASE2_DURATION)
    expect(output.runSummary!.latencyGrade).toBe('S')
  })

  it('assigns grade A when waitRatio in [0.5, 1)', () => {
    // wait=700, svc=1000 → ratio=0.7 → A
    const tasks = { t1: completedTask('t1', 0, 700, 1700) }
    const output = computePhase2Tick({ ...minimalInput(), tasks }, PHASE2_DURATION)
    expect(output.runSummary!.latencyGrade).toBe('A')
  })

  it('assigns grade F when waitRatio >= 8', () => {
    // wait=8000, svc=1000 → ratio=8 → F
    const tasks = { t1: completedTask('t1', 0, 8000, 9000) }
    const output = computePhase2Tick({ ...minimalInput(), tasks }, PHASE2_DURATION)
    expect(output.runSummary!.latencyGrade).toBe('F')
  })
})

describe('computePhase2Tick — utilizationGrade', () => {
  it('assigns grade S when avgUtil > 0.90', () => {
    const elapsed = PHASE2_DURATION
    const coreBusyMs = [Math.round(elapsed * 0.91)]
    const output = computePhase2Tick({ ...minimalInput(), coreBusyMs }, elapsed)
    expect(output.runSummary!.utilizationGrade).toBe('S')
  })

  it('assigns grade A when avgUtil in (0.80, 0.90]', () => {
    const elapsed = PHASE2_DURATION
    const coreBusyMs = [Math.round(elapsed * 0.85)]
    const output = computePhase2Tick({ ...minimalInput(), coreBusyMs }, elapsed)
    expect(output.runSummary!.utilizationGrade).toBe('A')
  })

  it('assigns grade F when avgUtil <= 0.35', () => {
    const elapsed = PHASE2_DURATION
    const coreBusyMs = [Math.round(elapsed * 0.30)]
    const output = computePhase2Tick({ ...minimalInput(), coreBusyMs }, elapsed)
    expect(output.runSummary!.utilizationGrade).toBe('F')
  })
})

describe('computePhase2Tick — idle waste', () => {
  it('does not increase idleWasteMs when queue is empty', () => {
    const input = { ...minimalInput(), queue: [], idleWasteMs: 0, phaseElapsed: 0 }
    const output = computePhase2Tick(input, 500)
    expect(output.idleWasteMs).toBe(0)
  })

  it('increases idleWasteMs when idle core exists and queue is non-empty', () => {
    const task: Task = {
      id: 'waiting-task',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 0,
      status: 'waiting',
      content: 'test',
      typedContent: '',
    }
    const input = {
      ...minimalInput(),
      tasks: { 'waiting-task': task },
      queue: ['waiting-task'],
      idleWasteMs: 0,
      phaseElapsed: 0,
    }
    const output = computePhase2Tick(input, 500)
    // 1 idle core × 500ms tick duration = 500ms waste
    expect(output.idleWasteMs).toBe(500)
  })
})

describe('computePhase2Tick — runSummary new fields', () => {
  it('failed is false when phase ends by timer', () => {
    const output = computePhase2Tick(minimalInput(), PHASE2_DURATION)
    expect(output.runSummary!.failed).toBe(false)
  })

  it('failed is true when droppedCount exceeds dropLimit', () => {
    const expiredTask: Task = {
      id: 'exp',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 1000,
      status: 'expired',
      content: 'test',
      typedContent: '',
      deadline: 0,
    }
    const input = {
      ...minimalInput(),
      config: { ...BASE_CONFIG, dropLimit: 0 },
      tasks: { exp: expiredTask },
    }
    const output = computePhase2Tick(input, PHASE2_DURATION)
    expect(output.runSummary!.failed).toBe(true)
  })

  it('survivedMs equals elapsed on successful run', () => {
    const output = computePhase2Tick(minimalInput(), PHASE2_DURATION)
    expect(output.runSummary!.survivedMs).toBe(PHASE2_DURATION)
  })

  it('survivedMs equals elapsed at early failure', () => {
    const expiredTask: Task = {
      id: 'exp',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 1000,
      status: 'expired',
      content: 'test',
      typedContent: '',
      deadline: 0,
    }
    const input = {
      ...minimalInput(),
      config: { ...BASE_CONFIG, dropLimit: 0 },
      tasks: { exp: expiredTask },
    }
    const earlyElapsed = 30_000
    const output = computePhase2Tick(input, earlyElapsed)
    expect(output.runSummary!.survivedMs).toBe(earlyElapsed)
  })

  it('idleWasteMs in runSummary matches accumulated output value', () => {
    const input = { ...minimalInput(), idleWasteMs: 5000 }
    const output = computePhase2Tick(input, PHASE2_DURATION)
    expect(output.runSummary!.idleWasteMs).toBe(output.idleWasteMs)
  })
})

describe('computePhase2Tick — end-of-phase drop accounting', () => {
  it('counts tasks still waiting at phase end as dropped in runSummary', () => {
    const waiting: Task = {
      id: 'w1',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 1000,
      status: 'waiting',
      content: 'test',
      typedContent: '',
      deadline: PHASE2_DURATION,
    }
    const input = {
      ...minimalInput(),
      tasks: { w1: waiting },
      queue: ['w1'],
    }
    const output = computePhase2Tick(input, PHASE2_DURATION)
    expect(output.runSummary!.droppedTasks).toBe(1)
    expect(output.tasks['w1'].status).toBe('dropped')
  })

  it('counts a running task as dropped at phase end', () => {
    const running: Task = {
      id: 'r1',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 999_999,
      status: 'running',
      content: 'test',
      typedContent: '',
      serviceStartTime: PHASE2_DURATION - 1000,
      assignedCoreId: 0,
    }
    const core: Core = {
      id: 0,
      status: 'busy',
      currentTaskId: 'r1',
      progress: 0,
      completedTaskCount: 0,
      busySince: PHASE2_DURATION - 1000,
    }
    const input = {
      ...minimalInput(),
      tasks: { r1: running },
      cores: [core],
      coreBusyMs: [0],
    }
    const output = computePhase2Tick(input, PHASE2_DURATION)
    expect(output.runSummary!.droppedTasks).toBe(1)
    expect(output.tasks['r1'].status).toBe('dropped')
  })

  it('does not affect failed flag (stays based on mid-run drops only)', () => {
    // Single waiting task — not enough to trip dropLimit, so failed should be false
    // even after the end-of-phase conversion.
    const waiting: Task = {
      id: 'w1',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 1000,
      status: 'waiting',
      content: 'test',
      typedContent: '',
      deadline: PHASE2_DURATION,
    }
    const input = {
      ...minimalInput(),
      config: { ...BASE_CONFIG, dropLimit: 5 },
      tasks: { w1: waiting },
      queue: ['w1'],
    }
    const output = computePhase2Tick(input, PHASE2_DURATION)
    expect(output.runSummary!.droppedTasks).toBe(1)
    expect(output.runSummary!.failed).toBe(false)
  })
})

describe('computePhase2Tick — task completion', () => {
  it('marks a task completed when elapsed >= serviceStartTime + trueServiceDemand', () => {
    const task: Task = {
      id: 'task-1',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 500,
      status: 'running',
      content: 'test',
      typedContent: 'test',
      serviceStartTime: 0,
      assignedCoreId: 0,
    }
    const core: Core = {
      id: 0,
      status: 'busy',
      currentTaskId: 'task-1',
      progress: 0,
      completedTaskCount: 0,
      busySince: 0,
    }
    const input = {
      ...minimalInput(),
      tasks: { 'task-1': task },
      cores: [core],
      coreBusyMs: [0],
    }
    const output = computePhase2Tick(input, 1000)
    expect(output.tasks['task-1'].status).toBe('completed')
    expect(output.liveMetrics.completedCount).toBe(1)
  })

  it('increments completedTaskCount on the core when task finishes', () => {
    const task: Task = {
      id: 'task-1',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 500,
      status: 'running',
      content: 'test',
      typedContent: 'test',
      serviceStartTime: 0,
      assignedCoreId: 0,
    }
    const core: Core = {
      id: 0,
      status: 'busy',
      currentTaskId: 'task-1',
      progress: 0,
      completedTaskCount: 0,
      busySince: 0,
    }
    const input = {
      ...minimalInput(),
      tasks: { 'task-1': task },
      cores: [core],
      coreBusyMs: [0],
    }
    const output = computePhase2Tick(input, 1000)
    expect(output.cores[0].completedTaskCount).toBe(1)
    expect(output.cores[0].status).toBe('idle')
  })
})
