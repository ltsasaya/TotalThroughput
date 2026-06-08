import { StatusBadge } from '@/components/ui/primitives'

function fmtTimer(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface TopBarProps {
  label: string
  remaining: number
  droppedCount?: number
  dropLimit?: number
  queueLength?: number
  queueLimit?: number
  score?: number
  latencyWarning?: boolean
  isFinalStretch?: boolean
}

export function TopBar({ label, remaining, droppedCount, dropLimit, queueLength, queueLimit, score, latencyWarning, isFinalStretch }: TopBarProps) {
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
  const showQueue =
    queueLength !== undefined &&
    (queueLimit === undefined || queueLength >= queueLimit * 0.7)
  const queueColor = queueLimit !== undefined && queueLength !== undefined && queueLength >= queueLimit
    ? 'text-[color:var(--tt-danger)]'
    : 'text-[color:var(--tt-warning)]'

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-[color:var(--tt-border)] bg-[color:var(--tt-surface)] px-6 py-3">
      <span className="text-sm font-medium text-[color:var(--tt-text-muted)]">{label}</span>

      <span className={`text-2xl font-mono font-bold ${timerColor}`}>{fmtTimer(remaining)}</span>

      <div className="flex flex-wrap items-center gap-3">
        {showDrops && (
          <span className={`text-sm ${droppedColor}`}>
            Dropped: {droppedCount}/{dropLimit}
          </span>
        )}

        {showQueue && (
          <span className={`text-sm ${queueColor}`}>
            Queue: {queueLimit === undefined ? queueLength : `${queueLength}/${queueLimit}`}
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
