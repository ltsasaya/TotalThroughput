import { useGameStore } from '@/store/gameStore'

const SIZE_BADGE: Record<string, string> = {
  S: 'bg-green-900 text-green-300 text-xs font-bold px-2 py-0.5 rounded',
  M: 'bg-yellow-900 text-yellow-300 text-xs font-bold px-2 py-0.5 rounded',
  L: 'bg-red-900 text-red-300 text-xs font-bold px-2 py-0.5 rounded',
}

function waitColor(ms: number): string {
  if (ms < 3000) return 'text-gray-500'
  if (ms < 7000) return 'text-amber-400'
  return 'text-red-400'
}

function itemClasses(timeLeftMs: number, isNext: boolean): string {
  if (isNext) return 'bg-blue-950 border border-blue-500'
  if (timeLeftMs < 5000) return 'bg-red-950 border-l-2 border-red-500'
  if (timeLeftMs < 12000) return 'bg-amber-950 border-l-2 border-amber-500'
  return 'bg-gray-800'
}

interface QueuePanelProps {
  isFinalStretch?: boolean
}

export function QueuePanel({ isFinalStretch }: QueuePanelProps) {
  const queue = useGameStore(s => s.queue)
  const tasks = useGameStore(s => s.tasks)
  const phaseElapsed = useGameStore(s => s.phaseElapsed)
  const config = useGameStore(s => s.config)

  const containerBorder = isFinalStretch
    ? 'border border-red-500/60 ring-1 ring-red-500/30'
    : ''

  return (
    <div className={`bg-gray-900 rounded-xl p-4 flex flex-col h-full min-w-[200px] max-w-[240px] ${containerBorder}`}>
      <div className="flex items-center mb-3">
        <span className={`text-sm font-semibold uppercase tracking-wider ${isFinalStretch ? 'text-red-400' : 'text-gray-400'}`}>Queue</span>
        <span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full ml-2">
          {queue.length}
        </span>
      </div>

      {isFinalStretch && (
        <div className="mb-3 px-2 py-1.5 bg-red-950/60 border-l-2 border-red-500 rounded text-xs text-red-300 font-semibold">
          No more tasks incoming — clear the queue
        </div>
      )}

      <div className="overflow-y-auto flex-1 flex flex-col gap-2">
        {queue.length === 0 && !isFinalStretch && (
          <span className="text-gray-600 text-sm">No tasks waiting</span>
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
                className={`flex items-center gap-3 p-2.5 rounded-lg ${itemClasses(timeLeft, isNext)}`}
              >
                {isNext && (
                  <span className="text-blue-400 text-xs font-bold shrink-0">NEXT</span>
                )}
                <span className={SIZE_BADGE[task.size] ?? SIZE_BADGE.S}>{task.size}</span>
                <span className="text-sm text-white font-mono flex-1 truncate">
                  {task.content ?? task.id}
                </span>
                <span className={`text-xs ${waitColor(waitMs)}`}>
                  {(waitMs / 1000).toFixed(1)}s
                </span>
                {config.showTrueServiceDemand && (
                  <span className="text-xs text-purple-400 font-mono ml-1">
                    {(task.trueServiceDemand / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            )
        })}
      </div>
    </div>
  )
}
