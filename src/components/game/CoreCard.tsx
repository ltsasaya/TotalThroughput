import { useGameStore } from '@/store/gameStore'
import type { Core } from '@/types/core'
import type { Task } from '@/types/task'

const SIZE_BADGE: Record<string, string> = {
  S: 'bg-green-900 text-green-300 text-xs font-bold px-2 py-0.5 rounded',
  M: 'bg-yellow-900 text-yellow-300 text-xs font-bold px-2 py-0.5 rounded',
  L: 'bg-red-900 text-red-300 text-xs font-bold px-2 py-0.5 rounded',
}

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
    borderClass = 'border-red-400 ring-2 ring-red-400 animate-pulse'
  } else if (justDispatched) {
    borderClass = 'border-green-400 ring-2 ring-green-400'
  } else if (!isBusy) {
    borderClass = isFinalStretch
      ? 'border-red-500 ring-1 ring-red-500 hover:border-red-400 animate-pulse'
      : 'border-blue-500 ring-1 ring-blue-500 hover:border-blue-400 animate-pulse'
  } else {
    borderClass = 'border-slate-600'
  }

  const remaining =
    task && task.serviceStartTime !== undefined
      ? task.serviceStartTime + task.trueServiceDemand - phaseElapsed
      : 0

  return (
    <div
      className={`relative bg-gray-800 rounded-xl p-4 flex flex-col gap-3 border transition-all cursor-pointer min-h-[140px] ${borderClass}`}
      onClick={onDispatch}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-300">Core {core.id + 1}</span>
        {isBusy ? (
          <span className="bg-blue-900 text-blue-300 text-xs font-bold px-2 py-0.5 rounded">BUSY</span>
        ) : (
          <span className="bg-emerald-900 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded">IDLE</span>
        )}
      </div>

      {!isBusy && (
        <div className="flex-1 flex items-center justify-center">
          <span className={`text-xs text-center ${isFinalStretch ? 'text-red-400' : 'text-blue-400'}`}>Click to assign</span>
        </div>
      )}

      {isBusy && task !== null && (
        <>
          <div className="flex items-center gap-2">
            <span className={SIZE_BADGE[task.size] ?? SIZE_BADGE.S}>{task.size}</span>
            <span className="text-sm text-white font-mono truncate">{task.content ?? task.id}</span>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${core.progress * 100}%` }}
            />
          </div>

          <span className="text-xs text-gray-500">{(remaining / 1000).toFixed(1)}s</span>
        </>
      )}

      <span className="text-xs text-gray-600 mt-auto">Completed: {core.completedTaskCount}</span>
    </div>
  )
}
