import { useGameStore } from '@/store/gameStore'

interface RetroHeaderProps {
  onHome?: () => void
  onGameMenu?: () => void
}

export function RetroHeader({ onHome, onGameMenu }: RetroHeaderProps) {
  const goHome = useGameStore(s => s.goHome)
  const goGameMenu = useGameStore(s => s.goGameMenu)
  const handleHome = onHome ?? goHome
  const handleGameMenu = onGameMenu ?? goGameMenu

  return (
    <header className="retro-app-nav retro-app-nav-with-home" aria-label="Placeholder navigation">
      <nav className="retro-app-nav-left" aria-label="Game navigation">
        <button type="button" className="retro-header-text retro-app-home" onClick={handleHome}>
          Home
        </button>
        <button type="button" className="retro-header-text retro-app-home" onClick={handleGameMenu}>
          Game Menu
        </button>
      </nav>

      <div className="retro-app-nav-right">
        <span className="retro-header-text retro-app-nav-link">For Instructors</span>
        <div className="retro-app-nav-actions">
          <button type="button" disabled className="retro-header-text retro-app-signin">
            Sign In
          </button>
        </div>
      </div>
    </header>
  )
}
