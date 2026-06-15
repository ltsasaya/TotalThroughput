import { useGameStore } from '@/store/gameStore'
import { useAccountStore } from '@/store/accountStore'

interface RetroHeaderProps {
  onHome?: () => void
  onGameMenu?: () => void
}

export function RetroHeader({ onHome, onGameMenu }: RetroHeaderProps) {
  const goHome = useGameStore(s => s.goHome)
  const goGameMenu = useGameStore(s => s.goGameMenu)
  const openAuth = useGameStore(s => s.openAuth)
  const openProfile = useGameStore(s => s.openProfile)
  const openInstructorDashboard = useGameStore(s => s.openInstructorDashboard)
  const openGlobalData = useGameStore(s => s.openGlobalData)
  const user = useAccountStore(s => s.user)
  const handleHome = onHome ?? goHome
  const handleGameMenu = onGameMenu ?? goGameMenu
  const handleInstructor = () => {
    if (user) openInstructorDashboard()
    else openAuth('instructorDashboard')
  }

  return (
    <header className="retro-app-nav retro-app-nav-with-home" aria-label="Placeholder navigation">
      <nav className="retro-app-nav-left" aria-label="Game navigation">
        <button type="button" className="retro-header-text retro-app-home" onClick={handleHome}>
          Home
        </button>
        <button type="button" className="retro-header-text retro-app-home" onClick={handleGameMenu}>
          Game Menu
        </button>
        <button type="button" className="retro-header-text retro-app-nav-link" onClick={openGlobalData}>
          Global Data
        </button>
      </nav>

      <div className="retro-app-nav-right">
        <button type="button" className="retro-header-text retro-app-nav-link" onClick={handleInstructor}>
          For Instructors
        </button>
        <div className="retro-app-nav-actions">
          <button
            type="button"
            className="retro-header-text retro-app-signin"
            onClick={user ? () => openProfile() : () => openAuth(null)}
          >
            {user ? 'Profile' : 'Sign In'}
          </button>
        </div>
      </div>
    </header>
  )
}
