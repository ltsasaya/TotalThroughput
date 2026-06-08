import { useGameStore } from '@/store/gameStore'
import { Panel, SectionLabel, SizeBadge, StatusBadge, cx } from '@/components/ui/primitives'
import type { TaskSize } from '@/types/task'

function waitColor(ms: number): string {
  if (ms < 3000) return 'text-[color:var(--tt-text-subtle)]'
  if (ms < 7000) return 'text-[color:var(--tt-warning)]'
  return 'text-[color:var(--tt-danger)]'
}

function itemClasses(timeLeftMs: number, isNext: boolean): string {
  if (isNext) return 'border border-[color:var(--tt-accent)] bg-[color:var(--tt-accent-soft)]'
  if (timeLeftMs < 5000) return 'border-l-2 border-[color:var(--tt-danger)] bg-[color:var(--tt-danger-soft)]'
  if (timeLeftMs < 12000) return 'border-l-2 border-[color:var(--tt-warning)] bg-[color:var(--tt-warning-soft)]'
  return 'bg-[color:var(--tt-surface-raised)]'
}

interface QueuePanelProps {
  isFinalStretch?: boolean
}

export function QueuePanel({ isFinalStretch }: QueuePanelProps) {
  const queue = useGameStore(s => s.queue)
  const tasks = useGameStore(s => s.tasks)
  const phaseElapsed = useGameStore(s => s.phaseElapsed)
  const config = useGameStore(s => s.config)

  const containerBorder = isFinalStretch ? 'border-[color:var(--tt-danger)] ring-1 ring-[color:var(--tt-danger)]' : ''

  return (
    <Panel className={cx('flex h-full min-w-[200px] max-w-[250px] flex-col p-4', containerBorder)}>
      <div className="mb-3 flex items-center">
        <SectionLabel className={isFinalStretch ? 'text-[color:var(--tt-danger)]' : undefined}>Queue</SectionLabel>
        <StatusBadge className="ml-2">{queue.length}</StatusBadge>
      </div>

      {isFinalStretch && (
        <div className="mb-3 rounded border-l-2 border-[color:var(--tt-danger)] bg-[color:var(--tt-danger-soft)] px-2 py-1.5 text-xs font-semibold text-[color:var(--tt-danger)]">
          No more requests incoming - clear the queue
        </div>
      )}

      <div className="tt-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto">
        {queue.length === 0 && !isFinalStretch && (
          <span className="tt-muted text-sm">No requests waiting</span>
        )}
        {queue.map((id, index) => {
            const task = tasks[id]
            if (!task) return null
            const waitMs = phaseElapsed - task.arrivalTime
            const timeLeft = task.deadline != null ? task.deadline - phaseElapsed : Infinity
            const isNext = index === 0

            return (
              <div
                key={id}
                className={`flex items-center gap-3 rounded-lg p-2.5 ${itemClasses(timeLeft, isNext)}`}
              >
                {isNext && (
                  <StatusBadge tone="info" className="shrink-0">NEXT</StatusBadge>
                )}
                <SizeBadge size={(task.size ?? 'S') as TaskSize} />
                <span className="flex-1 truncate font-mono text-sm text-[color:var(--tt-text)]">
                  {task.content ?? task.id}
                </span>
                <span className={`text-xs ${waitColor(waitMs)}`}>
                  {(waitMs / 1000).toFixed(1)}s
                </span>
                {config.showTrueServiceDemand && (
                  <span className="ml-1 font-mono text-xs text-[color:var(--tt-info)]">
                    {(task.trueServiceDemand / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            )
        })}
      </div>
    </Panel>
  )
}
