import type { ReactNode } from 'react'

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{children}</div>
      <div className="border-t border-gray-800" />
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
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-base font-bold ${valueClass ?? 'text-white'}`}>{value}</div>
    </div>
  )
}

function coreBarColor(util: number): string {
  if (util >= 0.85) return 'bg-amber-500'
  if (util < 0.35) return 'bg-gray-500'
  return 'bg-blue-500'
}

function tpRatioColor(ratio: number): string {
  if (ratio >= 0.80) return 'text-green-400'
  if (ratio >= 0.65) return 'text-yellow-400'
  return 'text-red-400'
}

interface MetricSectionsProps {
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
          left={<MetricItem label="Tasks Completed" value={String(completedTasks)} />}
          right={<MetricItem label="Dropped / Expired" value={String(droppedTasks)} valueClass={droppedTasks > 0 ? 'text-red-400' : 'text-white'} />}
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
          <SectionLabel>Core Utilization</SectionLabel>
          <div className="flex flex-col gap-2">
            {perCoreUtilization.map((util, i) => {
              const clamped = Math.min(Math.max(util, 0), 1)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-12 shrink-0">Core {i + 1}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${coreBarColor(clamped)}`}
                      style={{ width: `${clamped * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 w-10 text-right shrink-0">
                    {(clamped * 100).toFixed(0)}%
                  </span>
                </div>
              )
            })}
            <div className="text-xs text-gray-500 mt-1">
              Aggregate Utilization: <span className="text-gray-300">{(avgUtil * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
