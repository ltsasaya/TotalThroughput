import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { FormulaCallout, Panel } from '@/components/ui/primitives'
import { ExpansionFactorChart } from './EducationalCharts'

interface Props {
  onDismiss: () => void
}

export default function Phase2DebriefPopup({ onDismiss }: Props) {
  const runSummary = useGameStore(s => s.runSummary)

  useEffect(() => {
    const handler = () => onDismiss()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onDismiss])

  if (!runSummary) return null

  const {
    arrivalRate,
    targetPerWorkerLoad,
    serviceDemandMs,
    avgServiceTime,
    avgResponseTime,
    avgWaitingTime,
    actualThroughput,
    perCoreUtilization,
  } = runSummary

  const avgUtil =
    perCoreUtilization.length > 0
      ? perCoreUtilization.reduce((a, b) => a + b, 0) / perCoreUtilization.length
      : 0

  const D = avgServiceTime / 1000
  const configuredD = serviceDemandMs / 1000
  const R = avgResponseTime / 1000
  const W = avgWaitingTime / 1000
  const hasResponseSamples = avgResponseTime > 0
  const rdExpansion = hasResponseSamples && D > 0 ? R / D : 0
  const servedRequestsInSystem = hasResponseSamples && actualThroughput > 0
    ? (actualThroughput * R).toFixed(1)
    : '—'
  const coreCount = perCoreUtilization.length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 py-8"
      onClick={onDismiss}
    >
      <Panel
        variant="modal"
        className="mx-6 w-full max-w-xl p-8"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="mb-1 text-xl font-bold text-[color:var(--tt-text)]">Run Complete</h2>
        <p className="tt-label mb-6 text-sm">Your measured server-pool performance on the reference curves.</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <FormulaCallout formula={`lambda = ${arrivalRate.toFixed(2)}/s`} caption="configured RPC arrival rate" />
          <FormulaCallout formula={`lambda D/c = ${(targetPerWorkerLoad * 100).toFixed(0)}%`} caption="target load per worker" />
          <FormulaCallout
            formula={hasResponseSamples ? `R = ${D.toFixed(1)}s + ${W.toFixed(1)}s = ${R.toFixed(1)}s` : 'No completed R samples'}
            caption="Response time uses served RPCs"
          />
          <FormulaCallout
            formula={hasResponseSamples ? `R/D = ${rdExpansion.toFixed(2)}x` : 'R/D unavailable'}
            caption="observed response/service ratio"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <FormulaCallout formula={`observed util = ${(avgUtil * 100).toFixed(0)}%`} caption="average worker busy fraction" />
          <FormulaCallout formula={`N_served ~= X R = ${servedRequestsInSystem}`} caption="Completed-flow reference; excludes unfinished RPCs" />
        </div>

        {hasResponseSamples ? (
          <ExpansionFactorChart
            avgUtil={avgUtil}
            avgResponseTime={avgResponseTime}
            avgServiceTime={configuredD > 0 ? serviceDemandMs : avgServiceTime}
            coreCount={coreCount}
          />
        ) : (
          <p className="tt-copy text-sm">
            No RPCs completed, so response-time expansion is unavailable for this run.
          </p>
        )}

        <p className="tt-copy mt-5 text-sm">
          Full theory charts and score breakdown are in the run summary below.
        </p>

        <p className="tt-muted mt-6 text-center text-xs">Press any key or click to continue</p>
      </Panel>
    </div>
  )
}
