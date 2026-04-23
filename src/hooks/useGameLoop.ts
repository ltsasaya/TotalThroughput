import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

const TICK_INTERVAL_MS = 100

// Starts and stops the simulation tick loop based on current game phase.
// Mount once at the app root. The interval cleans up automatically on
// phase transition to idle or postrun.
export function useGameLoop(): void {
  const tick = useGameStore(state => state.tick)
  const phase = useGameStore(state => state.phase)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const isRunning = phase === 'phase1' || phase === 'phase2'

    if (!isRunning) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      tick(Date.now())
    }, TICK_INTERVAL_MS)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [phase, tick])
}
