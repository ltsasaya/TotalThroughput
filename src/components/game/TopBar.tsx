function fmtTimer(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface TopBarProps {
  label: string
  remaining: number
  droppedCount: number
  dropLimit: number
  queueLength: number
  queueLimit: number
  score?: number
  latencyWarning?: boolean
  isFinalStretch?: boolean
}

export function TopBar({ label, remaining, droppedCount, dropLimit, queueLength, queueLimit, score, latencyWarning, isFinalStretch }: TopBarProps) {
  const timerColor = isFinalStretch
    ? 'text-red-500 animate-pulse'
    : remaining < 10_000
      ? 'text-red-400'
      : remaining < 20_000
        ? 'text-amber-400'
        : 'text-white'

  const droppedColor =
    droppedCount >= dropLimit
      ? 'text-red-400'
      : droppedCount >= dropLimit * 0.7
        ? 'text-amber-400'
        : 'text-gray-400'

  const showQueue = queueLength >= queueLimit * 0.7
  const queueColor = queueLength >= queueLimit ? 'text-red-400' : 'text-amber-400'

  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      <span className="text-sm text-gray-400 font-medium">{label}</span>

      <span className={`text-2xl font-mono font-bold ${timerColor}`}>{fmtTimer(remaining)}</span>

      <div className="flex gap-6 items-center">
        <span className={`text-sm ${droppedColor}`}>
          Dropped: {droppedCount}/{dropLimit}
        </span>

        {showQueue && (
          <span className={`text-sm ${queueColor}`}>
            Queue: {queueLength}/{queueLimit}
          </span>
        )}

        {latencyWarning && (
          <span className="text-sm font-semibold text-amber-400 animate-pulse">
            Latency!
          </span>
        )}

        {score !== undefined && (
          <span className="text-sm text-blue-300 font-semibold">Score: {score}</span>
        )}
      </div>
    </div>
  )
}
