import { useGameStore } from '@/store/gameStore'
import { SaturationChart } from './EducationalCharts'

function StatCard({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

export function Phase1Complete() {
  const phase1Result = useGameStore(s => s.phase1Result)
  const returnToMenu = useGameStore(s => s.returnToMenu)
  const reset = useGameStore(s => s.reset)

  if (!phase1Result) return null

  const D = phase1Result.avgServiceTime / 1000
  const R = phase1Result.avgResponseTime / 1000
  const lambdaMax = phase1Result.measuredTasksPerSecond
  const hasMeasuredService = phase1Result.completedCount > 0
  const statusMessage = phase1Result.passed
    ? 'Your single-server service demand is calibrated. Phase 2 workers will process RPCs at this measured D.'
    : 'Calibration needs a retry. Complete enough gated sample RPCs with stable served-client response time before Phase 2.'
  const gatedCount = phase1Result.levelResults.filter(result => result.isGate).length
  const passedGates = phase1Result.levelResults.filter(result => result.isGate && result.passed).length

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center py-8 px-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <div className={`text-xs uppercase tracking-widest mb-1 ${phase1Result.passed ? 'text-blue-400' : 'text-amber-400'}`}>
            {phase1Result.passed ? 'Calibration Complete' : 'Calibration Retry Needed'}
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Phase 1 Complete</h2>
          <p className="text-gray-400">{statusMessage}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Worker Capacity" value={hasMeasuredService ? `${lambdaMax.toFixed(2)} req/s` : '-'} />
          <StatCard label="Avg Service D" value={hasMeasuredService ? `${D.toFixed(2)}s` : '-'} />
          <StatCard label="Served Avg R" value={R > 0 ? `${R.toFixed(2)}s` : '-'} />
          <StatCard label="Completed Samples" value={String(phase1Result.completedCount)} />
          <StatCard label="Still Waiting" value={String(phase1Result.unfinishedAtEndCount)} />
          <StatCard
            label="Gated Levels"
            value={`${passedGates}/${gatedCount}`}
            tone={phase1Result.passed ? 'text-white' : 'text-amber-300'}
          />
          <StatCard
            label="Typing Speed"
            value={phase1Result.avgTypingSpeed > 0 ? `${Math.round(phase1Result.avgTypingSpeed)} WPM` : '-'}
          />
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="font-mono text-blue-300 text-sm">R = W + D</div>
          <div className="text-xs text-gray-400 mt-1">
            Served-client response time includes queue waiting plus service. The simple M/M/1 reference curve rises sharply near saturation, but this finite burst reports observed samples.
          </div>
        </div>

        <div className="mb-6">
          <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Level Results</div>
          <div className="flex flex-col gap-2">
            {phase1Result.levelResults.map((result) => {
              const responseRatio = result.avgServiceTime > 0 ? result.avgResponseTime / result.avgServiceTime : 0
              const status = result.isDemo ? 'Demo' : result.passed ? 'Pass' : 'Retry'
              const statusTone = result.isDemo
                ? 'text-blue-300 bg-blue-950'
                : result.passed
                  ? 'text-green-300 bg-green-950'
                  : 'text-amber-300 bg-amber-950'
              return (
                <div key={result.levelId} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-sm text-white font-semibold">{result.label}</div>
                    <div className="text-xs text-gray-500">
                      lambda {result.lambda.toFixed(2)}/s during burst - ref load {Math.round(result.referenceLoad * 100)}%
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${statusTone}`}>{status}</span>
                  <span className="text-xs text-gray-400">
                    {result.completedCount} served, {result.unfinishedAtEndCount} waiting
                  </span>
                  <span className="text-xs text-gray-400">R/D {responseRatio > 0 ? responseRatio.toFixed(1) : '-'}</span>
                </div>
              )
            })}
          </div>
        </div>

        {phase1Result.completedCount > 0 && (
          <div className="mb-6">
            <SaturationChart
              phase1={{
                measuredTasksPerSecond: phase1Result.measuredTasksPerSecond,
                lambdaMax,
                arrivalRate: phase1Result.arrivalRate,
                actualThroughput: phase1Result.activeWindowThroughput,
                completedCount: phase1Result.completedCount,
              }}
            />
          </div>
        )}

        {phase1Result.passed ? (
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            D = {D.toFixed(2)}s carries into Phase 2. Each server worker uses that service demand while you manage the shared RPC queue.
          </p>
        ) : (
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Replay Phase 1 to gather a stable service demand. Phase 2 unlocks after all gated levels pass with at least eight completed sample RPCs.
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
