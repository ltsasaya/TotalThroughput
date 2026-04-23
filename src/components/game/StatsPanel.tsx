import { useGameStore } from '@/store/gameStore'

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold ${valueClass ?? 'text-white'}`}>{value}</div>
    </div>
  )
}

export function StatsPanel() {
  const liveMetrics = useGameStore(s => s.liveMetrics)
  const phase1Result = useGameStore(s => s.phase1Result)

  const {
    throughput,
    idealThroughput,
    queueLength,
    perCoreUtilization,
    avgWaitingTime,
    completedCount,
    droppedCount,
  } = liveMetrics

  const avgUtil =
    perCoreUtilization.length > 0
      ? perCoreUtilization.reduce((a, b) => a + b, 0) / perCoreUtilization.length
      : 0

  const queueClass =
    queueLength > 10 ? 'text-red-400' : queueLength > 8 ? 'text-amber-400' : 'text-white'

  const waitSec = avgWaitingTime / 1000
  const waitClass = waitSec > 6 ? 'text-red-400' : waitSec > 3 ? 'text-amber-400' : 'text-white'

  return (
    <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-4 min-w-[180px] max-w-[200px] h-full">
      <div>
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Live Stats
        </div>
      </div>

      {phase1Result !== null && (
        <>
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-500">Calib. service</div>
            <div className="text-base font-bold text-gray-300">
              {(phase1Result.avgServiceTime / 1000).toFixed(1)}s / task
            </div>
            <div className="text-xs text-gray-500">
              {phase1Result.measuredTasksPerSecond.toFixed(2)} tasks/s
            </div>
          </div>
          <div className="border-t border-gray-800" />
        </>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <div className="text-xs text-gray-500">Throughput</div>
          <div className="text-lg font-bold text-white">{throughput.toFixed(2)} tasks/s</div>
          <div className="text-sm text-gray-500">{idealThroughput.toFixed(2)} tasks/s ideal</div>
        </div>

        <div className="border-t border-gray-800" />

        <StatRow
          label="Queue"
          value={`${queueLength} tasks`}
          valueClass={queueClass}
        />

        <StatRow
          label="Avg Utilization"
          value={`${(avgUtil * 100).toFixed(0)}%`}
        />

        <StatRow
          label="Avg Wait"
          value={`${waitSec.toFixed(1)}s`}
          valueClass={waitClass}
        />
      </div>

      <div className="border-t border-gray-800" />

      <div className="flex flex-col gap-3">
        <StatRow
          label="Completed"
          value={String(completedCount)}
          valueClass="text-green-400"
        />

        <StatRow
          label="Dropped"
          value={String(droppedCount)}
          valueClass={droppedCount > 0 ? 'text-red-400' : 'text-gray-500'}
        />
      </div>
    </div>
  )
}
