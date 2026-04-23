import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  Legend,
} from 'recharts'

const TOOLTIP_STYLE = { background: '#1f2937', border: 'none', color: '#fff', fontSize: 11 }
const GRID_STYLE = { strokeDasharray: '3 3', stroke: '#374151' }
const AXIS_TICK = { fill: '#6b7280', fontSize: 11 }

export interface Phase1Props {
  measuredTasksPerSecond: number
  completedCount: number
  droppedCount: number
}

interface EducationalChartsProps {
  phase1?: Phase1Props
  avgServiceTime: number
  avgResponseTime: number
  actualThroughput: number
  idealThroughput: number
  avgUtil: number
  perCoreUtilization: number[]
}

function ChartTitle({ children }: { children: string }) {
  return <div className="text-sm font-semibold text-gray-400 mb-1">{children}</div>
}

function ChartCaption({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-gray-600 mt-1">{children}</div>
}

export function SaturationChart({ phase1 }: { phase1: Phase1Props }) {
  const lambdaMax = phase1.measuredTasksPerSecond
  const playerLambda = (phase1.completedCount + phase1.droppedCount) / 60
  const playerX = phase1.completedCount / 60

  const points = 60
  const xMax = lambdaMax * 1.5
  const curve = Array.from({ length: points }, (_, i) => {
    const lambda = (i / (points - 1)) * xMax
    return { lambda: +lambda.toFixed(3), x: +Math.min(lambda, lambdaMax).toFixed(3) }
  })

  return (
    <div>
      <ChartTitle>Phase 1 — Saturation: Offered Load vs Throughput</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={curve} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="lambda"
            type="number"
            domain={[0, xMax]}
            tick={AXIS_TICK}
            label={{ value: 'Arrival rate λ (tasks/s)', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            tick={AXIS_TICK}
            label={{ value: 'Throughput X', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => v.toFixed(2)} />
          <Line type="monotone" dataKey="x" stroke="#3b82f6" strokeWidth={2} dot={false} name="X (throughput)" />
          <ReferenceLine x={lambdaMax} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'λmax = 1/D', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
          <ReferenceDot
            x={+playerLambda.toFixed(3)}
            y={+playerX.toFixed(3)}
            r={5}
            fill="#ef4444"
            stroke="#fff"
            strokeWidth={1.5}
            label={{ value: 'You', fill: '#ef4444', fontSize: 10, position: 'top' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartCaption>X = min(λ, λmax). Throughput saturates at λmax = 1/D — above this, tasks queue and drop.</ChartCaption>
    </div>
  )
}

export function ExpansionFactorChart({
  avgUtil,
  avgResponseTime,
  avgServiceTime,
  coreCount,
}: {
  avgUtil: number
  avgResponseTime: number
  avgServiceTime: number
  coreCount: number
}) {
  const points = 50
  const curve = Array.from({ length: points }, (_, i) => {
    const u = i / (points + 1)
    return {
      u: +u.toFixed(3),
      c1: +(1 / (1 - u)).toFixed(3),
      c2: +(1 / (1 - u / 2)).toFixed(3),
      c4: +(1 / (1 - u / 4)).toFixed(3),
    }
  })

  const playerRD = avgServiceTime > 0 ? +(avgResponseTime / avgServiceTime).toFixed(2) : 1
  const playerU = +Math.min(avgUtil, 0.97).toFixed(3)

  return (
    <div>
      <ChartTitle>Phase 2 — Response Time Expansion Factor (M/M/c)</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={curve} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="u"
            type="number"
            domain={[0, 1]}
            tick={AXIS_TICK}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            label={{ value: 'Utilization U', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            domain={[1, 10]}
            tick={AXIS_TICK}
            label={{ value: 'R/D', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => v.toFixed(2)} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          <Line type="monotone" dataKey="c1" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="c = 1" />
          <Line type="monotone" dataKey="c2" stroke="#6366f1" strokeWidth={1.5} dot={false} name="c = 2" />
          <Line type="monotone" dataKey="c4" stroke="#10b981" strokeWidth={1.5} dot={false} name="c = 4" />
          <ReferenceDot
            x={playerU}
            y={Math.min(playerRD, 10)}
            r={5}
            fill="#ef4444"
            stroke="#fff"
            strokeWidth={1.5}
            label={{ value: `You (c=${coreCount})`, fill: '#ef4444', fontSize: 10, position: 'top' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartCaption>R/D = 1/(1 − U/c). More cores shift the curve right, reducing response time at the same utilization.</ChartCaption>
    </div>
  )
}

function CoreUtilizationChart({ perCoreUtilization, avgUtil }: { perCoreUtilization: number[]; avgUtil: number }) {
  const data = perCoreUtilization.map((u, i) => ({
    core: `C${i + 1}`,
    utilization: +(u * 100).toFixed(1),
  }))

  return (
    <div>
      <ChartTitle>Phase 2 — Per-Core Utilization (Load Skew)</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="core" tick={AXIS_TICK} />
          <YAxis
            domain={[0, 100]}
            tick={AXIS_TICK}
            tickFormatter={v => `${v}%`}
            label={{ value: 'Utilization %', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v.toFixed(1)}%`} />
          <Bar dataKey="utilization" fill="#6366f1" name="Utilization" />
          <ReferenceLine
            y={+(avgUtil * 100).toFixed(1)}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: 'avg', fill: '#f59e0b', fontSize: 10, position: 'right' }}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartCaption>Load skew: unequal utilization means some cores are bottlenecks. Balanced dispatch minimizes max R.</ChartCaption>
    </div>
  )
}

function ParallelismChart({ avgServiceTime, coreCount }: { avgServiceTime: number; coreCount: number }) {
  const D = avgServiceTime / 1000
  const data = [1, 2, 4, 8, 16].map(p => ({
    cores: p,
    lambdaMax: +(p / D).toFixed(3),
  }))

  const playerPoint = data.find(d => d.cores === coreCount)

  return (
    <div>
      <ChartTitle>Phase 2 — Parallelism Scaling (X = P/D)</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="cores"
            type="number"
            domain={[0, 17]}
            ticks={[1, 2, 4, 8, 16]}
            tick={AXIS_TICK}
            label={{ value: 'Cores P', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            tick={AXIS_TICK}
            label={{ value: 'Peak λmax (tasks/s)', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => v.toFixed(2)} />
          <Line type="monotone" dataKey="lambdaMax" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="λmax = P/D" />
          {playerPoint && (
            <ReferenceDot
              x={coreCount}
              y={playerPoint.lambdaMax}
              r={5}
              fill="#ef4444"
              stroke="#fff"
              strokeWidth={1.5}
              label={{ value: `Phase 2 (P=${coreCount})`, fill: '#ef4444', fontSize: 10, position: 'top' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <ChartCaption>X = P/D: doubling cores doubles peak throughput. Your Phase 2 run used P = {coreCount} cores.</ChartCaption>
    </div>
  )
}

export function EducationalCharts({
  phase1,
  avgServiceTime,
  avgResponseTime,
  actualThroughput: _actualThroughput,
  idealThroughput: _idealThroughput,
  avgUtil,
  perCoreUtilization,
}: EducationalChartsProps) {
  const coreCount = perCoreUtilization.length

  return (
    <div className="flex flex-col gap-8">
      {phase1 && (
        <SaturationChart phase1={phase1} />
      )}
      <ExpansionFactorChart
        avgUtil={avgUtil}
        avgResponseTime={avgResponseTime}
        avgServiceTime={avgServiceTime}
        coreCount={coreCount}
      />
      {coreCount > 0 && (
        <CoreUtilizationChart
          perCoreUtilization={perCoreUtilization}
          avgUtil={avgUtil}
        />
      )}
      {avgServiceTime > 0 && coreCount > 0 && (
        <ParallelismChart
          avgServiceTime={avgServiceTime}
          coreCount={coreCount}
        />
      )}
    </div>
  )
}
