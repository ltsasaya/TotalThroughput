import { beforeEach, describe, expect, it } from 'vitest'
import { useSimulationLabStore } from '../simulationLabStore'

describe('useSimulationLabStore', () => {
  beforeEach(() => {
    useSimulationLabStore.getState().resetInputs()
  })

  it('opens without computing a seeded run', () => {
    const state = useSimulationLabStore.getState()

    expect(state.currentRun).toBeNull()
    expect(state.sweepResults).toEqual([])
    expect(state.recentRuns).toEqual([])
  })

  it('computes a seeded run only after Run is requested', () => {
    const result = useSimulationLabStore.getState().runSimulation()

    const state = useSimulationLabStore.getState()
    expect(result).toBe('ran')
    expect(state.currentRun).not.toBeNull()
    expect(state.sweepResults.length).toBeGreaterThan(0)
    expect(state.recentRuns).toHaveLength(1)
    expect(state.recentRuns[0].seed).toBe(state.currentRun?.inputs.seed)
  })
})
