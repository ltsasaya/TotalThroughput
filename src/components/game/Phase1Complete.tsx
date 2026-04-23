import { useGameStore } from '@/store/gameStore'
import { SaturationChart } from './EducationalCharts'
import { Phase1UtilizationChart } from './Phase1Charts'

export function Phase1Complete() {
  const phase1Result = useGameStore(s => s.phase1Result)
  const tasks = useGameStore(s => s.tasks)
  const phaseElapsed = useGameStore(s => s.phaseElapsed)
  const returnToMenu = useGameStore(s => s.returnToMenu)
  const reset = useGameStore(s => s.reset)

  if (!phase1Result) return null

  const total = phase1Result.completedCount + phase1Result.droppedCount
  const dropRate = total > 0 ? phase1Result.droppedCount / total : 0
  const failed = phase1Result.failed === true

  const D = phase1Result.avgServiceTime / 1000
  const lambdaMax = phase1Result.measuredTasksPerSecond
  const U = Math.min(lambdaMax * D, 1.0)

  const totalArrived = Object.keys(tasks).length
  const lambdaArrival = phaseElapsed > 0 ? totalArrived / (phaseElapsed / 1000) : 0

  const R = phase1Result.avgResponseTime / 1000

  let statusMessage: string
  if (failed) {
    statusMessage = 'Queue overflowed — tasks backed up faster than you could process them. Phase 2 is locked.'
  } else if (dropRate > 0.3) {
    statusMessage = 'Many tasks dropped — dispatch quickly in Phase 2 to avoid queue buildup.'
  } else {
    statusMessage = 'Your baseline is calibrated. Phase 2 cores process at your measured service rate.'
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center py-8">
      <div className="bg-gray-900 rounded-2xl p-10 max-w-md mx-auto w-full">
        {failed ? (
          <>
            <div className="text-xs text-red-500 uppercase tracking-widest mb-1">Phase 1 Failed</div>
            <h2 className="text-3xl font-bold text-red-400 mb-2">Queue Overflowed</h2>
          </>
        ) : (
          <>
            <div className="text-xs text-blue-400 uppercase tracking-widest mb-1">Calibration Complete</div>
            <h2 className="text-3xl font-bold text-white mb-2">Phase 1 Complete</h2>
          </>
        )}
        <p className="text-gray-400 mb-8">{statusMessage}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Service Rate</p>
            <p className="text-xl font-bold text-white">
              {phase1Result.measuredTasksPerSecond.toFixed(2)} tasks/s
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Avg Service D</p>
            <p className="text-xl font-bold text-white">
              {(phase1Result.avgServiceTime / 1000).toFixed(1)}s
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Avg Response R</p>
            <p className="text-xl font-bold text-white">
              {R > 0 ? `${R.toFixed(1)}s` : '—'}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-xl font-bold text-white">{phase1Result.completedCount}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Dropped</p>
            <p className={`text-xl font-bold ${phase1Result.droppedCount > 0 ? 'text-red-400' : 'text-white'}`}>
              {phase1Result.droppedCount}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Typing Speed</p>
            <p className="text-xl font-bold text-gray-400">
              {Math.round(phase1Result.avgTypingSpeed)} WPM
            </p>
          </div>
        </div>

        {!failed && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="font-mono text-blue-300 text-sm">D = {D.toFixed(2)}s</div>
                <div className="text-xs text-gray-500 mt-1">service demand</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="font-mono text-blue-300 text-sm">λmax = {lambdaMax.toFixed(2)}/s</div>
                <div className="text-xs text-gray-500 mt-1">= 1/D  peak rate</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="font-mono text-blue-300 text-sm">U = {(U * 100).toFixed(0)}%</div>
                <div className="text-xs text-gray-500 mt-1">λ / λmax</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="font-mono text-emerald-300 text-sm">λ = {lambdaArrival.toFixed(2)}/s</div>
                <div className="text-xs text-gray-500 mt-1">arrival rate</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="font-mono text-emerald-300 text-sm">R = {R > 0 ? R.toFixed(2) : '—'}s</div>
                <div className="text-xs text-gray-500 mt-1">response time (W+D)</div>
              </div>
            </div>

            <div className="mb-6">
              <SaturationChart
                phase1={{
                  measuredTasksPerSecond: lambdaMax,
                  completedCount: phase1Result.completedCount,
                  droppedCount: phase1Result.droppedCount,
                }}
              />
            </div>

            <div className="mb-6">
              <Phase1UtilizationChart
                tasks={tasks}
                elapsedMs={phaseElapsed}
                avgServiceTime={phase1Result.avgServiceTime}
              />
            </div>

            <div className="mb-6 bg-gray-800 rounded-lg px-4 py-3">
              <div className="font-mono text-blue-300 text-sm">N = λR  (Little's Law)</div>
              <div className="text-xs text-gray-400 mt-1">
                λ = {lambdaArrival.toFixed(2)}/s approached λmax = {lambdaMax.toFixed(2)}/s — as U → 1, R grows unbounded.
              </div>
            </div>
          </>
        )}

        {failed ? (
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Complete Phase 1 without letting the queue overflow to unlock Phase 2. Try a lower difficulty or type faster.
          </p>
        ) : (
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            D = {D.toFixed(2)}s carries into Phase 2 — each core processes at this rate.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={returnToMenu}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Back to Menu
          </button>
          <button
            onClick={reset}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors cursor-pointer"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  )
}
