import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

function getState() {
  return useGameStore.getState()
}

// Bootstrap through Phase 1 end to get a valid phase1Result, then start Phase 2.
function setupPhase2(difficulty: 'standard' | 'beginner' | 'hard' | 'theory' = 'standard') {
  getState().reset()
  getState().startGame(difficulty)
  const { gameStartTime, config } = getState()
  // Skip to Phase 1 end
  getState().tick(gameStartTime! + config.phase1Duration + 100)
  expect(getState().phase).toBe('postrun')
  expect(getState().phase1Result).not.toBeNull()
  getState().startPhase2(difficulty)
  expect(getState().phase).toBe('phase2')
}

// Spawn at least N tasks in the queue by advancing time through multiple arrivals.
function spawnAtLeast(n: number) {
  const { gameStartTime, arrivalSchedule } = getState()
  for (let i = 0; i < Math.min(n, arrivalSchedule.length); i++) {
    getState().tick(gameStartTime! + arrivalSchedule[i].arrivalTime + 50)
    if (getState().queue.length >= n) break
  }
}

beforeEach(() => {
  getState().reset()
})

describe('startPhase2', () => {
  it('transitions to phase2', () => {
    setupPhase2()
    expect(getState().phase).toBe('phase2')
  })

  it('initialises cores from config', () => {
    setupPhase2()
    const { cores, config } = getState()
    expect(cores).toHaveLength(config.phase2CoreCount)
    expect(cores.every(c => c.status === 'idle')).toBe(true)
    expect(cores.every(c => c.currentTaskId === null)).toBe(true)
  })

  it('generates a Phase 2 arrival schedule', () => {
    setupPhase2()
    expect(getState().arrivalSchedule.length).toBeGreaterThan(0)
  })

  it('resets coreBusyMs to all-zeros with length = coreCount', () => {
    setupPhase2()
    const { coreBusyMs, config } = getState()
    expect(coreBusyMs).toHaveLength(config.phase2CoreCount)
    expect(coreBusyMs.every(ms => ms === 0)).toBe(true)
  })

  it('resets history arrays', () => {
    setupPhase2()
    const { throughputHistory, queueLengthHistory } = getState()
    expect(throughputHistory).toHaveLength(0)
    expect(queueLengthHistory).toHaveLength(0)
  })
})

describe('Phase 2 tick — arrivals', () => {
  it('spawns tasks whose arrival time has elapsed', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    expect(arrivalSchedule.length).toBeGreaterThan(0)
    const firstArrival = arrivalSchedule[0]
    getState().tick(gameStartTime! + firstArrival.arrivalTime + 50)
    expect(Object.keys(getState().tasks).length).toBeGreaterThanOrEqual(1)
  })

  it('places spawned tasks in the queue', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    const firstArrival = arrivalSchedule[0]
    getState().tick(gameStartTime! + firstArrival.arrivalTime + 50)
    expect(getState().queue.length).toBeGreaterThanOrEqual(1)
  })

  it('spawned Phase 2 tasks have positive trueServiceDemand', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    const firstArrival = arrivalSchedule[0]
    getState().tick(gameStartTime! + firstArrival.arrivalTime + 50)
    const tasks = Object.values(getState().tasks)
    for (const task of tasks) {
      expect(task.trueServiceDemand).toBeGreaterThan(0)
    }
  })
})

describe('dispatchTask', () => {
  it('moves queue[0] to the target core', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    getState().tick(gameStartTime! + arrivalSchedule[0].arrivalTime + 50)

    const { queue, cores } = getState()
    expect(queue.length).toBeGreaterThan(0)
    const taskId = queue[0]
    const coreId = cores[0].id

    getState().dispatchTask(coreId)

    const state = getState()
    expect(state.queue.includes(taskId)).toBe(false)
    expect(state.tasks[taskId].status).toBe('running')
    expect(state.tasks[taskId].assignedCoreId).toBe(coreId)
    expect(state.cores[coreId].status).toBe('busy')
    expect(state.cores[coreId].currentTaskId).toBe(taskId)
  })

  it('always dispatches queue[0] regardless of difficulty mode', () => {
    for (const mode of ['beginner', 'standard', 'hard', 'theory'] as const) {
      setupPhase2(mode)
      spawnAtLeast(2)
      const { queue } = getState()
      if (queue.length < 1) continue
      const headId = queue[0]
      const idleCoreId = getState().cores.find(c => c.status === 'idle')!.id
      getState().dispatchTask(idleCoreId)
      expect(getState().tasks[headId].status).toBe('running')
      expect(getState().queue).not.toContain(headId)
    }
  })

  it('ignores dispatch to a busy core', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    const secondArrival = arrivalSchedule[Math.min(1, arrivalSchedule.length - 1)]
    getState().tick(gameStartTime! + secondArrival.arrivalTime + 50)

    const { queue } = getState()
    if (queue.length < 2) return

    getState().dispatchTask(0)
    // Core 0 is now busy — try to dispatch again to same core
    const coreBefore = getState().cores[0]
    getState().dispatchTask(0)
    expect(getState().cores[0].currentTaskId).toBe(coreBefore.currentTaskId)
  })

  it('ignores dispatch when queue is empty', () => {
    setupPhase2()
    const coresBefore = getState().cores
    getState().dispatchTask(0)
    expect(getState().cores).toEqual(coresBefore)
  })
})

describe('Phase 2 tick — core progress and task completion', () => {
  it('core progress increases over time', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    getState().tick(gameStartTime! + arrivalSchedule[0].arrivalTime + 50)
    getState().dispatchTask(0)

    const taskId = getState().cores[0].currentTaskId!
    const task = getState().tasks[taskId]
    const halfwayMs = task.serviceStartTime! + task.trueServiceDemand / 2
    getState().tick(gameStartTime! + halfwayMs)

    const progress = getState().cores[0].progress
    expect(progress).toBeGreaterThan(0)
    expect(progress).toBeLessThanOrEqual(1)
  })

  it('task completes and core becomes idle after trueServiceDemand elapses', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    getState().tick(gameStartTime! + arrivalSchedule[0].arrivalTime + 50)
    getState().dispatchTask(0)

    const taskId = getState().cores[0].currentTaskId!
    const task = getState().tasks[taskId]
    const completionMs = task.serviceStartTime! + task.trueServiceDemand + 10
    getState().tick(gameStartTime! + completionMs)

    const state = getState()
    expect(state.tasks[taskId].status).toBe('completed')
    expect(state.tasks[taskId].completionTime).toBeDefined()
    expect(state.cores[0].status).toBe('idle')
    expect(state.cores[0].currentTaskId).toBeNull()
    expect(state.cores[0].completedTaskCount).toBe(1)
  })

  it('coreBusyMs accumulates after task completes', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    getState().tick(gameStartTime! + arrivalSchedule[0].arrivalTime + 50)
    getState().dispatchTask(0)

    const taskId = getState().cores[0].currentTaskId!
    const task = getState().tasks[taskId]
    getState().tick(gameStartTime! + task.serviceStartTime! + task.trueServiceDemand + 10)

    const { coreBusyMs } = getState()
    expect(coreBusyMs[0]).toBeGreaterThan(0)
  })
})

describe('Phase 2 metrics', () => {
  it('throughput increases as tasks complete', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    getState().tick(gameStartTime! + arrivalSchedule[0].arrivalTime + 50)
    getState().dispatchTask(0)

    const taskId = getState().cores[0].currentTaskId!
    const task = getState().tasks[taskId]
    getState().tick(gameStartTime! + task.serviceStartTime! + task.trueServiceDemand + 10)

    expect(getState().liveMetrics.completedCount).toBe(1)
    expect(getState().liveMetrics.throughput).toBeGreaterThan(0)
  })

  it('perCoreUtilization has correct length', () => {
    setupPhase2()
    const { gameStartTime } = getState()
    getState().tick(gameStartTime! + 500)
    const { liveMetrics, config } = getState()
    expect(liveMetrics.perCoreUtilization).toHaveLength(config.phase2CoreCount)
  })
})

describe('Phase 2 end condition', () => {
  it('transitions to postrun when phase duration elapses', () => {
    setupPhase2()
    const { gameStartTime, config } = getState()
    getState().tick(gameStartTime! + config.phase2Duration + 100)
    expect(getState().phase).toBe('postrun')
  })

  it('sets runSummary on phase end', () => {
    setupPhase2()
    const { gameStartTime, config } = getState()
    getState().tick(gameStartTime! + config.phase2Duration + 100)
    const { runSummary } = getState()
    expect(runSummary).not.toBeNull()
    expect(runSummary!.score).toBeGreaterThanOrEqual(0)
    expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(runSummary!.latencyGrade)
    expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(runSummary!.utilizationGrade)
    expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(runSummary!.throughputGrade)
    expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(runSummary!.efficiencyGrade)
  })

  it('runSummary perCoreUtilization has correct length', () => {
    setupPhase2()
    const { gameStartTime, config } = getState()
    getState().tick(gameStartTime! + config.phase2Duration + 100)
    const { runSummary } = getState()
    expect(runSummary!.perCoreUtilization).toHaveLength(config.phase2CoreCount)
  })
})

describe('lastDispatchedAt', () => {
  it('startPhase2 initialises lastDispatchedAt to {}', () => {
    setupPhase2()
    expect(getState().lastDispatchedAt).toEqual({})
  })

  it('dispatchTask sets lastDispatchedAt for the dispatched core', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    getState().tick(gameStartTime! + arrivalSchedule[0].arrivalTime + 50)

    const coreId = getState().cores[0].id
    getState().dispatchTask(coreId)

    const { lastDispatchedAt, phaseElapsed } = getState()
    expect(lastDispatchedAt[coreId]).toBe(phaseElapsed)
  })

  it('dispatchTask does not update lastDispatchedAt when core is busy', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule } = getState()
    const secondArrival = arrivalSchedule[Math.min(1, arrivalSchedule.length - 1)]
    getState().tick(gameStartTime! + secondArrival.arrivalTime + 50)

    const { queue } = getState()
    if (queue.length < 2) return
    getState().dispatchTask(0)
    const beforeSecond = { ...getState().lastDispatchedAt }
    // Core 0 is busy — dispatch should be rejected
    getState().dispatchTask(0)
    expect(getState().lastDispatchedAt).toEqual(beforeSecond)
  })

  it('live score formula matches RunSummary score at phase end (within tolerance)', () => {
    setupPhase2()
    const { gameStartTime, arrivalSchedule, config } = getState()

    const nearEnd = config.phase2Duration - 5_000
    getState().tick(gameStartTime! + Math.min(nearEnd, arrivalSchedule[0].arrivalTime + 50))
    const q = getState().queue
    if (q.length > 0) getState().dispatchTask(0)

    const { liveMetrics, idleWasteMs } = getState()
    const liveScore = Math.max(
      0,
      Math.round(
        liveMetrics.completedCount * 10
        - (liveMetrics.avgWaitingTime / 1000) * liveMetrics.completedCount * 0.5
        - idleWasteMs / 10_000
      )
    )

    getState().tick(gameStartTime! + config.phase2Duration + 100)
    const { runSummary } = getState()
    expect(runSummary).not.toBeNull()
    expect(Math.abs(runSummary!.score - liveScore)).toBeLessThan(100)
  })
})
