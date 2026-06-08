import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
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
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center overflow-y-auto py-8"
      onClick={onDismiss}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-xl w-full mx-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-1">Run Complete</h2>
        <p className="text-sm text-gray-500 mb-6">Your measured server-pool performance on the reference curves.</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-blue-300 text-sm">lambda = {arrivalRate.toFixed(2)}/s</div>
            <div className="text-xs text-gray-500 mt-1">configured RPC arrival rate</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-blue-300 text-sm">lambda D/c = {(targetPerWorkerLoad * 100).toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">target load per worker</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            {hasResponseSamples ? (
              <div className="font-mono text-blue-300 text-sm">
                R = {D.toFixed(1)}s + {W.toFixed(1)}s = {R.toFixed(1)}s
              </div>
            ) : (
              <div className="font-mono text-blue-300 text-sm">No completed R samples</div>
            )}
            <div className="text-xs text-gray-500 mt-1">Response time uses served RPCs</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-blue-300 text-sm">
              {hasResponseSamples ? `R/D = ${rdExpansion.toFixed(2)}x` : 'R/D unavailable'}
            </div>
            <div className="text-xs text-gray-500 mt-1">observed response/service ratio</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-blue-300 text-sm">observed util = {(avgUtil * 100).toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">average worker busy fraction</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-blue-300 text-sm">N_served ~= X R = {servedRequestsInSystem}</div>
            <div className="text-xs text-gray-500 mt-1">Completed-flow reference; excludes unfinished RPCs</div>
          </div>
        </div>

        {hasResponseSamples ? (
          <ExpansionFactorChart
            avgUtil={avgUtil}
            avgResponseTime={avgResponseTime}
            avgServiceTime={configuredD > 0 ? serviceDemandMs : avgServiceTime}
            coreCount={coreCount}
          />
        ) : (
          <p className="text-sm text-gray-400">
            No RPCs completed, so response-time expansion is unavailable for this run.
          </p>
        )}

        <p className="mt-5 text-sm text-gray-400">
          Full theory charts and score breakdown are in the run summary below.
        </p>

        <p className="mt-6 text-xs text-gray-600 text-center">Press any key or click to continue</p>
      </div>
    </div>
  )
}
