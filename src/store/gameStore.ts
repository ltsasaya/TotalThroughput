import { create } from 'zustand'
import type { Task } from '../types/task'
import type { Core } from '../types/core'
import type {
  CalibrationResult,
  DifficultyMode,
  GameConfig,
  GamePhase,
  Phase1DifficultyKey,
  Phase1DifficultyOption,
  Phase1LevelConfig,
  Phase1RunConfig,
} from '../types/game'
import type { LiveMetrics, Phase1LevelResult, Phase1Result, Phase1RunRecord, RunSummary, TimePoint } from '../types/metrics'
import type { ScheduledArrival } from '../simulation/arrival'
import { computePhase1RunTick } from '../simulation/phase1Tick'
import { computePhase2Tick } from '../simulation/phase2Tick'
import { buildPhase1Levels } from '../simulation/phase1Levels'
import {
  buildCalibrationText,
  buildPhase1DifficultyOptions,
  calculateCalibrationResult,
  CALIBRATION_DURATION_MS,
} from '../simulation/calibration'
import {
  buildPhase1RunConfig,
  buildPhase1RunRecord,
  findPhase1DifficultyOption,
  generatePhase1RunArrivalSchedule,
  PHASE1_RUN_DURATION_MS,
} from '../simulation/phase1Runs'
import {
  buildPhase2RunConfig,
  generatePhase2ArrivalSchedule,
  phase2WorkerCount,
  PHASE2_DURATION_MS,
} from '../simulation/phase2Runs'
import { savePhase1RunIfSignedIn } from '../api/client'

function navigationInterruptionMessage(phase: GamePhase): string | null {
  if (phase === 'calibration') return "Current calibration wasn't saved."
  if (phase === 'phase1' || phase === 'phase2') return "Current run wasn't saved."
  return null
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: GameConfig = {
  difficulty: 'standard',
  phase2CoreCount: 4,
  phase1Duration: PHASE1_RUN_DURATION_MS,
  phase2Duration: PHASE2_DURATION_MS,
  queueSizeLimit: 6,
  dropLimit: 5,
  showTrueServiceDemand: false,
  deadlineMultiplier: 1.0,
  referenceWPM: 70,
  phase1Levels: buildPhase1Levels('standard'),
  phase2Run: buildPhase2RunConfig('standard', 3_000),
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
  arrivalRate: 0,
  targetPerWorkerLoad: 0,
}

// Temporary BOSS-requested run-testing bypass; remove before finalizing calibration.
const TEMP_RUN_TESTING_CALIBRATION_WPM = 100

function buildTemporaryRunTestingCalibration(): CalibrationResult {
  const correctCharsForWpm = Math.round(TEMP_RUN_TESTING_CALIBRATION_WPM * 5 * (CALIBRATION_DURATION_MS / 60_000))
  const typedContent = 'a'.repeat(correctCharsForWpm)
  return calculateCalibrationResult({
    text: typedContent,
    typedContent,
    firstKeystrokeTime: 0,
  })
}

function resolveMenuCalibration(
  calibrationResult: CalibrationResult | null,
  phase1DifficultyOptions: Phase1DifficultyOption[],
) {
  const resolvedCalibration = calibrationResult ?? buildTemporaryRunTestingCalibration()
  const resolvedOptions = calibrationResult && phase1DifficultyOptions.length > 0
    ? phase1DifficultyOptions
    : buildPhase1DifficultyOptions(resolvedCalibration)

  return {
    calibrationResult: resolvedCalibration,
    phase1DifficultyOptions: resolvedOptions,
  }
}

function buildConfig(difficulty: DifficultyMode, phase2ServiceDemandMs = 3_000): GameConfig {
  const phase2CoreCount = phase2WorkerCount(difficulty)
  const phase2Run = buildPhase2RunConfig(difficulty, phase2ServiceDemandMs)
  switch (difficulty) {
    case 'beginner':
      return {
        ...DEFAULT_CONFIG,
        difficulty,
        phase2CoreCount,
        phase2Duration: phase2Run.arrivalWindowMs,
        queueSizeLimit: 6,
        dropLimit: 4,
        deadlineMultiplier: 1.25,
        referenceWPM: 40,
        phase1Levels: buildPhase1Levels(difficulty),
        phase2Run,
      }
    case 'hard':
      return {
        ...DEFAULT_CONFIG,
        difficulty,
        phase2CoreCount,
        phase2Duration: phase2Run.arrivalWindowMs,
        queueSizeLimit: 5,
        dropLimit: 3,
        deadlineMultiplier: 0.75,
        referenceWPM: 100,
        phase1Levels: buildPhase1Levels(difficulty),
        phase2Run,
      }
    case 'theory':
      return {
        ...DEFAULT_CONFIG,
        difficulty,
        phase2CoreCount,
        phase2Duration: phase2Run.arrivalWindowMs,
        showTrueServiceDemand: true,
        phase1Levels: buildPhase1Levels(difficulty),
        phase2Run,
      }
    default:
      return {
        ...DEFAULT_CONFIG,
        difficulty,
        phase2CoreCount,
        phase2Duration: phase2Run.arrivalWindowMs,
        phase1Levels: buildPhase1Levels(difficulty),
        phase2Run,
      }
  }
}

function buildPhase1ResultFromRecord(record: Phase1RunRecord): Phase1Result {
  return {
    measuredTasksPerSecond: record.averageServiceDemand > 0 ? 1000 / record.averageServiceDemand : 0,
    avgServiceTime: record.averageServiceDemand || record.serviceDemandEstimateMs,
    avgResponseTime: record.averageResponseTime,
    arrivalRate: record.arrivalRate,
    arrivalCount: record.arrivalCount,
    completedCount: record.completedCount,
    activeWindowCompletedCount: record.completedCount,
    tailCompletedCount: 0,
    activeWindowThroughput: record.throughputPerSecond,
    droppedCount: 0,
    unfinishedAtEndCount: record.stillWaitingCount,
    servedShare: record.arrivalCount > 0 ? record.completedCount / record.arrivalCount : 0,
    avgReactionSpeed: record.reactionSpeed,
    avgTypingSpeed: record.averageTypingSpeed,
    passed: true,
    levelResults: [],
    arrivalWindowMs: record.durationMs,
    drainTailMs: 0,
    durationMs: record.durationMs,
    failed: false,
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

  calibrationText: string
  calibrationTypedContent: string
  calibrationFirstKeystrokeTime: number | null
  calibrationResult: CalibrationResult | null
  phase1DifficultyOptions: Phase1DifficultyOption[]
  selectedPhase1Difficulty: Phase1DifficultyKey | null
  phase1RunConfig: Phase1RunConfig | null
  phase1RunRecords: Phase1RunRecord[]
  lastPhase1RunRecord: Phase1RunRecord | null
  hasSeenEducationalManual: boolean
  selectedClassId: string | null
  returnPhaseAfterAuth: GamePhase | null

  arrivalSchedule: ScheduledArrival[]
  nextArrivalIndex: number

  phase1Levels: Phase1LevelConfig[]
  currentPhase1LevelIndex: number
  phase1LevelResults: Phase1LevelResult[]
  phase1MaxQueueLength: number
  phase1Result: Phase1Result | null
  activePhase1TaskId: string | null

  tasks: Record<string, Task>
  queue: string[]

  cores: Core[]

  liveMetrics: LiveMetrics
  runSummary: RunSummary | null

  throughputHistory: TimePoint[]
  queueLengthHistory: TimePoint[]
  coreBusyMs: number[]
  lastHistoryTick: number
  idleWasteMs: number
  lastDispatchedAt: Record<number, number>
  systemNotification: string | null

  startGame: (difficulty?: DifficultyMode) => void
  goHome: () => void
  goGameMenu: () => void
  openSimulationLab: () => void
  openConcurrencyRaceSample: () => void
  openAuth: (returnPhase?: GamePhase | null) => void
  openProfile: () => void
  openInstructorDashboard: () => void
  openClassDashboard: (classId: string) => void
  openJoinClass: () => void
  openGlobalData: () => void
  consumeReturnPhaseAfterAuth: () => GamePhase | null
  clearSystemNotification: () => void
  markEducationalManualSeen: () => void
  startCalibration: () => void
  typeCalibrationChar: (char: string) => void
  handleCalibrationBackspace: () => void
  finishCalibration: () => void
  startCalibratedRun: (difficulty: Phase1DifficultyKey) => void
  returnToDifficultySelect: () => void
  recalibrate: () => void
  startPhase2: (difficulty: DifficultyMode) => void
  dispatchTask: (coreId: number) => void
  typeChar: (char: string) => void
  handleBackspace: () => void
  tick: (now: number) => void
  endRun: () => void
  reset: () => void
  returnToMenu: () => void
}

const initialCalibrationText = buildCalibrationText()

function resetRunState() {
  return {
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
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'idle',
  config: DEFAULT_CONFIG,
  gameStartTime: null,
  phaseElapsed: 0,
  calibrationText: initialCalibrationText,
  calibrationTypedContent: '',
  calibrationFirstKeystrokeTime: null,
  calibrationResult: null,
  phase1DifficultyOptions: [],
  selectedPhase1Difficulty: null,
  phase1RunConfig: null,
  phase1RunRecords: [],
  lastPhase1RunRecord: null,
  hasSeenEducationalManual: false,
  selectedClassId: null,
  returnPhaseAfterAuth: null,
  arrivalSchedule: [],
  nextArrivalIndex: 0,
  phase1Levels: [...DEFAULT_CONFIG.phase1Levels],
  currentPhase1LevelIndex: 0,
  phase1LevelResults: [],
  phase1MaxQueueLength: 0,
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
  systemNotification: null,

  startGame: () => {
    const state = get()
    const hasCompletedCalibration = state.calibrationResult !== null
    const menuCalibration = resolveMenuCalibration(state.calibrationResult, state.phase1DifficultyOptions)
    set({
      phase: 'difficultySelect',
      config: { ...DEFAULT_CONFIG, phase1Duration: PHASE1_RUN_DURATION_MS },
      ...resetRunState(),
      calibrationText: initialCalibrationText,
      calibrationTypedContent: '',
      calibrationFirstKeystrokeTime: null,
      ...menuCalibration,
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      phase1RunRecords: hasCompletedCalibration ? state.phase1RunRecords : [],
      lastPhase1RunRecord: hasCompletedCalibration ? state.lastPhase1RunRecord : null,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      phase1MaxQueueLength: 0,
      phase1Result: hasCompletedCalibration ? state.phase1Result : null,
      systemNotification: null,
    })
  },

  goHome: () => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    set({
      phase: 'idle',
      config: DEFAULT_CONFIG,
      ...resetRunState(),
      calibrationText: initialCalibrationText,
      calibrationTypedContent: '',
      calibrationFirstKeystrokeTime: null,
      calibrationResult: state.calibrationResult,
      phase1DifficultyOptions: state.phase1DifficultyOptions,
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      phase1RunRecords: state.phase1RunRecords,
      lastPhase1RunRecord: state.lastPhase1RunRecord,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      phase1Levels: [...DEFAULT_CONFIG.phase1Levels],
      currentPhase1LevelIndex: 0,
      phase1LevelResults: [],
      phase1MaxQueueLength: 0,
      phase1Result: state.phase1Result,
      systemNotification,
    })
  },

  goGameMenu: () => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    const menuCalibration = resolveMenuCalibration(state.calibrationResult, state.phase1DifficultyOptions)
    set({
      phase: 'difficultySelect',
      config: { ...DEFAULT_CONFIG, phase1Duration: PHASE1_RUN_DURATION_MS },
      ...resetRunState(),
      calibrationText: initialCalibrationText,
      calibrationTypedContent: '',
      calibrationFirstKeystrokeTime: null,
      ...menuCalibration,
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      phase1MaxQueueLength: 0,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      systemNotification,
    })
  },

  openSimulationLab: () => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    set({
      phase: 'simulationLab',
      config: { ...DEFAULT_CONFIG, phase1Duration: PHASE1_RUN_DURATION_MS },
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      phase1MaxQueueLength: 0,
      selectedClassId: null,
      systemNotification: systemNotification ?? state.systemNotification,
    })
  },

  openConcurrencyRaceSample: () => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    set({
      phase: 'concurrencyRaceSample',
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      phase1MaxQueueLength: 0,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      systemNotification: systemNotification ?? state.systemNotification,
    })
  },

  openAuth: (returnPhase = null) => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    set({
      phase: 'auth',
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      selectedClassId: null,
      returnPhaseAfterAuth: returnPhase,
      systemNotification,
    })
  },

  openProfile: () => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    set({
      phase: 'profile',
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      systemNotification,
    })
  },

  openInstructorDashboard: () => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    set({
      phase: 'instructorDashboard',
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      systemNotification,
    })
  },

  openClassDashboard: (classId) => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    set({
      phase: 'classDashboard',
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      selectedClassId: classId,
      returnPhaseAfterAuth: null,
      systemNotification,
    })
  },

  openJoinClass: () => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    set({
      phase: 'joinClass',
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      systemNotification,
    })
  },

  openGlobalData: () => {
    const state = get()
    const systemNotification = navigationInterruptionMessage(state.phase)
    set({
      phase: 'globalData',
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      systemNotification,
    })
  },

  consumeReturnPhaseAfterAuth: () => {
    const returnPhase = get().returnPhaseAfterAuth
    set({ returnPhaseAfterAuth: null })
    return returnPhase
  },

  clearSystemNotification: () => set({ systemNotification: null }),

  markEducationalManualSeen: () => set({ hasSeenEducationalManual: true }),

  startCalibration: () => {
    set({
      phase: 'calibration',
      config: { ...DEFAULT_CONFIG, phase1Duration: PHASE1_RUN_DURATION_MS },
      ...resetRunState(),
      calibrationText: buildCalibrationText(),
      calibrationTypedContent: '',
      calibrationFirstKeystrokeTime: null,
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      phase1MaxQueueLength: 0,
      systemNotification: null,
    })
  },

  typeCalibrationChar: (char) => {
    const { phase, calibrationText, calibrationTypedContent, calibrationFirstKeystrokeTime, gameStartTime } = get()
    if (phase !== 'calibration') return
    if (calibrationTypedContent.length >= calibrationText.length) return
    const now = Date.now()
    const calibrationStartedAt = gameStartTime ?? now
    const clockElapsed = gameStartTime === null ? 0 : now - gameStartTime
    if (clockElapsed >= CALIBRATION_DURATION_MS) {
      get().finishCalibration()
      return
    }
    set({
      gameStartTime: calibrationStartedAt,
      calibrationTypedContent: calibrationTypedContent + char,
      calibrationFirstKeystrokeTime: calibrationFirstKeystrokeTime ?? 0,
    })
  },

  handleCalibrationBackspace: () => {
    const { phase, calibrationTypedContent, gameStartTime, phaseElapsed } = get()
    if (phase !== 'calibration' || calibrationTypedContent.length === 0) return
    const clockElapsed = gameStartTime === null ? phaseElapsed : Date.now() - gameStartTime
    if (clockElapsed >= CALIBRATION_DURATION_MS) {
      get().finishCalibration()
      return
    }
    set({ calibrationTypedContent: calibrationTypedContent.slice(0, -1) })
  },

  finishCalibration: () => {
    const { calibrationText, calibrationTypedContent, calibrationFirstKeystrokeTime } = get()
    const calibrationResult = calculateCalibrationResult({
      text: calibrationText,
      typedContent: calibrationTypedContent,
      firstKeystrokeTime: calibrationFirstKeystrokeTime ?? undefined,
    })
    set({
      phase: 'calibrationSummary',
      gameStartTime: null,
      phaseElapsed: CALIBRATION_DURATION_MS,
      calibrationResult,
      phase1DifficultyOptions: buildPhase1DifficultyOptions(calibrationResult),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      activePhase1TaskId: null,
      tasks: {},
      queue: [],
      liveMetrics: { ...DEFAULT_METRICS },
      systemNotification: null,
    })
  },

  startCalibratedRun: (difficulty) => {
    const { calibrationResult, phase1DifficultyOptions, phase1RunRecords } = get()
    if (!calibrationResult) return
    const option = findPhase1DifficultyOption(phase1DifficultyOptions, difficulty)
    if (!option) return
    const phase1RunConfig = buildPhase1RunConfig({
      option,
      calibrationResult,
      runIndex: phase1RunRecords.length,
    })
    set({
      phase: 'phase1',
      config: { ...DEFAULT_CONFIG, phase1Duration: PHASE1_RUN_DURATION_MS },
      gameStartTime: Date.now(),
      phaseElapsed: 0,
      arrivalSchedule: generatePhase1RunArrivalSchedule(phase1RunConfig),
      nextArrivalIndex: 0,
      selectedPhase1Difficulty: difficulty,
      phase1RunConfig,
      phase1MaxQueueLength: 0,
      activePhase1TaskId: null,
      tasks: {},
      queue: [],
      cores: [],
      liveMetrics: {
        ...DEFAULT_METRICS,
        arrivalRate: phase1RunConfig.lambda,
        targetPerWorkerLoad: phase1RunConfig.targetLoad,
        idealThroughput: phase1RunConfig.lambda,
        perCoreUtilization: [0],
      },
      runSummary: null,
      throughputHistory: [],
      queueLengthHistory: [],
      coreBusyMs: [],
      lastHistoryTick: 0,
      idleWasteMs: 0,
      lastDispatchedAt: {},
      systemNotification: null,
    })
  },

  returnToDifficultySelect: () => {
    set({
      phase: 'difficultySelect',
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      phase1MaxQueueLength: 0,
      systemNotification: null,
    })
  },

  recalibrate: () => {
    get().startCalibration()
  },

  startPhase2: (difficulty) => {
    const phase1Result = get().phase1Result
    const phase2Config = buildConfig(difficulty, phase1Result?.avgServiceTime)
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
      arrivalSchedule: generatePhase2ArrivalSchedule(phase2Config.phase2Run),
      nextArrivalIndex: 0,
      currentPhase1LevelIndex: 0,
      phase1LevelResults: [],
      phase1MaxQueueLength: 0,
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
      systemNotification: null,
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
    const { phase, activePhase1TaskId, tasks, queue, phaseElapsed, gameStartTime } = get()
    if (phase !== 'phase1' || !activePhase1TaskId) return
    const clockElapsed = gameStartTime === null ? phaseElapsed : Date.now() - gameStartTime
    if (gameStartTime !== null && clockElapsed >= PHASE1_RUN_DURATION_MS) {
      get().tick(gameStartTime + PHASE1_RUN_DURATION_MS)
      return
    }

    const task = tasks[activePhase1TaskId]
    if (!task || task.status !== 'active') return

    const content = task.content ?? ''
    const typed = task.typedContent ?? ''
    if (typed.length >= content.length) return

    const nowMs = Math.max(phaseElapsed, clockElapsed)
    const firstKeystrokeTime = task.firstKeystrokeTime ?? nowMs
    const newTyped = typed + char
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
    const { phase, activePhase1TaskId, tasks, gameStartTime, phaseElapsed } = get()
    if (phase !== 'phase1' || !activePhase1TaskId) return
    const clockElapsed = gameStartTime === null ? phaseElapsed : Date.now() - gameStartTime
    if (gameStartTime !== null && clockElapsed >= PHASE1_RUN_DURATION_MS) {
      get().tick(gameStartTime + PHASE1_RUN_DURATION_MS)
      return
    }
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

    if (state.phase === 'calibration') {
      if (elapsed < CALIBRATION_DURATION_MS) {
        set({ phaseElapsed: Math.max(0, elapsed) })
        return
      }
      set({ phaseElapsed: CALIBRATION_DURATION_MS })
      get().finishCalibration()
      return
    }

    if (state.phase === 'phase1') {
      const phase1RunConfig = state.phase1RunConfig
      const calibrationResult = state.calibrationResult
      if (!phase1RunConfig || !calibrationResult) return
      const tickOutput = computePhase1RunTick({ ...state, phase1RunConfig }, elapsed)
      const { runEnded, ...phase1State } = tickOutput
      if (!runEnded) {
        set(phase1State)
        return
      }
      const runRecord = buildPhase1RunRecord({
        runConfig: phase1RunConfig,
        calibrationResult,
        tasks: tickOutput.tasks,
        maxQueueLength: tickOutput.phase1MaxQueueLength,
      })
      void savePhase1RunIfSignedIn(runRecord).catch(() => {
        set({ systemNotification: 'Run saved locally; server save failed.' })
      })
      set({
        ...phase1State,
        phase: 'phase1Summary',
        gameStartTime: null,
        phaseElapsed: PHASE1_RUN_DURATION_MS,
        lastPhase1RunRecord: runRecord,
        phase1RunRecords: [...state.phase1RunRecords, runRecord],
        phase1Result: buildPhase1ResultFromRecord(runRecord),
      })
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
      ...resetRunState(),
      calibrationText: initialCalibrationText,
      calibrationTypedContent: '',
      calibrationFirstKeystrokeTime: null,
      calibrationResult: null,
      phase1DifficultyOptions: [],
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      phase1RunRecords: [],
      lastPhase1RunRecord: null,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      phase1Levels: [...DEFAULT_CONFIG.phase1Levels],
      currentPhase1LevelIndex: 0,
      phase1LevelResults: [],
      phase1MaxQueueLength: 0,
      phase1Result: null,
      systemNotification: null,
    }),

  returnToMenu: () =>
    set({
      phase: 'idle',
      ...resetRunState(),
      selectedPhase1Difficulty: null,
      phase1RunConfig: null,
      activePhase1TaskId: null,
      selectedClassId: null,
      returnPhaseAfterAuth: null,
      systemNotification: null,
    }),
}))
