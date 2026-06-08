interface RetroHeaderProps {
  onHome?: () => void
}

export function RetroHeader({ onHome }: RetroHeaderProps) {
  return (
    <header className="retro-app-nav" aria-label="Placeholder navigation">
      <button type="button" className="retro-app-home" onClick={onHome}>
        Home
      </button>

      <div className="retro-app-nav-right">
        <span className="retro-app-nav-link">For Instructors</span>
        <div className="retro-app-nav-actions">
          <button type="button" disabled className="retro-app-signin">
            Sign in
          </button>
        </div>
      </div>
    </header>
  )
}
