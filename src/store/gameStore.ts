import { create } from 'zustand'
import type { Task } from '../types/task'
import type { Core } from '../types/core'
import type { GamePhase, DifficultyMode, GameConfig } from '../types/game'
import type { LiveMetrics, RunSummary, Phase1Result, TimePoint } from '../types/metrics'
import { generateBucketedArrivalSchedule, PHASE2_REFERENCE_WPM, type ScheduledArrival } from '../simulation/arrival'
import { computePhase1Tick } from '../simulation/phase1Tick'
import { computePhase2Tick } from '../simulation/phase2Tick'

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: GameConfig = {
  difficulty: 'standard',
  phase2CoreCount: 4,
  phase1Duration: 60_000,
  phase2Duration: 60_000,
  queueSizeLimit: 6,
  dropLimit: 5,
  showTrueServiceDemand: false,
  deadlineMultiplier: 1.0,
  referenceWPM: 70,
  phase1Buckets: [1, 3, 4, 6],
  phase2Buckets: [1, 6, 14, 15],
}

const DEFAULT_METRICS: LiveMetrics = {
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

function buildConfig(difficulty: DifficultyMode): GameConfig {
  switch (difficulty) {
    case 'beginner':
      return {
        ...DEFAULT_CONFIG,
        difficulty,
        phase2CoreCount: 4,
        queueSizeLimit: 6,
        dropLimit: 4,
        deadlineMultiplier: 1.25,
        referenceWPM: 40,
        phase1Buckets: [1, 2, 4, 4],
        phase2Buckets: [1, 3, 9, 8],
      }
    case 'hard':
      return {
        ...DEFAULT_CONFIG,
        difficulty,
        phase2CoreCount: 6,
        queueSizeLimit: 5,
        dropLimit: 3,
        deadlineMultiplier: 0.75,
        referenceWPM: 100,
        phase1Buckets: [3, 5, 5, 8],
        phase2Buckets: [3, 8, 23, 25],
      }
    case 'theory':
      return { ...DEFAULT_CONFIG, difficulty, showTrueServiceDemand: true }
    default:
      return { ...DEFAULT_CONFIG, difficulty }
  }
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface GameStore {
  phase: GamePhase
  config: GameConfig
  gameStartTime: number | null
  phaseElapsed: number

  arrivalSchedule: ScheduledArrival[]
  nextArrivalIndex: number

  phase1Result: Phase1Result | null
  activePhase1TaskId: string | null

  tasks: Record<string, Task>
  queue: string[]

  cores: Core[]

  liveMetrics: LiveMetrics
  runSummary: RunSummary | null

  // Phase 2 history and scoring state
  throughputHistory: TimePoint[]
  queueLengthHistory: TimePoint[]
  coreBusyMs: number[]
  lastHistoryTick: number
  idleWasteMs: number
  lastDispatchedAt: Record<number, number>

  // Actions
  startGame: (difficulty: DifficultyMode) => void
  startPhase2: (difficulty: DifficultyMode) => void
  dispatchTask: (coreId: number) => void
  typeChar: (char: string) => void
  handleBackspace: () => void
  tick: (now: number) => void
  endRun: () => void
  reset: () => void
  returnToMenu: () => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'idle',
  config: DEFAULT_CONFIG,
  gameStartTime: null,
  phaseElapsed: 0,
  arrivalSchedule: [],
  nextArrivalIndex: 0,
  phase1Result: null,
  activePhase1TaskId: null,
  tasks: {},
  queue: [],
  cores: [],
  liveMetrics: { ...DEFAULT_METRICS },
  runSummary: null,
  throughputHistory: [],
  queueLengthHistory: [],
  coreBusyMs: [],
  lastHistoryTick: 0,
  idleWasteMs: 0,
  lastDispatchedAt: {},

  startGame: (difficulty) => {
    const config = buildConfig(difficulty)
    set({
      phase: 'phase1',
      config,
      gameStartTime: Date.now(),
      phaseElapsed: 0,
      arrivalSchedule: generateBucketedArrivalSchedule(
        config.phase1Duration,
        config.phase1Buckets,
        config.referenceWPM,
      ),
      nextArrivalIndex: 0,
      phase1Result: null,
      activePhase1TaskId: null,
      tasks: {},
      queue: [],
      cores: [],
      liveMetrics: { ...DEFAULT_METRICS },
      runSummary: null,
      throughputHistory: [],
      queueLengthHistory: [],
      coreBusyMs: [],
      lastHistoryTick: 0,
      idleWasteMs: 0,
      lastDispatchedAt: {},
    })
  },

  startPhase2: (difficulty) => {
    const phase2Config = buildConfig(difficulty)
    const coreCount = phase2Config.phase2CoreCount
    const cores: Core[] = Array.from({ length: coreCount }, (_, i) => ({
      id: i,
      status: 'idle',
      currentTaskId: null,
      progress: 0,
      completedTaskCount: 0,
    }))
    set({
      phase: 'phase2',
      config: phase2Config,
      gameStartTime: Date.now(),
      phaseElapsed: 0,
      arrivalSchedule: generateBucketedArrivalSchedule(
        phase2Config.phase2Duration,
        phase2Config.phase2Buckets,
        PHASE2_REFERENCE_WPM,
      ),
      nextArrivalIndex: 0,
      tasks: {},
      queue: [],
      cores,
      liveMetrics: { ...DEFAULT_METRICS, perCoreUtilization: Array<number>(coreCount).fill(0) },
      throughputHistory: [],
      queueLengthHistory: [],
      coreBusyMs: Array<number>(coreCount).fill(0),
      lastHistoryTick: 0,
      idleWasteMs: 0,
      lastDispatchedAt: {},
    })
  },

  dispatchTask: (coreId) => {
    const { tasks, queue, cores, phaseElapsed, lastDispatchedAt } = get()
    const taskId = queue[0]
    if (!taskId) return
    const task = tasks[taskId]
    const core = cores[coreId]
    if (!task || task.status !== 'waiting') return
    if (!core || core.status !== 'idle') return

    set({
      tasks: {
        ...tasks,
        [taskId]: {
          ...task,
          status: 'running',
          assignedCoreId: coreId,
          dispatchTime: phaseElapsed,
          serviceStartTime: phaseElapsed,
        },
      },
      cores: cores.map((c, i) =>
        i === coreId
          ? { ...c, status: 'busy', currentTaskId: taskId, progress: 0, busySince: phaseElapsed }
          : c,
      ),
      queue: queue.filter(id => id !== taskId),
      lastDispatchedAt: { ...lastDispatchedAt, [coreId]: phaseElapsed },
    })
  },

  typeChar: (char) => {
    const { activePhase1TaskId, tasks, queue, gameStartTime } = get()
    if (!activePhase1TaskId || gameStartTime === null) return

    const task = tasks[activePhase1TaskId]
    if (!task || task.status !== 'active') return

    const content = task.content ?? ''
    const typed = task.typedContent ?? ''

    // Do not allow typing past end of content
    if (typed.length >= content.length) return

    const nowMs = Date.now() - gameStartTime
    const firstKeystrokeTime = task.firstKeystrokeTime ?? nowMs
    const newTyped = typed + char

    // Task completes only when all characters match exactly
    const isComplete =
      newTyped.length === content.length &&
      [...newTyped].every((c, i) => c === content[i])

    if (!isComplete) {
      set({ tasks: { ...tasks, [activePhase1TaskId]: { ...task, typedContent: newTyped, firstKeystrokeTime } } })
      return
    }

    const newTasks: Record<string, Task> = {
      ...tasks,
      [activePhase1TaskId]: { ...task, typedContent: newTyped, status: 'completed', completionTime: nowMs, firstKeystrokeTime },
    }
    const newQueue = [...queue]
    let newActiveId: string | null = null

    while (newQueue.length > 0) {
      const nextId = newQueue.shift()!
      const nextTask = newTasks[nextId]
      if (nextTask?.status === 'waiting') {
        newActiveId = nextId
        newTasks[nextId] = { ...nextTask, status: 'active', serviceStartTime: nowMs }
        break
      }
    }

    set({ tasks: newTasks, queue: newQueue, activePhase1TaskId: newActiveId })
  },

  handleBackspace: () => {
    const { activePhase1TaskId, tasks } = get()
    if (!activePhase1TaskId) return
    const task = tasks[activePhase1TaskId]
    if (!task || task.status !== 'active') return
    const typed = task.typedContent ?? ''
    if (typed.length === 0) return
    set({ tasks: { ...tasks, [activePhase1TaskId]: { ...task, typedContent: typed.slice(0, -1) } } })
  },

  tick: (now) => {
    const state = get()
    if (state.gameStartTime === null) return
    const elapsed = now - state.gameStartTime

    if (state.phase === 'phase1') {
      set(computePhase1Tick(state, elapsed))
      return
    }

    if (state.phase === 'phase2') {
      set(computePhase2Tick(state, elapsed))
    }
  },

  endRun: () => set({ phase: 'postrun' }),

  reset: () =>
    set({
      phase: 'idle',
      config: DEFAULT_CONFIG,
      gameStartTime: null,
      phaseElapsed: 0,
      arrivalSchedule: [],
      nextArrivalIndex: 0,
      phase1Result: null,
      activePhase1TaskId: null,
      tasks: {},
      queue: [],
      cores: [],
      liveMetrics: { ...DEFAULT_METRICS },
      runSummary: null,
      throughputHistory: [],
      queueLengthHistory: [],
      coreBusyMs: [],
      lastHistoryTick: 0,
      idleWasteMs: 0,
      lastDispatchedAt: {},
    }),

  returnToMenu: () =>
    set({
      phase: 'idle',
      gameStartTime: null,
      phaseElapsed: 0,
      arrivalSchedule: [],
      nextArrivalIndex: 0,
      activePhase1TaskId: null,
      tasks: {},
      queue: [],
      cores: [],
      liveMetrics: { ...DEFAULT_METRICS },
      runSummary: null,
      throughputHistory: [],
      queueLengthHistory: [],
      coreBusyMs: [],
      lastHistoryTick: 0,
      idleWasteMs: 0,
      lastDispatchedAt: {},
      // phase1Result and config are intentionally retained for Phase 2
    }),
}))
