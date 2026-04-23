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
import type { Task } from '@/types/task'

const TOOLTIP_STYLE = { background: '#1f2937', border: 'none', color: '#fff', fontSize: 11 }
const GRID_STYLE = { strokeDasharray: '3 3', stroke: '#374151' }
const AXIS_TICK = { fill: '#6b7280', fontSize: 11 }
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

  // Cumulative U(T) = totalBusyMs_up_to_T / T — running average utilization
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
      <div className="text-sm font-semibold text-gray-400 mb-1">Phase 1 — Cumulative Worker Utilization</div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 10, right: 40, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="t"
            type="number"
            tick={AXIS_TICK}
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={AXIS_TICK}
            tickFormatter={v => `${v}%`}
            label={{ value: 'U (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number) => [`${v.toFixed(1)}%`, 'Cumulative U']}
          />
          <Line type="monotone" dataKey="U" stroke="#6366f1" strokeWidth={2} dot={false} name="U" />
          <ReferenceLine
            y={finalU}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: `${finalU.toFixed(0)}%`, fill: '#f59e0b', fontSize: 10, position: 'right' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-xs text-gray-600 mt-1">
        U(t) = cumulative busy time / t. D = {D.toFixed(2)}s per task — as arrivals increase, U rises toward 100%.
      </div>
    </div>
  )
}
