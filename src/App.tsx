import { useEffect, useState } from 'react'
import { useGameLoop } from './hooks/useGameLoop'
import { useGameStore } from './store/gameStore'
import { StartScreen } from './components/game/StartScreen'
import { Phase1View } from './components/game/Phase1View'
import { Phase1Complete } from './components/game/Phase1Complete'
import { Phase2View } from './components/game/Phase2View'
import { PostRunSummary } from './components/game/PostRunSummary'
import Phase2DebriefPopup from './components/game/Phase2DebriefPopup'

function App() {
  useGameLoop()
  const phase = useGameStore(s => s.phase)
  const runSummary = useGameStore(s => s.runSummary)

  const [phase2PopupSeen, setPhase2PopupSeen] = useState(false)

  useEffect(() => {
    if (phase === 'idle') setPhase2PopupSeen(false)
  }, [phase])

  if (phase === 'idle') return <StartScreen />
  if (phase === 'phase1') return <Phase1View />
  if (phase === 'phase2') return <Phase2View />

  if (phase === 'postrun') {
    if (runSummary === null) return <Phase1Complete />
    if (!phase2PopupSeen) return <Phase2DebriefPopup onDismiss={() => setPhase2PopupSeen(true)} />
    return <PostRunSummary />
  }

  return null
}

export default App
