import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { SectionLabel } from '@/components/ui/primitives'

interface PostRunChartsProps {
  throughputHistory: { time: number; value: number }[]
  queueLengthHistory: { time: number; value: number }[]
}

const TOOLTIP_STYLE = {
  background: 'var(--tt-surface-raised)',
  border: '3px solid var(--tt-border)',
  borderRadius: 4,
  color: 'var(--tt-text)',
}
const GRID_STYLE = { strokeDasharray: '4 4', stroke: 'var(--tt-chart-grid)' }
const AXIS_TICK = { fill: 'var(--tt-text-subtle)', fontSize: 11 }

export function PostRunCharts({ throughputHistory, queueLengthHistory }: PostRunChartsProps) {
  const tpData = throughputHistory.map(p => ({
    t: +(p.time / 1000).toFixed(1),
    v: +p.value.toFixed(2),
  }))

  const qlData = queueLengthHistory.map(p => ({
    t: +(p.time / 1000).toFixed(1),
    v: +p.value.toFixed(2),
  }))

  const maxTime = Math.max(...tpData.map(p => p.t), ...qlData.map(p => p.t), 0)
  const xTicks = Array.from(
    { length: Math.floor(maxTime / 10) + 1 },
    (_, i) => i * 10,
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionLabel className="mb-2 normal-case">Throughput Over Time</SectionLabel>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={tpData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="t"
              ticks={xTicks}
              tick={AXIS_TICK}
              label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -4, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
            />
            <YAxis
              tick={AXIS_TICK}
              label={{ value: 'req/s', angle: -90, position: 'insideLeft', fill: 'var(--tt-text-subtle)', fontSize: 11 }}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="v" stroke="var(--tt-accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <SectionLabel className="mb-2 normal-case">Queue Length Over Time</SectionLabel>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={qlData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="t"
              ticks={xTicks}
              tick={AXIS_TICK}
              label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -4, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
            />
            <YAxis
              tick={AXIS_TICK}
              label={{ value: 'Queue Length', angle: -90, position: 'insideLeft', fill: 'var(--tt-text-subtle)', fontSize: 11 }}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="v" stroke="var(--tt-warning)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
