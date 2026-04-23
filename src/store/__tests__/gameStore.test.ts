import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'

function getState() {
  return useGameStore.getState()
}

beforeEach(() => {
  getState().reset()
})

describe('initial state', () => {
  it('starts in idle phase', () => {
    expect(getState().phase).toBe('idle')
  })

  it('has empty tasks and queue', () => {
    const { tasks, queue } = getState()
    expect(Object.keys(tasks)).toHaveLength(0)
    expect(queue).toHaveLength(0)
  })
})

describe('startGame', () => {
  it('transitions to phase1', () => {
    getState().startGame('standard')
    expect(getState().phase).toBe('phase1')
  })

  it('sets gameStartTime', () => {
    getState().startGame('standard')
    expect(getState().gameStartTime).not.toBeNull()
  })

  it('pre-generates an arrival schedule', () => {
    getState().startGame('standard')
    expect(getState().arrivalSchedule.length).toBeGreaterThan(0)
  })

  it('applies difficulty config — beginner has higher dropLimit', () => {
    getState().startGame('beginner')
    const beginnerDrop = getState().config.dropLimit
    getState().reset()
    getState().startGame('hard')
    const hardDrop = getState().config.dropLimit
    expect(beginnerDrop).toBeGreaterThan(hardDrop)
  })

  it('phase1Duration is 60_000ms for all difficulties', () => {
    for (const d of ['beginner', 'standard', 'hard', 'theory'] as const) {
      getState().reset()
      getState().startGame(d)
      expect(getState().config.phase1Duration).toBe(60_000)
    }
  })
})

describe('tick — Phase 1 arrivals', () => {
  it('spawns tasks whose arrival time has elapsed', () => {
    getState().startGame('standard')

    const store = getState()
    const { gameStartTime, arrivalSchedule } = store

    // Find the first arrival and simulate a tick just past it
    expect(arrivalSchedule.length).toBeGreaterThan(0)
    const firstArrival = arrivalSchedule[0]
    const mockNow = gameStartTime! + firstArrival.arrivalTime + 50

    getState().tick(mockNow)

    const { tasks, queue, activePhase1TaskId } = getState()
    // At least one task should have appeared
    expect(Object.keys(tasks).length).toBeGreaterThanOrEqual(1)
    // The task should either be queued or already active
    const allIds = [...queue, ...(activePhase1TaskId ? [activePhase1TaskId] : [])]
    expect(allIds.length).toBeGreaterThanOrEqual(1)
  })

  it('activates first queued task automatically', () => {
    getState().startGame('standard')

    const { gameStartTime, arrivalSchedule } = getState()
    const firstArrival = arrivalSchedule[0]
    getState().tick(gameStartTime! + firstArrival.arrivalTime + 50)

    expect(getState().activePhase1TaskId).not.toBeNull()
  })
})

describe('typeChar', () => {
  function setupActiveTask(): string {
    getState().startGame('standard')
    const { gameStartTime, arrivalSchedule } = getState()
    const firstArrival = arrivalSchedule[0]
    getState().tick(gameStartTime! + firstArrival.arrivalTime + 50)
    const activeId = getState().activePhase1TaskId!
    expect(activeId).not.toBeNull()
    return activeId
  }

  it('accepts incorrect characters (appends to typedContent)', () => {
    const activeId = setupActiveTask()
    const task = getState().tasks[activeId]
    const wrongChar = task.content![0] === 'a' ? 'b' : 'a'

    getState().typeChar(wrongChar)
    expect(getState().tasks[activeId].typedContent).toBe(wrongChar)
  })

  it('advances typedContent with correct characters', () => {
    const activeId = setupActiveTask()
    const task = getState().tasks[activeId]
    const firstChar = task.content![0]

    getState().typeChar(firstChar)
    expect(getState().tasks[activeId].typedContent).toBe(firstChar)
  })

  it('does not complete task when chars are typed but some are wrong', () => {
    const activeId = setupActiveTask()
    const content = getState().tasks[activeId].content!

    // Type the whole content but replace first char with wrong char
    const wrongChar = content[0] === 'a' ? 'b' : 'a'
    getState().typeChar(wrongChar)
    for (const char of content.slice(1)) {
      getState().typeChar(char)
    }

    // Length matches but first char is wrong — must not complete
    expect(getState().tasks[activeId].status).toBe('active')
  })

  it('does not advance past content length', () => {
    const activeId = setupActiveTask()
    const content = getState().tasks[activeId].content!

    // Type all correct chars
    for (const char of content) {
      getState().typeChar(char)
    }
    // Task should be completed; try typing one more char
    const prevStatus = getState().tasks[activeId].status
    getState().typeChar('x')

    // Status unchanged, typedContent not extended past content
    const typed = getState().tasks[activeId]?.typedContent ?? content
    expect(typed.length).toBeLessThanOrEqual(content.length)
    expect(prevStatus).toBe('completed')
  })

  it('marks task completed when all characters are typed correctly', () => {
    const activeId = setupActiveTask()
    const content = getState().tasks[activeId].content!

    for (const char of content) {
      getState().typeChar(char)
    }

    expect(getState().tasks[activeId].status).toBe('completed')
    expect(getState().tasks[activeId].completionTime).not.toBeUndefined()
  })

  it('clears activePhase1TaskId after task completes (when queue is empty)', () => {
    const activeId = setupActiveTask()
    const content = getState().tasks[activeId].content!

    // Drain the queue so no next task is available
    useGameStore.setState({ queue: [] })

    for (const char of content) {
      getState().typeChar(char)
    }

    expect(getState().activePhase1TaskId).toBeNull()
  })

  it('does nothing when phase is idle', () => {
    // No startGame called — phase is idle
    getState().typeChar('a')
    // Should not throw and state stays the same
    expect(getState().phase).toBe('idle')
  })

  it('does not complete when typedContent matches length but last char is wrong', () => {
    const activeId = setupActiveTask()
    const content = getState().tasks[activeId].content!

    for (const char of content.slice(0, -1)) {
      getState().typeChar(char)
    }
    const lastChar = content[content.length - 1]
    const wrongLast = lastChar === 'a' ? 'b' : 'a'
    getState().typeChar(wrongLast)

    expect(getState().tasks[activeId].status).toBe('active')
  })
})

describe('handleBackspace', () => {
  function setupActiveTask(): string {
    getState().startGame('standard')
    const { gameStartTime, arrivalSchedule } = getState()
    const firstArrival = arrivalSchedule[0]
    getState().tick(gameStartTime! + firstArrival.arrivalTime + 50)
    const activeId = getState().activePhase1TaskId!
    expect(activeId).not.toBeNull()
    return activeId
  }

  it('removes the last typed character', () => {
    const activeId = setupActiveTask()
    const content = getState().tasks[activeId].content!

    getState().typeChar(content[0])
    getState().typeChar(content[1] ?? 'x')
    getState().handleBackspace()

    expect(getState().tasks[activeId].typedContent).toBe(content[0])
  })

  it('does nothing when typedContent is empty', () => {
    const activeId = setupActiveTask()
    getState().handleBackspace()
    expect(getState().tasks[activeId].typedContent).toBe('')
  })

  it('allows correcting an error and completing the task', () => {
    const activeId = setupActiveTask()
    const content = getState().tasks[activeId].content!

    // Type wrong first char, then backspace and retype correct
    const wrongChar = content[0] === 'a' ? 'b' : 'a'
    getState().typeChar(wrongChar)
    getState().handleBackspace()
    // Now type all correct chars
    for (const char of content) {
      getState().typeChar(char)
    }

    expect(getState().tasks[activeId].status).toBe('completed')
  })

  it('does nothing when no active task', () => {
    getState().startGame('standard')
    // No tick — no active task yet
    expect(() => getState().handleBackspace()).not.toThrow()
  })
})

describe('reset', () => {
  it('returns to idle phase and clears all state', () => {
    getState().startGame('standard')
    getState().reset()

    const state = getState()
    expect(state.phase).toBe('idle')
    expect(state.gameStartTime).toBeNull()
    expect(Object.keys(state.tasks)).toHaveLength(0)
    expect(state.queue).toHaveLength(0)
    expect(state.activePhase1TaskId).toBeNull()
    expect(state.arrivalSchedule).toHaveLength(0)
  })
})

describe('Phase 1 end condition', () => {
  it('transitions to postrun when phase duration elapses', () => {
    getState().startGame('standard')
    const { gameStartTime, config } = getState()

    // Simulate a tick far past the phase duration
    getState().tick(gameStartTime! + config.phase1Duration + 100)
    expect(getState().phase).toBe('postrun')
  })

  it('stores phase1Result on phase end', () => {
    getState().startGame('standard')
    const { gameStartTime, config } = getState()

    getState().tick(gameStartTime! + config.phase1Duration + 100)
    const { phase1Result } = getState()

    expect(phase1Result).not.toBeNull()
    expect(phase1Result!.avgServiceTime).toBeGreaterThan(0)
  })

  it('phase 1 ends when elapsed reaches exactly 60_000ms', () => {
    getState().startGame('standard')
    const { gameStartTime } = getState()
    getState().tick(gameStartTime! + 60_000)
    expect(getState().phase).toBe('postrun')
  })
})
