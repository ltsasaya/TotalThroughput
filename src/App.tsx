import { useEffect, useState } from 'react'
import { useGameLoop } from './hooks/useGameLoop'
import { useGameStore } from './store/gameStore'
import { StartScreen } from './components/game/StartScreen'
import { Phase1View } from './components/game/Phase1View'
import { Phase2View } from './components/game/Phase2View'
import { PostRunSummary } from './components/game/PostRunSummary'
import { CalibrationView } from './components/game/CalibrationView'
import { CalibrationSummaryView } from './components/game/CalibrationSummaryView'
import { DifficultySelectView } from './components/game/DifficultySelectView'
import { Phase1RunSummary } from './components/game/Phase1RunSummary'
import Phase2DebriefPopup from './components/game/Phase2DebriefPopup'
import { SimulationLabView } from './components/game/SimulationLabView'

function App() {
  useGameLoop()
  const phase = useGameStore(s => s.phase)
  const runSummary = useGameStore(s => s.runSummary)
  const systemNotification = useGameStore(s => s.systemNotification)
  const clearSystemNotification = useGameStore(s => s.clearSystemNotification)

  const [phase2PopupSeen, setPhase2PopupSeen] = useState(false)

  const systemNotice = systemNotification ? (
    <div className="tt-system-notice" role="status" aria-live="polite">
      <span>{systemNotification}</span>
      <button type="button" onClick={clearSystemNotification} aria-label="Dismiss system notification">
        Dismiss
      </button>
    </div>
  ) : null

  useEffect(() => {
    if (phase === 'idle') {
      setPhase2PopupSeen(false)
    }
  }, [phase])

  if (phase === 'idle') return <>{systemNotice}<StartScreen /></>
  if (phase === 'calibration') return <>{systemNotice}<CalibrationView /></>
  if (phase === 'calibrationSummary') return <>{systemNotice}<CalibrationSummaryView /></>
  if (phase === 'difficultySelect') return <>{systemNotice}<DifficultySelectView /></>
  if (phase === 'simulationLab') return <>{systemNotice}<SimulationLabView /></>
  if (phase === 'phase1') return <>{systemNotice}<Phase1View /></>
  if (phase === 'phase1Summary') return <>{systemNotice}<Phase1RunSummary /></>
  if (phase === 'phase2') return <>{systemNotice}<Phase2View /></>

  if (phase === 'postrun') {
    if (runSummary === null) {
      return <>{systemNotice}<StartScreen /></>
    }
    if (!phase2PopupSeen) return <>{systemNotice}<Phase2DebriefPopup onDismiss={() => setPhase2PopupSeen(true)} /></>
    return <>{systemNotice}<PostRunSummary /></>
  }

  return null
}

export default App
