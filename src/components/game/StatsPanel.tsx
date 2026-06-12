import { useGameStore } from '@/store/gameStore'
import { MetricItem, Panel, SectionLabel } from '@/components/ui/primitives'

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return <MetricItem label={label} value={value} valueClass={`text-lg ${valueClass ?? ''}`} />
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
    arrivalRate,
    targetPerWorkerLoad,
  } = liveMetrics

  const avgUtil =
    perCoreUtilization.length > 0
      ? perCoreUtilization.reduce((a, b) => a + b, 0) / perCoreUtilization.length
      : 0

  const queueClass =
    queueLength > 10 ? 'text-[color:var(--tt-danger)]' : queueLength > 8 ? 'text-[color:var(--tt-warning)]' : 'text-[color:var(--tt-text)]'

  const waitSec = avgWaitingTime / 1000
  const waitClass = waitSec > 6 ? 'text-[color:var(--tt-danger)]' : waitSec > 3 ? 'text-[color:var(--tt-warning)]' : 'text-[color:var(--tt-text)]'

  return (
    <Panel className="flex w-full flex-col gap-4 p-4 lg:h-full lg:min-w-[180px] lg:max-w-[210px]">
      <div>
        <SectionLabel>Live Stats</SectionLabel>
      </div>

      {phase1Result !== null && (
        <>
          <div className="flex flex-col gap-1">
            <MetricItem
              label="Calib. service"
              value={`${(phase1Result.avgServiceTime / 1000).toFixed(1)}s / request`}
              valueClass="text-base text-[color:var(--tt-text-muted)]"
            />
            <div className="tt-label">{phase1Result.measuredTasksPerSecond.toFixed(2)} req/s</div>
          </div>
          <div className="tt-divider" />
        </>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <MetricItem label="Arrival Rate" value={`${arrivalRate.toFixed(2)} req/s`} valueClass="text-lg" />
          <div className="tt-label text-sm">target load {(targetPerWorkerLoad * 100).toFixed(0)}% / worker</div>
        </div>

        <div>
          <MetricItem label="Throughput" value={`${throughput.toFixed(2)} req/s`} valueClass="text-lg" />
          <div className="tt-label text-sm">{idealThroughput.toFixed(2)} req/s ideal c/D</div>
        </div>

        <div className="tt-divider" />

        <StatRow
          label="Queue"
          value={`${queueLength} req`}
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

      <div className="tt-divider" />

      <div className="flex flex-col gap-3">
        <StatRow
          label="Completed"
          value={String(completedCount)}
          valueClass="text-[color:var(--tt-success)]"
        />

        <StatRow
          label="Dropped"
          value={String(droppedCount)}
          valueClass={droppedCount > 0 ? 'text-[color:var(--tt-danger)]' : 'text-[color:var(--tt-text-subtle)]'}
        />
      </div>
    </Panel>
  )
}
