import { useRef, useState } from 'react'
import {
  CartesianGrid,
  Customized,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ServerLabRun } from '@/simulation/serverLab'
import { createNiceTicks, formatTickLabel } from '@/simulation/chartTicks'
import type { SimulationSeriesKey } from '@/store/simulationLabStore'

export interface SimulationAxisSettings {
  xMin: string
  xMax: string
  yMin: string
  yMax: string
  xTicks: string
  yTicks: string
}

interface SimulationChartProps {
  run: ServerLabRun
  activeSeries: Record<SimulationSeriesKey, boolean>
  axisSettings: SimulationAxisSettings
}

interface CustomTooltipProps {
  active?: boolean
  hoverPoint: NearestHoverPoint | null
}

interface ChartMouseState {
  chartX?: number
  chartY?: number
  isTooltipActive?: boolean
}

interface RenderedLinePoint {
  payload?: Record<string, number | null>
  value?: number | null
  x?: number | null
  y?: number | null
}

interface RenderedLineItem {
  item?: {
    props?: {
      dataKey?: string
    }
  }
  props?: {
    dataKey?: string
    points?: RenderedLinePoint[]
  }
}

interface ChartStateCaptureProps {
  formattedGraphicalItems?: RenderedLineItem[]
  onItemsChange: (items: RenderedLineItem[]) => void
}

interface ActiveHoverDotProps {
  hoverPoint: NearestHoverPoint | null
}

export interface NearestHoverPoint {
  key: SimulationSeriesKey
  stroke: string
  time: number
  value: number
  x: number
  y: number
}

const SERIES: Array<{
  key: SimulationSeriesKey
  label: string
  shortLabel: string
  stroke: string
}> = [
  { key: 'systemCount', label: 'Queue Length', shortLabel: 'N', stroke: '#1a1a1a' },
  { key: 'responseTime', label: 'Response Time', shortLabel: 'R', stroke: '#6b7280' },
  { key: 'utilization', label: 'Utilization', shortLabel: 'U', stroke: '#374151' },
  { key: 'arrivalRate', label: 'Arrival Rate', shortLabel: 'λ', stroke: '#9ca3af' },
]

function parseAxisNumber(value: string): number | undefined {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseTickCount(value: string): number | undefined {
  const parsed = Math.round(Number.parseFloat(value))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function formatValue(key: string, value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-'
  const suffix = key === 'responseTime' ? 's' : ''
  return `${value.toFixed(3)}${suffix}`
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function getRenderedItemSeriesKey(item: RenderedLineItem): SimulationSeriesKey | null {
  const dataKey = item.props?.dataKey ?? item.item?.props?.dataKey
  return SERIES.some(series => series.key === dataKey) ? dataKey as SimulationSeriesKey : null
}

export function getNearestHoverPoint(
  items: RenderedLineItem[],
  activeSeries: Record<SimulationSeriesKey, boolean>,
  chartX: number,
  chartY: number,
): NearestHoverPoint | null {
  let nearest: { point: NearestHoverPoint, distance: number } | null = null

  for (const item of items) {
    const key = getRenderedItemSeriesKey(item)
    if (!key || !activeSeries[key]) continue

    const series = SERIES.find(entry => entry.key === key)
    if (!series) continue

    for (const point of item.props?.points ?? []) {
      if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) continue

      const value = isFiniteNumber(point.value) ? point.value : point.payload?.[key]
      const time = point.payload?.time
      if (!isFiniteNumber(value) || !isFiniteNumber(time)) continue

      const distance = Math.hypot(point.x - chartX, point.y - chartY)
      if (!nearest || distance < nearest.distance) {
        nearest = {
          point: {
            key,
            stroke: series.stroke,
            time,
            value,
            x: point.x,
            y: point.y,
          },
          distance,
        }
      }
    }
  }

  return nearest?.point ?? null
}

function ChartStateCapture({ formattedGraphicalItems, onItemsChange }: ChartStateCaptureProps) {
  onItemsChange(formattedGraphicalItems ?? [])
  return null
}

function ActiveHoverDot({ hoverPoint }: ActiveHoverDotProps) {
  if (!hoverPoint) return null

  return (
    <circle
      className="simulation-chart-active-dot"
      cx={hoverPoint.x}
      cy={hoverPoint.y}
      r={4}
      fill="#fff"
      stroke={hoverPoint.stroke}
      strokeWidth={2}
    />
  )
}

function CustomTooltip({ active, hoverPoint }: CustomTooltipProps) {
  if (!active || !hoverPoint) return null

  const series = SERIES.find(item => item.key === hoverPoint.key)
  if (!series) return null

  return (
    <div className="border-[2px] border-black bg-white px-3 py-1.5 font-mono text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <span style={{ color: hoverPoint.stroke }} className="font-bold">{series.label}</span>
      <span className="mx-1 text-gray-500">—</span>
      <span>t: {hoverPoint.time.toFixed(1)}, {series.shortLabel}: {formatValue(series.key, hoverPoint.value)}</span>
    </div>
  )
}

export function SimulationChart({ run, activeSeries, axisSettings }: SimulationChartProps) {
  const renderedItemsRef = useRef<RenderedLineItem[]>([])
  const [hoverPoint, setHoverPoint] = useState<NearestHoverPoint | null>(null)
  const data = run.samples.map(sample => ({
    time: Number(sample.time.toFixed(2)),
    systemCount: Number(sample.systemCount.toFixed(3)),
    responseTime: sample.responseTime === null ? null : Number(sample.responseTime.toFixed(3)),
    utilization: Number(sample.utilization.toFixed(3)),
    arrivalRate: Number(sample.arrivalRate.toFixed(3)),
  }))

  const xMin = parseAxisNumber(axisSettings.xMin)
  const xMax = parseAxisNumber(axisSettings.xMax)
  const yMin = parseAxisNumber(axisSettings.yMin)
  const yMax = parseAxisNumber(axisSettings.yMax)
  const xTickCount = parseTickCount(axisSettings.xTicks)
  const yTickCount = parseTickCount(axisSettings.yTicks)

  const xDomain: [number, number] = [
    xMin ?? 0,
    xMax ?? run.inputs.durationSeconds,
  ]
  const yDomain: [number | 'auto', number | 'auto'] = [
    yMin ?? 0,
    yMax ?? 'auto',
  ]
  const xTicks = createNiceTicks(xDomain[0], xDomain[1], xTickCount)

  const handleMouseMove = (state: ChartMouseState) => {
    if (!state.isTooltipActive || !isFiniteNumber(state.chartX) || !isFiniteNumber(state.chartY)) {
      setHoverPoint(null)
      return
    }

    setHoverPoint(getNearestHoverPoint(
      renderedItemsRef.current,
      activeSeries,
      state.chartX,
      state.chartY,
    ))
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 4, right: 48, left: 0, bottom: 12 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPoint(null)}
      >
        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" strokeWidth={1} />
        <XAxis
          dataKey="time"
          type="number"
          domain={xDomain}
          ticks={xTicks}
          tickFormatter={formatTickLabel}
          label={{
            value: 't',
            position: 'insideBottomRight',
            offset: -4,
            fontSize: 11,
            fontFamily: 'monospace',
          }}
          tick={{ fontSize: 11, fontFamily: 'monospace' }}
          stroke="#000"
          tickLine={{ stroke: '#000' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={yDomain}
          tickCount={yTickCount}
          tick={{ fontSize: 10, fontFamily: 'monospace' }}
          stroke="#000"
          tickLine={{ stroke: '#000' }}
          width={42}
        />
        <Tooltip
          isAnimationActive={false}
          animationDuration={0}
          content={<CustomTooltip hoverPoint={hoverPoint} />}
          cursor={{ stroke: '#000', strokeWidth: 1, strokeDasharray: '4 2' }}
          wrapperStyle={{ transition: 'none' }}
        />
        {SERIES.map(series => activeSeries[series.key] && (
          <Line
            key={series.key}
            type="monotone"
            dataKey={series.key}
            stroke={series.stroke}
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        ))}
        <Customized
          component={(
            <ChartStateCapture
              onItemsChange={(items) => {
                renderedItemsRef.current = items
              }}
            />
          )}
        />
        <Customized component={<ActiveHoverDot hoverPoint={hoverPoint} />} />
      </LineChart>
    </ResponsiveContainer>
  )
}
