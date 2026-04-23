import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface PostRunChartsProps {
  throughputHistory: { time: number; value: number }[]
  queueLengthHistory: { time: number; value: number }[]
}

const TOOLTIP_STYLE = { background: '#1f2937', border: 'none', color: '#fff' }
const GRID_STYLE = { strokeDasharray: '3 3', stroke: '#374151' }

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
        <div className="text-sm font-semibold text-gray-400 mb-2">Throughput Over Time</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={tpData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="t"
              ticks={xTicks}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -4, fill: '#6b7280', fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              label={{ value: 'tasks/s', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-400 mb-2">Queue Length Over Time</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={qlData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="t"
              ticks={xTicks}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -4, fill: '#6b7280', fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              label={{ value: 'Queue Length', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
