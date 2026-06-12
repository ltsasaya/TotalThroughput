import { StatusBadge } from '@/components/ui/primitives'
import { useGameStore } from '@/store/gameStore'

function fmtTimer(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface TopBarProps {
  label: string
  remaining: number
  droppedCount?: number
  dropLimit?: number
  score?: number
  latencyWarning?: boolean
  isFinalStretch?: boolean
}

export function TopBar({ label, remaining, droppedCount, dropLimit, score, latencyWarning, isFinalStretch }: TopBarProps) {
  const goHome = useGameStore(s => s.goHome)
  const goGameMenu = useGameStore(s => s.goGameMenu)
  const timerColor = isFinalStretch
    ? 'text-[color:var(--tt-danger)] animate-pulse'
    : remaining < 10_000
      ? 'text-[color:var(--tt-danger)]'
      : remaining < 20_000
        ? 'text-[color:var(--tt-warning)]'
        : 'text-[color:var(--tt-text)]'

  const droppedColor =
    droppedCount !== undefined && dropLimit !== undefined && droppedCount >= dropLimit
      ? 'text-[color:var(--tt-danger)]'
      : droppedCount !== undefined && dropLimit !== undefined && droppedCount >= dropLimit * 0.7
        ? 'text-[color:var(--tt-warning)]'
        : 'text-[color:var(--tt-text-muted)]'

  const showDrops = droppedCount !== undefined && dropLimit !== undefined

  return (
    <div className="retro-game-topbar">
      <div className="retro-game-topbar-left">
        <nav className="retro-game-nav" aria-label="Game navigation">
          <button type="button" className="retro-header-text retro-app-home" onClick={goHome}>Home</button>
          <button type="button" className="retro-header-text retro-app-home" onClick={goGameMenu}>Game Menu</button>
        </nav>
        <span className="text-sm font-bold text-[color:var(--tt-text-muted)]">{label}</span>
      </div>

      <span className={`text-2xl font-mono font-bold ${timerColor}`}>{fmtTimer(remaining)}</span>

      <div className="flex flex-wrap items-center gap-3">
        {showDrops && (
          <span className={`text-sm ${droppedColor}`}>
            Dropped: {droppedCount}/{dropLimit}
          </span>
        )}

        {latencyWarning && (
          <span className="animate-pulse text-sm font-semibold text-[color:var(--tt-warning)]">
            Latency!
          </span>
        )}

        {score !== undefined && (
          <StatusBadge tone="info">Score: {score}</StatusBadge>
        )}
      </div>
    </div>
  )
}
