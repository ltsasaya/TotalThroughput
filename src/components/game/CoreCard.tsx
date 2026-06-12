import { useGameStore } from '@/store/gameStore'
import { Panel, SizeBadge, StatusBadge, cx } from '@/components/ui/primitives'
import type { Core } from '@/types/core'
import type { Task } from '@/types/task'

interface CoreCardProps {
  core: Core
  task: Task | null
  isFlashing: boolean
  isFinalStretch?: boolean
  onDispatch: () => void
}

export function CoreCard({ core, task, isFlashing, isFinalStretch, onDispatch }: CoreCardProps) {
  const phaseElapsed = useGameStore(s => s.phaseElapsed)
  const lastDispatchedAt = useGameStore(s => s.lastDispatchedAt)

  const isBusy = core.status === 'busy'
  const justDispatched = (lastDispatchedAt[core.id] ?? -Infinity) > phaseElapsed - 500

  let borderClass: string
  if (isFlashing) {
    borderClass = 'border-[color:var(--tt-danger)] ring-2 ring-[color:var(--tt-danger)] animate-pulse'
  } else if (justDispatched) {
    borderClass = 'border-[color:var(--tt-success)] ring-2 ring-[color:var(--tt-success)]'
  } else if (!isBusy) {
    borderClass = isFinalStretch
      ? 'border-[color:var(--tt-danger)] ring-1 ring-[color:var(--tt-danger)] animate-pulse'
      : 'border-[color:var(--tt-accent)] ring-1 ring-[color:var(--tt-accent)] animate-pulse'
  } else {
    borderClass = 'border-[color:var(--tt-border)]'
  }

  const remaining =
    task && task.serviceStartTime !== undefined
      ? task.serviceStartTime + task.trueServiceDemand - phaseElapsed
      : 0

  return (
    <Panel
      variant="raised"
      className={cx('relative flex min-h-[140px] cursor-pointer flex-col gap-3 p-4 transition-all', borderClass)}
      onClick={onDispatch}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[color:var(--tt-text-muted)]">Worker {core.id + 1}</span>
        {isBusy ? (
          <StatusBadge tone="info">BUSY</StatusBadge>
        ) : (
          <StatusBadge tone="success">IDLE</StatusBadge>
        )}
      </div>

      {!isBusy && (
        <div className="flex flex-1 items-center justify-center">
          <span className={`text-center text-xs ${isFinalStretch ? 'text-[color:var(--tt-danger)]' : 'text-[color:var(--tt-accent)]'}`}>Click to assign</span>
        </div>
      )}

      {isBusy && task !== null && (
        <>
          <div className="flex items-center gap-2">
            <SizeBadge size={task.size} />
            <span className="truncate font-mono text-sm text-[color:var(--tt-text)]">{task.content ?? task.id}</span>
          </div>

          <div className="h-3 w-full border-[2px] border-black bg-white">
            <div
              className="h-full bg-[color:var(--tt-accent)] transition-all duration-100"
              style={{ width: `${core.progress * 100}%` }}
            />
          </div>

          <span className="tt-label">{(remaining / 1000).toFixed(1)}s</span>
        </>
      )}

      <span className="tt-muted mt-auto text-xs">Completed: {core.completedTaskCount}</span>
    </Panel>
  )
}
