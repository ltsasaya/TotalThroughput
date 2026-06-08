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
} from 'recharts'
import { SectionLabel } from '@/components/ui/primitives'

const TOOLTIP_STYLE = {
  background: 'var(--tt-surface-raised)',
  border: '1px solid var(--tt-border)',
  borderRadius: 8,
  color: 'var(--tt-text)',
  fontSize: 11,
}
const GRID_STYLE = { strokeDasharray: '3 3', stroke: 'var(--tt-chart-grid)' }
const AXIS_TICK = { fill: 'var(--tt-text-subtle)', fontSize: 11 }

export interface Phase1Props {
  measuredTasksPerSecond: number
  completedCount: number
  lambdaMax?: number
  arrivalRate?: number
  actualThroughput?: number
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
  return <SectionLabel className="mb-1 normal-case">{children}</SectionLabel>
}

function ChartCaption({ children }: { children: React.ReactNode }) {
  return <div className="tt-muted mt-1 text-xs">{children}</div>
}

export function SaturationChart({ phase1 }: { phase1: Phase1Props }) {
  const lambdaMax = phase1.lambdaMax ?? phase1.measuredTasksPerSecond
  const playerLambda = phase1.arrivalRate ?? 0
  const playerX = phase1.actualThroughput ?? phase1.completedCount / 60

  const points = 60
  const xMax = Math.max(lambdaMax * 1.5, 0.1)
  const curve = Array.from({ length: points }, (_, i) => {
    const lambda = (i / (points - 1)) * xMax
    return { lambda: +lambda.toFixed(3), x: +Math.min(lambda, lambdaMax).toFixed(3) }
  })

  return (
    <div>
      <ChartTitle>Phase 1 - Single-Server Saturation</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={curve} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="lambda"
            type="number"
            domain={[0, xMax]}
            tick={AXIS_TICK}
            label={{ value: 'Arrival rate λ (req/s)', position: 'insideBottom', offset: -12, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
          />
          <YAxis
            tick={AXIS_TICK}
            label={{ value: 'Throughput X', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => v.toFixed(2)} />
          <Line type="monotone" dataKey="x" stroke="var(--tt-accent)" strokeWidth={2} dot={false} name="X (throughput)" />
          <ReferenceLine x={lambdaMax} stroke="var(--tt-warning)" strokeDasharray="4 4" label={{ value: 'λmax = 1/D', fill: 'var(--tt-warning)', fontSize: 10, position: 'top' }} />
          <ReferenceDot
            x={+playerLambda.toFixed(3)}
            y={+playerX.toFixed(3)}
            r={5}
            fill="var(--tt-danger)"
            stroke="var(--tt-text)"
            strokeWidth={1.5}
            label={{ value: 'You', fill: 'var(--tt-danger)', fontSize: 10, position: 'top' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartCaption>
        X = min(λ, λmax) is the simple capacity intuition. The red point uses observed arrival-window λ and active-window completions.
      </ChartCaption>
    </div>
  )
}

export function ExpansionFactorChart({
  avgUtil,
  avgResponseTime,
  avgServiceTime,
  coreCount: _coreCount,
}: {
  avgUtil: number
  avgResponseTime: number
  avgServiceTime: number
  coreCount: number
}) {
  const points = 50
  const curve = Array.from({ length: points }, (_, i) => {
    const rho = i / (points + 1)
    return {
      rho: +rho.toFixed(3),
      expansion: +(1 / (1 - rho)).toFixed(3),
    }
  })

  const playerRD = avgServiceTime > 0 ? +(avgResponseTime / avgServiceTime).toFixed(2) : 1
  const playerRho = +Math.min(avgUtil, 0.97).toFixed(3)

  return (
    <div>
      <ChartTitle>Phase 2 - Per-Worker Response Reference</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={curve} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="rho"
            type="number"
            domain={[0, 1]}
            tick={AXIS_TICK}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            label={{ value: 'Per-worker load rho', position: 'insideBottom', offset: -12, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
          />
          <YAxis
            domain={[1, 10]}
            tick={AXIS_TICK}
            label={{ value: 'R/D', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => v.toFixed(2)} />
          <Line type="monotone" dataKey="expansion" stroke="var(--tt-accent)" strokeWidth={1.5} dot={false} name="1 / (1 - rho)" />
          <ReferenceDot
            x={playerRho}
            y={Math.min(playerRD, 10)}
            r={5}
            fill="var(--tt-danger)"
            stroke="var(--tt-text)"
            strokeWidth={1.5}
            label={{ value: 'You', fill: 'var(--tt-danger)', fontSize: 10, position: 'top' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartCaption>
        R/D ~= 1/(1 - rho) is a simple stable single-server reference curve. It is not an exact M/M/c or finite-run result.
      </ChartCaption>
    </div>
  )
}

function CoreUtilizationChart({ perCoreUtilization, avgUtil }: { perCoreUtilization: number[]; avgUtil: number }) {
  const data = perCoreUtilization.map((u, i) => ({
    core: `W${i + 1}`,
    utilization: +(u * 100).toFixed(1),
  }))

  return (
    <div>
      <ChartTitle>Phase 2 - Per-Worker Utilization</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="core" tick={AXIS_TICK} />
          <YAxis
            domain={[0, 100]}
            tick={AXIS_TICK}
            tickFormatter={v => `${v}%`}
            label={{ value: 'Utilization %', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `${v.toFixed(1)}%`} />
          <Bar dataKey="utilization" fill="var(--tt-accent)" name="Utilization" />
          <ReferenceLine
            y={+(avgUtil * 100).toFixed(1)}
            stroke="var(--tt-warning)"
            strokeDasharray="4 4"
            label={{ value: 'avg', fill: 'var(--tt-warning)', fontSize: 10, position: 'right' }}
          />
        </BarChart>
      </ResponsiveContainer>
      <ChartCaption>Load skew: unequal utilization means some workers are bottlenecks. Balanced dispatch lowers response time.</ChartCaption>
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
      <ChartTitle>Phase 2 - Ideal Server-Pool Capacity</ChartTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis
            dataKey="cores"
            type="number"
            domain={[0, 17]}
            ticks={[1, 2, 4, 8, 16]}
            tick={AXIS_TICK}
            label={{ value: 'Workers c', position: 'insideBottom', offset: -12, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
          />
          <YAxis
            tick={AXIS_TICK}
            label={{ value: 'Peak λmax (req/s)', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--tt-text-subtle)', fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => v.toFixed(2)} />
          <Line type="monotone" dataKey="lambdaMax" stroke="var(--tt-success)" strokeWidth={2} dot={{ r: 3, fill: 'var(--tt-success)' }} name="λmax = c/D" />
          {playerPoint && (
            <ReferenceDot
              x={coreCount}
              y={playerPoint.lambdaMax}
              r={5}
              fill="var(--tt-danger)"
              stroke="var(--tt-text)"
              strokeWidth={1.5}
              label={{ value: `Phase 2 (c=${coreCount})`, fill: 'var(--tt-danger)', fontSize: 10, position: 'top' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <ChartCaption>λmax ~= c/D: doubling ideal workers doubles peak throughput before dispatch and coordination costs.</ChartCaption>
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
