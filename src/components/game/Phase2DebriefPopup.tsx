import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ExpansionFactorChart } from './EducationalCharts'

interface Props {
  onDismiss: () => void
}

export default function Phase2DebriefPopup({ onDismiss }: Props) {
  const runSummary = useGameStore(s => s.runSummary)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Enter') onDismiss() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onDismiss])

  if (!runSummary) return null

  const { avgServiceTime, avgResponseTime, avgWaitingTime, actualThroughput, perCoreUtilization } = runSummary

  const avgUtil =
    perCoreUtilization.length > 0
      ? perCoreUtilization.reduce((a, b) => a + b, 0) / perCoreUtilization.length
      : 0

  const D = avgServiceTime / 1000
  const R = avgResponseTime / 1000
  const W = avgWaitingTime / 1000
  const rdExpansion = D > 0 ? R / D : 1
  const N = actualThroughput > 0 ? (actualThroughput * R).toFixed(1) : '—'
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
        <p className="text-sm text-gray-500 mb-6">Your measured performance on the theory curves.</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-blue-300 text-sm">U = {(avgUtil * 100).toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">core utilization  (U = XD)</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-blue-300 text-sm">R/D = {rdExpansion.toFixed(2)}×</div>
            <div className="text-xs text-gray-500 mt-1">response time expansion</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-blue-300 text-sm">
              R = {D.toFixed(1)}s + {W.toFixed(1)}s = {R.toFixed(1)}s
            </div>
            <div className="text-xs text-gray-500 mt-1">D + W = response time</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="font-mono text-blue-300 text-sm">N = λR ≈ {N}</div>
            <div className="text-xs text-gray-500 mt-1">Little's Law — avg queue length</div>
          </div>
        </div>

        <ExpansionFactorChart
          avgUtil={avgUtil}
          avgResponseTime={avgResponseTime}
          avgServiceTime={avgServiceTime}
          coreCount={coreCount}
        />

        <p className="mt-5 text-sm text-gray-400">
          Full theory charts and score breakdown are in the run summary below.
        </p>

        <p className="mt-6 text-xs text-gray-600 text-center">Press Enter or click to continue</p>
      </div>
    </div>
  )
}
