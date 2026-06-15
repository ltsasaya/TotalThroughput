import { useEffect, useMemo, useState } from 'react'
import { SERVER_LAB_LIMITS } from '@/simulation/serverLab'
import { estimateServerLabExperiment } from '@/simulation/serverLabExperiment'
import {
  type SimulationLabEditableInput,
  type SimulationSeriesKey,
  useSimulationLabStore,
} from '@/store/simulationLabStore'
import { cx } from '@/components/ui/primitives'
import { recordSimulationActivityIfSignedIn } from '@/api/client'
import { RetroHeader } from './RetroHeader'
import { SimulationChart, type SimulationAxisSettings } from './SimulationChart'
import { AxisInput, ParamInput } from './SimulationInputs'
import { SimulationSweepPanel } from './SimulationSweepPanel'

const SERIES_META: Array<{
  key: SimulationSeriesKey
  label: string
  color: string
}> = [
  { key: 'systemCount', label: 'Requests in System (N)', color: '#1a1a1a' },
  { key: 'responseTime', label: 'Response Time (R)', color: '#6b7280' },
  { key: 'utilization', label: 'Utilization (U)', color: '#374151' },
  { key: 'arrivalRate', label: 'Arrival Rate (λ)', color: '#9ca3af' },
]

interface ControlMeta {
  key: SimulationLabEditableInput
  label: string
  symbol: string
  min: number
  max: number
  step: number
}

const CONTROL_META: ControlMeta[] = [
  { key: 'serviceDemandSeconds', label: 'Service Demand', symbol: 'D', min: SERVER_LAB_LIMITS.minServiceDemandSeconds, max: SERVER_LAB_LIMITS.maxServiceDemandSeconds, step: 0.05 },
  { key: 'arrivalRatePerSecond', label: 'Arrival Rate (Expected)', symbol: 'λ', min: SERVER_LAB_LIMITS.minArrivalRatePerSecond, max: SERVER_LAB_LIMITS.maxArrivalRatePerSecond, step: 0.05 },
  { key: 'concurrency', label: 'Concurrency', symbol: 'c', min: SERVER_LAB_LIMITS.minConcurrency, max: SERVER_LAB_LIMITS.maxConcurrency, step: 1 },
  { key: 'durationSeconds', label: 'Time', symbol: 't', min: SERVER_LAB_LIMITS.minDurationSeconds, max: SERVER_LAB_LIMITS.maxDurationSeconds, step: 5 },
]

const EMPTY_AXIS: SimulationAxisSettings = {
  xMin: '',
  xMax: '',
  yMin: '',
  yMax: '',
  xTicks: '',
  yTicks: '',
}

function createInputDrafts(inputs: Record<SimulationLabEditableInput, number>) {
  return {
    serviceDemandSeconds: String(inputs.serviceDemandSeconds),
    arrivalRatePerSecond: String(inputs.arrivalRatePerSecond),
    concurrency: String(inputs.concurrency),
    durationSeconds: String(inputs.durationSeconds),
  }
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function SimulationLabView() {
  const inputs = useSimulationLabStore(s => s.inputs)
  const activeSeries = useSimulationLabStore(s => s.activeSeries)
  const currentRun = useSimulationLabStore(s => s.currentRun)
  const sweepResults = useSimulationLabStore(s => s.sweepResults)
  const recentRuns = useSimulationLabStore(s => s.recentRuns)
  const error = useSimulationLabStore(s => s.error)
  const pendingEstimate = useSimulationLabStore(s => s.pendingEstimate)
  const setInput = useSimulationLabStore(s => s.setInput)
  const clearPendingEstimate = useSimulationLabStore(s => s.clearPendingEstimate)
  const toggleSeries = useSimulationLabStore(s => s.toggleSeries)
  const runSimulation = useSimulationLabStore(s => s.runSimulation)
  const [axisSettings, setAxisSettings] = useState<SimulationAxisSettings>(EMPTY_AXIS)
  const [inputDrafts, setInputDrafts] = useState(() => createInputDrafts(inputs))

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [])

  useEffect(() => {
    setInputDrafts(createInputDrafts(inputs))
  }, [inputs])

  const currentEstimate = useMemo(() => estimateServerLabExperiment(inputs), [inputs])

  const setAxis = (key: keyof SimulationAxisSettings) => (value: string) => {
    setAxisSettings(prev => ({ ...prev, [key]: value }))
  }

  const setInputDraft = (key: SimulationLabEditableInput) => (value: string) => {
    clearPendingEstimate()
    setInputDrafts(prev => ({ ...prev, [key]: value }))
  }

  const readInputDraft = (control: ControlMeta) => {
    const parsed = Number.parseFloat(inputDrafts[control.key])
    if (!Number.isFinite(parsed)) return inputs[control.key]
    const steppedValue = control.step >= 1 ? Math.round(parsed) : parsed
    return clampNumber(steppedValue, control.min, control.max)
  }

  const commitInputDraft = (control: ControlMeta) => {
    const nextValue = readInputDraft(control)
    setInput(control.key, nextValue)
    setInputDrafts(prev => ({ ...prev, [control.key]: String(nextValue) }))
  }

  const runCommittedSimulation = () => {
    const nextInputs = { ...inputs }
    const nextDrafts = { ...inputDrafts }
    CONTROL_META.forEach((control) => {
      const nextValue = readInputDraft(control)
      nextInputs[control.key] = nextValue
      nextDrafts[control.key] = String(nextValue)
    })
    setInputDrafts(nextDrafts)
    const result = runSimulation(nextInputs)
    if (result === 'ran') {
      void recordSimulationActivityIfSignedIn().catch(() => undefined)
    }
  }

  return (
    <div className="app-shell min-h-screen bg-white text-black font-mono">
      <RetroHeader />
      <div className="relative z-10 flex min-h-[calc(100svh-61px)] flex-col bg-white/95 md:h-[calc(100svh-61px)] md:overflow-hidden">
        <section className="border-b-[3px] border-black bg-white px-4 py-4 md:px-8">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
              {CONTROL_META.map(control => (
                <ParamInput
                  key={control.key}
                  label={control.label}
                  symbol={control.symbol}
                  value={inputDrafts[control.key]}
                  onDraftChange={setInputDraft(control.key)}
                  onCommit={() => commitInputDraft(control)}
                />
              ))}
            </div>
            <div className="ml-auto flex w-full flex-col gap-1 sm:w-48">
            <button
              type="button"
              onClick={runCommittedSimulation}
              className="border-[3px] border-black bg-black px-7 py-1.5 font-mono text-sm font-bold uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.35)] transition-colors hover:bg-gray-800"
            >
              {pendingEstimate ? 'Run Again' : 'Run'}
            </button>
            {currentRun && (
              <span className="text-center font-mono text-[10px] font-bold tracking-wide text-gray-500">
                Seed {currentRun.inputs.seed}
              </span>
            )}
            <span className="text-center font-mono text-[10px] font-bold tracking-wide text-gray-500">
              U {formatPercent(currentEstimate.loadProfile.perWorkerLoad)} · {currentEstimate.loadProfile.label}
            </span>
            </div>
          </div>
        </section>

        {pendingEstimate && (
          <div className="border-b-[2px] border-black bg-gray-200 px-4 py-2 font-mono text-sm font-bold text-black md:px-8" role="alert">
            {pendingEstimate.messages.join('; ')}. Click Run again to continue.
          </div>
        )}

        {error && (
          <div className="border-b-[2px] border-black bg-[color:var(--tt-danger-soft)] px-4 py-2 font-mono text-sm font-bold text-[color:var(--tt-danger)] md:px-8" role="alert">
            {error}
          </div>
        )}

        <main className="flex min-h-0 flex-1 flex-col overflow-auto md:flex-row md:overflow-hidden">
          <aside className="w-full shrink-0 border-b-[3px] border-black bg-white p-4 md:w-60 md:border-b-0 md:border-r-[3px] md:overflow-y-auto">
            <div className="mb-3 border-b-[2px] border-black pb-2 font-mono text-[10px] font-bold uppercase tracking-widest">
              Observed Seeded Run
            </div>
            <div className="mb-2 font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500">
              Show / Hide
            </div>
            <div className="grid gap-2 sm:grid-cols-2 md:flex md:flex-col">
              {SERIES_META.map(series => {
                const active = activeSeries[series.key]
                return (
                  <button
                    key={series.key}
                    type="button"
                    disabled={!currentRun}
                    onClick={() => toggleSeries(series.key)}
                    className={cx(
                      'simulation-series-toggle flex items-center gap-1.5 border-[2px] px-2 py-1 text-left font-mono text-[9px] leading-tight transition-colors',
                      active
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 bg-white text-gray-400 hover:border-gray-500',
                      !currentRun && 'cursor-not-allowed opacity-45',
                    )}
                    aria-pressed={active}
                  >
                    <span
                      className="inline-block h-[2px] w-3 shrink-0"
                      style={{ background: active ? '#fff' : series.color }}
                    />
                    <span>{series.label}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-white">
            <div className="h-[25rem] min-h-[19rem] px-2 pb-2 pt-5 md:h-96 md:pl-2 md:pr-16">
              {currentRun ? (
                <SimulationChart
                  run={currentRun}
                  activeSeries={activeSeries}
                  axisSettings={axisSettings}
                />
              ) : (
                <div className="flex h-full items-center justify-center border-y border-gray-200 bg-[repeating-linear-gradient(0deg,transparent,transparent_11px,#f1f5f9_12px),repeating-linear-gradient(90deg,transparent,transparent_23px,#e5e7eb_24px)] px-6 text-center font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
                  Press Run to generate a seeded simulation.
                </div>
              )}
            </div>

            <SimulationSweepPanel results={sweepResults} />

            <div className="flex flex-wrap items-end gap-4 border-t-[3px] border-black bg-white px-4 py-3 md:gap-6 md:px-6">
              <span className="self-center font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Graph Settings
              </span>
              <div className="flex items-end gap-3">
                <span className="self-center font-mono text-[9px] font-bold uppercase tracking-wider text-gray-400">X Axis</span>
                <AxisInput label="Min" value={axisSettings.xMin} onChange={setAxis('xMin')} />
                <AxisInput label="Max" value={axisSettings.xMax} onChange={setAxis('xMax')} />
                <AxisInput label="Ticks" value={axisSettings.xTicks} onChange={setAxis('xTicks')} />
              </div>
              <div className="hidden h-8 w-px self-center bg-gray-200 md:block" />
              <div className="flex items-end gap-3">
                <span className="self-center font-mono text-[9px] font-bold uppercase tracking-wider text-gray-400">Y Axis</span>
                <AxisInput label="Min" value={axisSettings.yMin} onChange={setAxis('yMin')} />
                <AxisInput label="Max" value={axisSettings.yMax} onChange={setAxis('yMax')} />
                <AxisInput label="Ticks" value={axisSettings.yTicks} onChange={setAxis('yTicks')} />
              </div>
              <button
                type="button"
                onClick={() => setAxisSettings(EMPTY_AXIS)}
                className="self-end border-[2px] border-gray-300 px-3 py-1 font-mono text-[10px] tracking-wide text-gray-500 transition-colors hover:border-black hover:text-black"
              >
                Reset
              </button>
              <div className="flex w-full flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] font-bold text-gray-500">
                {recentRuns.slice(0, 4).map(run => (
                  <span key={`${run.seed}-${run.arrivals}`}>
                    {run.seed}: {run.completedWithinWindow}/{run.arrivals}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
