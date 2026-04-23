import { describe, it, expect } from 'vitest'
import { computePhase1Tick, type Phase1TickInput } from '../phase1Tick'
import type { Task } from '../../types/task'

const BASE_CONFIG = {
  difficulty: 'standard' as const,
  phase2CoreCount: 4,
  phase1Duration: 60_000,
  phase2Duration: 120_000,
  queueSizeLimit: 6,
  dropLimit: 5,
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
  perCoreUtilization: [],
  droppedCount: 0,
  completedCount: 0,
  idealThroughput: 0,
  actualThroughput: 0,
}

function minimalInput(): Phase1TickInput {
  return {
    config: { ...BASE_CONFIG },
    tasks: {},
    queue: [],
    activePhase1TaskId: null,
    liveMetrics: { ...BASE_METRICS },
    arrivalSchedule: [],
    nextArrivalIndex: 0,
    phaseElapsed: 0,
  }
}

function waitingTask(id: string, deadline?: number): Task {
  return {
    id,
    arrivalTime: 0,
    size: 'S',
    trueServiceDemand: 0,
    status: 'waiting',
    content: 'test task content',
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

describe('computePhase1Tick — phase-end behavior', () => {
  it('returns no phase or phase1Result when elapsed < phase1Duration', () => {
    const output = computePhase1Tick(minimalInput(), 1000)
    expect(output.phase).toBeUndefined()
    expect(output.phase1Result).toBeUndefined()
  })

  it('sets phase to postrun when elapsed >= phase1Duration', () => {
    const output = computePhase1Tick(minimalInput(), 60_001)
    expect(output.phase).toBe('postrun')
    expect(output.phase1Result).toBeDefined()
  })

  it('sets phase to postrun when elapsed equals exactly phase1Duration', () => {
    const output = computePhase1Tick(minimalInput(), 60_000)
    expect(output.phase).toBe('postrun')
  })

  it('phase ends early when droppedCount exceeds dropLimit', () => {
    const task = waitingTask('t1', 0)
    const input: Phase1TickInput = {
      ...minimalInput(),
      config: { ...BASE_CONFIG, dropLimit: 0 },
      tasks: { t1: task },
      queue: ['t1'],
    }
    const output = computePhase1Tick(input, 100)
    expect(output.phase).toBe('postrun')
  })
})

describe('computePhase1Tick — phase1Result metrics', () => {
  it('avgServiceTime defaults to 3000 when no tasks are completed', () => {
    const output = computePhase1Tick(minimalInput(), 60_001)
    expect(output.phase1Result!.avgServiceTime).toBe(3_000)
    expect(output.phase1Result!.avgReactionSpeed).toBe(0)
    expect(output.phase1Result!.avgTypingSpeed).toBe(0)
  })

  it('avgServiceTime is computed from completed task service windows', () => {
    const task = completedTask('t1', 1000, 4000)
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { t1: task },
    }
    const output = computePhase1Tick(input, 60_001)
    expect(output.phase1Result!.avgServiceTime).toBe(3000)
    expect(output.phase1Result!.completedCount).toBe(1)
    expect(output.phase1Result!.avgReactionSpeed).toBe(0)
    expect(output.phase1Result!.avgTypingSpeed).toBe(0)
  })

  it('avgResponseTime is computed from arrivalTime to completionTime', () => {
    // completedTask sets arrivalTime: 0, serviceStartTime: 1000, completionTime: 4000
    const task = completedTask('t1', 1000, 4000)
    const input: Phase1TickInput = { ...minimalInput(), tasks: { t1: task } }
    const output = computePhase1Tick(input, 60_001)
    expect(output.phase1Result!.avgResponseTime).toBe(4000)
  })

  it('completedCount is 0 and droppedCount is 0 on empty run', () => {
    const output = computePhase1Tick(minimalInput(), 60_001)
    expect(output.phase1Result!.completedCount).toBe(0)
    expect(output.phase1Result!.droppedCount).toBe(0)
    expect(output.phase1Result!.avgReactionSpeed).toBe(0)
    expect(output.phase1Result!.avgTypingSpeed).toBe(0)
  })

  it('computes avgReactionSpeed and avgTypingSpeed when firstKeystrokeTime is set', () => {
    const task: Task = {
      ...completedTask('t1', 1000, 5000),
      firstKeystrokeTime: 1500,
      content: 'hello world',
    }
    const input: Phase1TickInput = { ...minimalInput(), tasks: { t1: task } }
    const output = computePhase1Tick(input, 60_001)
    expect(output.phase1Result!.avgReactionSpeed).toBe(500)
    // typingMs = 5000 - 1500 = 3500ms; chars = 11; WPM = (11/5) / (3500/60000) ≈ 37.7
    expect(output.phase1Result!.avgTypingSpeed).toBeCloseTo(37.7, 0)
  })
})

describe('computePhase1Tick — task expiry', () => {
  it('removes expired tasks from the queue', () => {
    const task = waitingTask('t1', 0)
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { t1: task },
      queue: ['t1'],
    }
    const output = computePhase1Tick(input, 100)
    expect(output.queue).not.toContain('t1')
    expect(output.tasks['t1'].status).toBe('expired')
  })

  it('does not expire tasks whose deadline has not passed', () => {
    const task = waitingTask('t1', 60_000)
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { t1: task },
      queue: ['t1'],
    }
    const output = computePhase1Tick(input, 100)
    // Task is valid — it gets activated, not expired
    expect(output.tasks['t1'].status).not.toBe('expired')
  })

  it('counts expired tasks in droppedCount', () => {
    const task = waitingTask('t1', 0)
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { t1: task },
      queue: ['t1'],
    }
    const output = computePhase1Tick(input, 100)
    expect(output.liveMetrics.droppedCount).toBe(1)
  })
})

describe('computePhase1Tick — end-of-phase drop accounting', () => {
  it('counts tasks still waiting at phase end as dropped in phase1Result', () => {
    const t1 = waitingTask('t1', 60_000)
    const t2 = waitingTask('t2', 60_000)
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { t1, t2 },
      queue: ['t1', 't2'],
    }
    const output = computePhase1Tick(input, 60_000)
    expect(output.phase1Result!.droppedCount).toBe(2)
    expect(output.tasks['t1'].status).toBe('dropped')
    expect(output.tasks['t2'].status).toBe('dropped')
  })

  it('counts the active (in-progress) task as dropped at phase end', () => {
    const active: Task = {
      id: 't1',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 0,
      status: 'active',
      content: 'test',
      typedContent: 'te',
      serviceStartTime: 1000,
      deadline: 60_000,
    }
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { t1: active },
      activePhase1TaskId: 't1',
    }
    const output = computePhase1Tick(input, 60_000)
    expect(output.phase1Result!.droppedCount).toBe(1)
    expect(output.tasks['t1'].status).toBe('dropped')
  })

  it('does not reclassify already-expired or completed tasks', () => {
    const completed = completedTask('done', 1000, 4000)
    const expired: Task = {
      id: 'exp',
      arrivalTime: 0,
      size: 'S',
      trueServiceDemand: 0,
      status: 'expired',
      content: 'test',
      typedContent: '',
      deadline: 0,
    }
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { done: completed, exp: expired },
    }
    const output = computePhase1Tick(input, 60_000)
    expect(output.tasks['done'].status).toBe('completed')
    expect(output.tasks['exp'].status).toBe('expired')
    expect(output.phase1Result!.completedCount).toBe(1)
    expect(output.phase1Result!.droppedCount).toBe(1)
  })
})

describe('computePhase1Tick — task activation', () => {
  it('activates the first queued task when no task is active', () => {
    const task = waitingTask('t1', 60_000)
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { t1: task },
      queue: ['t1'],
    }
    const output = computePhase1Tick(input, 100)
    expect(output.activePhase1TaskId).toBe('t1')
    expect(output.tasks['t1'].status).toBe('active')
  })

  it('skips expired tasks during activation and picks the next valid one', () => {
    const expired = waitingTask('t1', 0)
    const valid = waitingTask('t2', 60_000)
    const input: Phase1TickInput = {
      ...minimalInput(),
      tasks: { t1: expired, t2: valid },
      queue: ['t1', 't2'],
    }
    const output = computePhase1Tick(input, 100)
    expect(output.activePhase1TaskId).toBe('t2')
    expect(output.tasks['t2'].status).toBe('active')
  })
})
