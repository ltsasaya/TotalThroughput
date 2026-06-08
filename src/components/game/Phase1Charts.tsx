import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { SectionLabel } from '@/components/ui/primitives'
import type { Task } from '@/types/task'

const TOOLTIP_STYLE = {
  background: 'var(--tt-surface-raised)',
  border: '1px solid var(--tt-border)',
  borderRadius: 8,
  color: 'var(--tt-text)',
  fontSize: 11,
}
const GRID_STYLE = { strokeDasharray: '3 3', stroke: 'var(--tt-chart-grid)' }
const AXIS_TICK = { fill: 'var(--tt-text-subtle)', fontSize: 11 }
const TICK_MS = 5_000

interface Props {
  tasks: Record<string, Task>
  elapsedMs: number
  avgServiceTime: number
}

export function Phase1UtilizationChart({ tasks, elapsedMs, avgServiceTime }: Props) {
  const completed = Object.values(tasks).filter(
    t => t.status === 'completed' && t.serviceStartTime !== undefined && t.completionTime !== undefined,
  )

  // Cumulative U(T) = totalBusyMs_up_to_T / T: running average utilization
  const data: { t: number; U: number }[] = []
  for (let tick = TICK_MS; tick <= elapsedMs + TICK_MS; tick += TICK_MS) {
    const T = Math.min(tick, elapsedMs)
    if (T <= 0) break

    let busyMs = 0
    for (const task of completed) {
      const sStart = task.serviceStartTime!
      if (sStart >= T) continue
      const sEnd = Math.min(task.completionTime!, T)
      if (sEnd > sStart) busyMs += sEnd - sStart
    }

    data.push({ t: +(T / 1000).toFixed(0), U: +(Math.min(busyMs / T, 1) * 100).toFixed(1) })
  }

  const finalU = data.length > 0 ? data[data.length - 1].U : 0
  const D = avgServiceTime / 1000

  return (
    <div>
      <SectionLabel className="mb-1 normal-case">Phase 1 - Cumulative Worker Utilization</SectionLabel>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 10, right: 40, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="t"
            type="number"
            tick={AXIS_TICK}
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -12, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={AXIS_TICK}
            tickFormatter={v => `${v}%`}
            label={{ value: 'U (%)', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number) => [`${v.toFixed(1)}%`, 'Cumulative U']}
          />
          <Line type="monotone" dataKey="U" stroke="var(--tt-accent)" strokeWidth={2} dot={false} name="U" />
          <ReferenceLine
            y={finalU}
            stroke="var(--tt-warning)"
            strokeDasharray="4 4"
            label={{ value: `${finalU.toFixed(0)}%`, fill: 'var(--tt-warning)', fontSize: 10, position: 'right' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="tt-muted mt-1 text-xs">
        U(t) = cumulative busy time / t. D = {D.toFixed(2)}s per request. As arrivals increase, U rises toward 100%.
      </div>
    </div>
  )
}
