import type { ReactNode } from 'react'
import { MetricItem as SharedMetricItem, SectionLabel as SharedSectionLabel } from '@/components/ui/primitives'

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-3">
      <SharedSectionLabel className="mb-2">{children}</SharedSectionLabel>
      <div className="tt-divider" />
    </div>
  )
}

function MetricRow({ left, right }: { left: ReactNode; right?: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 py-1">
      <div>{left}</div>
      {right !== undefined && <div>{right}</div>}
    </div>
  )
}

function MetricItem({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return <SharedMetricItem label={label} value={value} valueClass={`text-base ${valueClass ?? ''}`} />
}

function coreBarColor(util: number): string {
  if (util >= 0.85) return 'bg-[color:var(--tt-warning)]'
  if (util < 0.35) return 'bg-[color:var(--tt-surface-muted)]'
  return 'bg-[color:var(--tt-accent)]'
}

function tpRatioColor(ratio: number): string {
  if (ratio >= 0.80) return 'text-[color:var(--tt-success)]'
  if (ratio >= 0.65) return 'text-[color:var(--tt-warning)]'
  return 'text-[color:var(--tt-danger)]'
}

interface MetricSectionsProps {
  arrivalRate: number
  arrivalCount: number
  expectedArrivals: number
  targetPerWorkerLoad: number
  unfinishedAtEndCount: number
  completedTasks: number
  droppedTasks: number
  actualThroughput: number
  idealThroughput: number
  tpRatio: number
  avgWaitingTime: number
  maxWaitingTime: number
  avgServiceTime: number
  avgResponseTime: number
  maxResponseTime: number
  waitResponseRatio: number
  perCoreUtilization: number[]
  avgUtil: number
}

export function MetricSections({
  arrivalRate,
  arrivalCount,
  expectedArrivals,
  targetPerWorkerLoad,
  unfinishedAtEndCount,
  completedTasks,
  droppedTasks,
  actualThroughput,
  idealThroughput,
  tpRatio,
  avgWaitingTime,
  maxWaitingTime,
  avgServiceTime,
  avgResponseTime,
  maxResponseTime,
  waitResponseRatio,
  perCoreUtilization,
  avgUtil,
}: MetricSectionsProps) {
  return (
    <div className="flex flex-col gap-6 mb-6">

      <div>
        <SectionLabel>Summary</SectionLabel>
        <MetricRow
          left={<MetricItem label="Configured Arrival Rate" value={`${arrivalRate.toFixed(2)}/s`} />}
          right={<MetricItem label="Target Load / Worker" value={`${(targetPerWorkerLoad * 100).toFixed(0)}%`} />}
        />
        <MetricRow
          left={<MetricItem label="Arrivals Sampled" value={`${arrivalCount} / ${expectedArrivals} expected`} />}
          right={<MetricItem label="Still Waiting At End" value={String(unfinishedAtEndCount)} valueClass={unfinishedAtEndCount > 0 ? 'text-[color:var(--tt-warning)]' : 'text-[color:var(--tt-text)]'} />}
        />
        <MetricRow
          left={<MetricItem label="Requests Completed" value={String(completedTasks)} />}
          right={<MetricItem label="Dropped / Unfinished" value={String(droppedTasks)} valueClass={droppedTasks > 0 ? 'text-[color:var(--tt-danger)]' : 'text-[color:var(--tt-text)]'} />}
        />
        <MetricRow
          left={<MetricItem label="Average Throughput" value={`${actualThroughput.toFixed(2)}/s`} />}
          right={<MetricItem label="Max Possible Throughput" value={`${idealThroughput.toFixed(2)}/s`} />}
        />
        <div className="py-1">
          <MetricItem
            label="Throughput Ratio"
            value={`${(tpRatio * 100).toFixed(1)}%`}
            valueClass={tpRatioColor(tpRatio)}
          />
        </div>
      </div>

      <div>
        <SectionLabel>Latency</SectionLabel>
        <MetricRow
          left={<MetricItem label="Avg Waiting Time" value={`${(avgWaitingTime / 1000).toFixed(1)}s`} />}
          right={<MetricItem label="Max Waiting Time" value={`${(maxWaitingTime / 1000).toFixed(1)}s`} />}
        />
        <MetricRow
          left={<MetricItem label="Avg Service Time" value={`${(avgServiceTime / 1000).toFixed(1)}s`} />}
          right={<MetricItem label="Max Response Time" value={`${(maxResponseTime / 1000).toFixed(1)}s`} />}
        />
        <MetricRow
          left={<MetricItem label="Avg Response Time" value={`${(avgResponseTime / 1000).toFixed(1)}s`} />}
          right={<MetricItem label="Wait / Response" value={`${(waitResponseRatio * 100).toFixed(1)}%`} />}
        />
      </div>

      {perCoreUtilization.length > 0 && (
        <div>
          <SectionLabel>Worker Utilization</SectionLabel>
          <div className="flex flex-col gap-2">
            {perCoreUtilization.map((util, i) => {
              const clamped = Math.min(Math.max(util, 0), 1)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-xs text-[color:var(--tt-text-muted)]">W{i + 1}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-[color:var(--tt-surface-muted)]">
                    <div
                      className={`h-full rounded-full ${coreBarColor(clamped)}`}
                      style={{ width: `${clamped * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs text-[color:var(--tt-text-muted)]">
                    {(clamped * 100).toFixed(0)}%
                  </span>
                </div>
              )
            })}
            <div className="tt-label mt-1">
              Avg Worker Utilization: <span className="text-[color:var(--tt-text-muted)]">{(avgUtil * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
