import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../gameStore'
import { CALIBRATION_DURATION_MS } from '../../simulation/calibration'
import { PHASE1_RUN_DURATION_MS } from '../../simulation/phase1Runs'

function getState() {
  return useGameStore.getState()
}

function completeCalibration() {
  getState().startCalibration()
  useGameStore.setState({
    calibrationText: 'a'.repeat(150),
    calibrationTypedContent: 'a'.repeat(150),
    calibrationFirstKeystrokeTime: 250,
  })
  getState().finishCalibration()
}

function startMediumRun() {
  completeCalibration()
  getState().startCalibratedRun('medium')
}

beforeEach(() => {
  vi.useRealTimers()
  getState().reset()
  useGameStore.setState({ hasSeenEducationalManual: false })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('initial state', () => {
  it('starts in idle phase', () => {
    expect(getState().phase).toBe('idle')
  })

  it('has empty tasks and queue', () => {
    expect(Object.keys(getState().tasks)).toHaveLength(0)
    expect(getState().queue).toHaveLength(0)
  })
})

describe('calibration flow', () => {
  it('startGame opens the pre-calibration game menu', () => {
    getState().startGame('standard')
    expect(getState().phase).toBe('difficultySelect')
    expect(getState().gameStartTime).toBeNull()
    expect(getState().phaseElapsed).toBe(0)
    expect(getState().calibrationResult).toBeNull()
    expect(getState().phase1DifficultyOptions).toHaveLength(0)
  })

  it('does not start a calibrated run before calibration exists', () => {
    getState().startGame('standard')
    getState().startCalibratedRun('easy')

    expect(getState().phase).toBe('difficultySelect')
    expect(getState().phase1RunConfig).toBeNull()
  })

  it('does not start the calibration timer before the first input', () => {
    getState().startCalibration()

    getState().tick(Date.now() + CALIBRATION_DURATION_MS + 1)

    expect(getState().phase).toBe('calibration')
    expect(getState().gameStartTime).toBeNull()
    expect(getState().phaseElapsed).toBe(0)
  })

  it('starts the calibration timer on the first typed character', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T00:00:00Z'))
    getState().startCalibration()

    getState().typeCalibrationChar('a')

    expect(getState().gameStartTime).toBe(Date.now())
    expect(getState().calibrationFirstKeystrokeTime).toBe(0)
    expect(getState().calibrationTypedContent).toBe('a')
  })

  it('accepts calibration typing and backspace', () => {
    getState().startCalibration()
    getState().typeCalibrationChar('a')
    getState().typeCalibrationChar('b')
    expect(getState().calibrationTypedContent).toBe('ab')
    getState().handleCalibrationBackspace()
    expect(getState().calibrationTypedContent).toBe('a')
  })

  it('ends after 30 seconds and shows the calibration summary with difficulty options ready', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T00:00:00Z'))
    getState().startCalibration()
    getState().typeCalibrationChar('a')
    const start = getState().gameStartTime!
    useGameStore.setState({
      calibrationText: 'a'.repeat(150),
      calibrationTypedContent: 'a'.repeat(150),
    })

    getState().tick(start + CALIBRATION_DURATION_MS)

    expect(getState().phase).toBe('calibrationSummary')
    expect(getState().calibrationResult?.rawWpm).toBe(60)
    expect(getState().phase1DifficultyOptions.map(option => option.key)).toEqual([
      'easy',
      'medium',
      'hard',
      'impossible',
    ])
  })

  it('does not accept calibration input after the 30-second cutoff', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T00:00:00Z'))
    getState().startCalibration()
    getState().typeCalibrationChar('a')
    const start = getState().gameStartTime!

    vi.setSystemTime(start + CALIBRATION_DURATION_MS + 1)
    getState().typeCalibrationChar('b')

    expect(getState().phase).toBe('calibrationSummary')
    expect(getState().calibrationTypedContent).toBe('a')
    expect(getState().calibrationResult?.typedChars).toBe(1)
  })

  it('does not allow calibration backspace after the 30-second cutoff', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T00:00:00Z'))
    getState().startCalibration()
    getState().typeCalibrationChar('a')
    getState().typeCalibrationChar('b')
    const start = getState().gameStartTime!

    vi.setSystemTime(start + CALIBRATION_DURATION_MS + 1)
    getState().handleCalibrationBackspace()

    expect(getState().phase).toBe('calibrationSummary')
    expect(getState().calibrationTypedContent).toBe('ab')
    expect(getState().calibrationResult?.typedChars).toBe(2)
  })

  it('moves from calibration summary to the game menu', () => {
    completeCalibration()

    expect(getState().phase).toBe('calibrationSummary')

    getState().returnToDifficultySelect()

    expect(getState().phase).toBe('difficultySelect')
    expect(getState().calibrationResult).not.toBeNull()
    expect(getState().phase1DifficultyOptions).toHaveLength(4)
  })
})

describe('calibrated run flow', () => {
  it('starts a 60-second run from a selected difficulty', () => {
    startMediumRun()
    expect(getState().phase).toBe('phase1')
    expect(getState().phase1RunConfig?.difficulty.key).toBe('medium')
    expect(getState().phase1RunConfig?.lambda).toBeGreaterThan(0)
    expect(getState().arrivalSchedule.length).toBeGreaterThan(0)
  })

  it('spawns and activates requests from the calibrated arrival schedule', () => {
    startMediumRun()
    const firstArrival = getState().arrivalSchedule[0]
    const start = getState().gameStartTime!
    getState().tick(start + firstArrival.arrivalTime + 1)

    expect(Object.keys(getState().tasks).length).toBeGreaterThan(0)
    expect(getState().activePhase1TaskId).not.toBeNull()
  })

  it('types active requests and completes only exact matches', () => {
    startMediumRun()
    const firstArrival = getState().arrivalSchedule[0]
    getState().tick(getState().gameStartTime! + firstArrival.arrivalTime + 1)
    const activeId = getState().activePhase1TaskId!
    const content = getState().tasks[activeId].content!

    getState().typeChar(content[0] === 'a' ? 'b' : 'a')
    for (const char of content.slice(1)) getState().typeChar(char)
    expect(getState().tasks[activeId].status).toBe('active')

    for (let i = 0; i < content.length; i++) getState().handleBackspace()
    for (const char of content) getState().typeChar(char)
    expect(getState().tasks[activeId].status).toBe('completed')
  })

  it('creates a browser-only run record at 60 seconds', () => {
    startMediumRun()
    const start = getState().gameStartTime!
    getState().tick(start + PHASE1_RUN_DURATION_MS)

    expect(getState().phase).toBe('phase1Summary')
    expect(getState().lastPhase1RunRecord).not.toBeNull()
    expect(getState().phase1RunRecords).toHaveLength(1)
    expect(getState().lastPhase1RunRecord?.durationMs).toBe(PHASE1_RUN_DURATION_MS)
    expect(getState().lastPhase1RunRecord?.arrivalRate).toBe(getState().phase1RunConfig?.lambda)
  })

  it('does not accept run typing after the 60-second cutoff', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T00:00:00Z'))
    startMediumRun()
    const runStart = getState().gameStartTime!
    const firstArrival = getState().arrivalSchedule[0]
    getState().tick(runStart + firstArrival.arrivalTime + 1)
    const activeId = getState().activePhase1TaskId!
    expect(activeId).not.toBeNull()

    vi.setSystemTime(runStart + PHASE1_RUN_DURATION_MS + 1)
    getState().typeChar(getState().tasks[activeId].content![0])

    expect(getState().phase).toBe('phase1Summary')
    expect(getState().tasks[activeId].typedContent).toBe('')
    expect(getState().tasks[activeId].status).toBe('active')
    expect(getState().lastPhase1RunRecord?.completedCount).toBe(0)
  })

  it('does not allow run backspace after the 60-second cutoff', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-08T00:00:00Z'))
    startMediumRun()
    const runStart = getState().gameStartTime!
    const firstArrival = getState().arrivalSchedule[0]
    getState().tick(runStart + firstArrival.arrivalTime + 1)
    const activeId = getState().activePhase1TaskId!
    const firstChar = getState().tasks[activeId].content![0]
    getState().typeChar(firstChar)
    expect(getState().tasks[activeId].typedContent).toBe(firstChar)

    vi.setSystemTime(runStart + PHASE1_RUN_DURATION_MS + 1)
    getState().handleBackspace()

    expect(getState().phase).toBe('phase1Summary')
    expect(getState().tasks[activeId].typedContent).toBe(firstChar)
    expect(getState().lastPhase1RunRecord?.completedCount).toBe(0)
  })

  it('continues back to difficulty selection and can recalibrate', () => {
    startMediumRun()
    getState().tick(getState().gameStartTime! + PHASE1_RUN_DURATION_MS)

    getState().returnToDifficultySelect()
    expect(getState().phase).toBe('difficultySelect')
    expect(getState().phase1RunRecords).toHaveLength(1)

    getState().recalibrate()
    expect(getState().phase).toBe('calibration')
    expect(getState().phase1RunRecords).toHaveLength(1)
  })
})

describe('reset', () => {
  it('clears active gameplay and browser-session run records', () => {
    startMediumRun()
    getState().tick(getState().gameStartTime! + PHASE1_RUN_DURATION_MS)
    expect(getState().phase1RunRecords).toHaveLength(1)

    getState().reset()
    expect(getState().phase).toBe('idle')
    expect(getState().phase1RunRecords).toHaveLength(0)
    expect(getState().tasks).toEqual({})
  })
})

describe('persistent navigation', () => {
  it('routes an active calibration to the game menu with an unsaved notification', () => {
    getState().startCalibration()
    getState().typeCalibrationChar('a')

    getState().goGameMenu()

    expect(getState().phase).toBe('difficultySelect')
    expect(getState().gameStartTime).toBeNull()
    expect(getState().calibrationTypedContent).toBe('')
    expect(getState().systemNotification).toBe("Current calibration wasn't saved.")
  })

  it('routes an active run to the game menu without recording the unfinished run', () => {
    startMediumRun()
    const runStart = getState().gameStartTime!
    const firstArrival = getState().arrivalSchedule[0]
    getState().tick(runStart + firstArrival.arrivalTime + 1)

    getState().goGameMenu()

    expect(getState().phase).toBe('difficultySelect')
    expect(getState().phase1RunRecords).toHaveLength(0)
    expect(getState().phase1RunConfig).toBeNull()
    expect(getState().tasks).toEqual({})
    expect(getState().systemNotification).toBe("Current run wasn't saved.")
  })

  it('routes an active run home and clears browser-session progress', () => {
    startMediumRun()

    getState().goHome()

    expect(getState().phase).toBe('idle')
    expect(getState().calibrationResult).toBeNull()
    expect(getState().phase1RunRecords).toHaveLength(0)
    expect(getState().systemNotification).toBe("Current run wasn't saved.")
  })

  it('clears system notifications on request', () => {
    getState().startCalibration()
    getState().goHome()

    getState().clearSystemNotification()

    expect(getState().systemNotification).toBeNull()
  })
})

describe('educational manual discovery', () => {
  it('starts with the manual discovery cue unseen', () => {
    expect(getState().hasSeenEducationalManual).toBe(false)
  })

  it('stores that the manual icon was clicked across app flow navigation', () => {
    getState().startGame()
    getState().markEducationalManualSeen()

    getState().goHome()
    getState().startGame()
    getState().goGameMenu()

    expect(getState().hasSeenEducationalManual).toBe(true)
  })

  it('does not clear the manual discovery flag when reset clears game progress', () => {
    getState().markEducationalManualSeen()

    getState().reset()

    expect(getState().hasSeenEducationalManual).toBe(true)
  })
})
