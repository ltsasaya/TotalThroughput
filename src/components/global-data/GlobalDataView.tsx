import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchGlobalData } from '@/api/client'
import type { GlobalDataPoint } from '@/types/account'
import { RetroHeader } from '@/components/game/RetroHeader'
import { DashboardShell, ErrorText, Field, Panel, SectionLabel } from '@/components/account/DashboardBits'

type GraphKey = 'queue-utilization' | 'response-utilization' | 'utilization-arrival'
type ChartDomain = [number, number | 'auto']
type WpmSource = 'calibration' | 'observed'
type ChartPoint = GlobalDataPoint & { x: number; y: number }

const UTILIZATION_DOMAIN: ChartDomain = [0, 100]
const ZERO_MIN_DOMAIN: ChartDomain = [0, 'auto']
const OBSERVED_ARRIVAL_AXIS_MAX = 0.4
const WPM_SOURCE_OPTIONS: Array<{ key: WpmSource; label: string }> = [
  { key: 'calibration', label: 'Calibration WPM' },
  { key: 'observed', label: 'In-Game WPM' },
]

const GRAPH_OPTIONS: Array<{
  key: GraphKey
  label: string
  x: string
  y: string
  xDomain?: ChartDomain
  yDomain?: ChartDomain
}> = [
  {
    key: 'queue-utilization',
    label: 'Queue Length x U',
    x: 'Utilization (U)',
    y: 'Queue Length (N)',
    xDomain: UTILIZATION_DOMAIN,
    yDomain: ZERO_MIN_DOMAIN,
  },
  { key: 'response-utilization', label: 'Response Time x U', x: 'Utilization (U)', y: 'Response Time (R)', xDomain: UTILIZATION_DOMAIN },
  {
    key: 'utilization-arrival',
    label: 'Utilization x Arrival Rate',
    x: 'Observed Arrival Rate',
    y: 'Utilization (U)',
    xDomain: ZERO_MIN_DOMAIN,
    yDomain: UTILIZATION_DOMAIN,
  },
]

function colorForWpm(wpm: number): string {
  const stops = [
    { wpm: 30, color: [162, 232, 125] },
    { wpm: 75, color: [234, 221, 82] },
    { wpm: 120, color: [230, 132, 48] },
    { wpm: 160, color: [177, 26, 26] },
    { wpm: 200, color: [36, 0, 0] },
  ]
  const clamped = Math.max(30, Math.min(200, wpm))
  const upperIndex = stops.findIndex(stop => stop.wpm >= clamped)
  const upper = stops[Math.max(upperIndex, 1)]
  const lower = stops[Math.max(0, upperIndex - 1)]
  const span = upper.wpm - lower.wpm || 1
  const t = (clamped - lower.wpm) / span
  const mix = lower.color.map((value, index) => Math.round(value + (upper.color[index] - value) * t))
  return `rgb(${mix[0]} ${mix[1]} ${mix[2]})`
}

function chartPoint(point: GlobalDataPoint, graph: GraphKey): ChartPoint {
  if (graph === 'queue-utilization') {
    return { ...point, x: point.utilizationPercent, y: point.averageQueueLength }
  }
  if (graph === 'response-utilization') {
    return { ...point, x: point.utilizationPercent, y: point.averageResponseTime / 1000 }
  }
  return { ...point, x: point.observedArrivalRate, y: point.utilizationPercent }
}

function colorWpm(point: GlobalDataPoint, source: WpmSource): number {
  return source === 'observed' ? point.observedTypingWpm : point.calibrationWpm
}

function pointFill(point: GlobalDataPoint, source: WpmSource): string {
  const wpm = colorWpm(point, source)
  return wpm > 0 ? colorForWpm(wpm) : '#d9d9d9'
}

function formatWpm(value: number): string {
  return value > 0 ? `${Math.round(value)} WPM` : '-'
}

function formatPointValue(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '-'
}

function GlobalDataTooltip({
  active,
  payload,
  graphLabel,
  xLabel,
  yLabel,
}: {
  active?: boolean
  payload?: Array<{ payload?: ChartPoint }>
  graphLabel: string
  xLabel: string
  yLabel: string
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="border-[2px] border-black bg-white px-3 py-2 font-mono text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-1 font-bold">{graphLabel}</div>
      <div>{xLabel}: {formatPointValue(point.x)}</div>
      <div>{yLabel}: {formatPointValue(point.y)}</div>
      <div>Calibration WPM: {formatWpm(point.calibrationWpm)}</div>
      <div>In-Game WPM: {formatWpm(point.observedTypingWpm)}</div>
      <div>Throughput/sec: {formatPointValue(point.throughputPerSecond)}</div>
      <div>Completed: {point.completedCount}</div>
    </div>
  )
}

export function GlobalDataView() {
  const [graph, setGraph] = useState<GraphKey>('queue-utilization')
  const [wpmSource, setWpmSource] = useState<WpmSource>('calibration')
  const [wpmMin, setWpmMin] = useState('30')
  const [wpmMax, setWpmMax] = useState('200')
  const [points, setPoints] = useState<GlobalDataPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const min = Number(wpmMin)
    const max = Number(wpmMax)
    if (!Number.isFinite(min) || !Number.isFinite(max)) return
    fetchGlobalData(min, max)
      .then(setPoints)
      .catch(fetchError => setError(fetchError instanceof Error ? fetchError.message : 'Global data failed to load.'))
  }, [wpmMax, wpmMin])

  const chartData = useMemo(() => points.map(point => chartPoint(point, graph)), [graph, points])
  const activeGraph = GRAPH_OPTIONS.find(option => option.key === graph) ?? GRAPH_OPTIONS[0]
  const activeXDomain = useMemo<ChartDomain | undefined>(() => {
    if (graph !== 'utilization-arrival') return activeGraph.xDomain
    const observedMax = chartData.reduce((max, point) => Math.max(max, Number.isFinite(point.x) ? point.x : 0), 0)
    return [0, Math.max(OBSERVED_ARRIVAL_AXIS_MAX, observedMax)]
  }, [activeGraph.xDomain, chartData, graph])

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader />
      <DashboardShell label="Global Data">
        <ErrorText>{error}</ErrorText>
        <div className="flex flex-wrap gap-2 border-[3px] border-black bg-white p-2">
          {GRAPH_OPTIONS.map(option => (
            <button
              key={option.key}
              type="button"
              className={`border-[2px] border-black px-3 py-2 text-sm font-bold ${graph === option.key ? 'bg-black text-white' : 'bg-white'}`}
              onClick={() => setGraph(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid min-h-[32rem] gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="grid min-w-0 content-start gap-3 border-[3px] border-black bg-white p-4">
            <SectionLabel>Filters</SectionLabel>
            <div className="grid gap-2">
              {WPM_SOURCE_OPTIONS.map(option => (
                <button
                  key={option.key}
                  type="button"
                  className={`border-[2px] border-black px-3 py-2 text-left text-xs font-bold ${wpmSource === option.key ? 'bg-black text-white' : 'bg-white'}`}
                  onClick={() => setWpmSource(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Field label="WPM Min" value={wpmMin} onChange={setWpmMin} type="number" />
            <Field label="WPM Max" value={wpmMax} onChange={setWpmMax} type="number" />
          </aside>

          <Panel className="min-h-[32rem] p-3">
            <div className="h-[30rem] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 12 }}>
                    <CartesianGrid stroke="var(--tt-chart-grid)" />
                    <XAxis
                      dataKey="x"
                      name={activeGraph.x}
                      type="number"
                      domain={activeXDomain}
                      allowDataOverflow={Boolean(activeXDomain)}
                      tick={{ fontSize: 11, fill: '#000' }}
                      label={{ value: activeGraph.x, position: 'insideBottom', offset: -12 }}
                    />
                    <YAxis
                      dataKey="y"
                      name={activeGraph.y}
                      type="number"
                      domain={activeGraph.yDomain}
                      allowDataOverflow={Boolean(activeGraph.yDomain)}
                      tick={{ fontSize: 11, fill: '#000' }}
                      label={{ value: activeGraph.y, angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      content={(
                        <GlobalDataTooltip
                          graphLabel={activeGraph.label}
                          xLabel={activeGraph.x}
                          yLabel={activeGraph.y}
                        />
                      )}
                      cursor={{ strokeDasharray: '3 3' }}
                    />
                    <Scatter data={chartData}>
                      {chartData.map(point => (
                        <Cell key={point.id} fill={pointFill(point, wpmSource)} stroke="#000" strokeWidth={1} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center border-[2px] border-black bg-white px-4 text-center text-sm font-bold text-[color:var(--tt-text-subtle)]">
                  No completed run data in this WPM range yet.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </DashboardShell>
    </div>
  )
}
