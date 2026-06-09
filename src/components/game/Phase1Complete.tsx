import { useGameStore } from '@/store/gameStore'
import { AppButton, FormulaCallout, MetricItem, Panel, SectionLabel, StatusBadge } from '@/components/ui/primitives'
import { SaturationChart } from './EducationalCharts'

function MetricCell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="p-4">
      <MetricItem label={label} value={value} valueClass={`text-lg ${tone ?? ''}`} />
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
    ? 'Your single-server service demand is calibrated. Phase 2 workers will process requests at this measured D.'
    : 'Calibration needs a retry. Complete enough gated sample requests with stable served-client response time before Phase 2.'
  const gatedCount = phase1Result.levelResults.filter(result => result.isGate).length
  const passedGates = phase1Result.levelResults.filter(result => result.isGate && result.passed).length

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-8">
      <Panel variant="modal" className="mx-auto w-full max-w-3xl p-6 md:p-8">
        <div className="mb-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_210px]">
          <div>
            <StatusBadge tone={phase1Result.passed ? 'info' : 'warning'}>
              {phase1Result.passed ? 'Calibration complete' : 'Calibration retry needed'}
            </StatusBadge>
            <h2 className="mt-3 text-3xl font-bold text-[color:var(--tt-text)]">Phase 1 complete</h2>
            <p className="tt-copy mt-2">{statusMessage}</p>
          </div>
          <div className="border-[3px] border-black bg-white p-4">
            <SectionLabel>Primary measure</SectionLabel>
            <div className="mt-2 font-mono text-3xl font-bold text-[color:var(--tt-accent)]">
              {hasMeasuredService ? `${D.toFixed(2)}s` : '-'}
            </div>
            <div className="tt-label mt-1">Avg service demand D</div>
          </div>
        </div>

        <div className="mb-6 border-[3px] border-black">
          <div className="grid grid-cols-2 md:grid-cols-3">
            <MetricCell label="Worker Capacity" value={hasMeasuredService ? `${lambdaMax.toFixed(2)} req/s` : '-'} />
            <MetricCell label="Served Avg R" value={R > 0 ? `${R.toFixed(2)}s` : '-'} />
            <MetricCell label="Completed Samples" value={String(phase1Result.completedCount)} />
            <MetricCell label="Still Waiting" value={String(phase1Result.unfinishedAtEndCount)} />
            <MetricCell
              label="Gated Levels"
              value={`${passedGates}/${gatedCount}`}
              tone={phase1Result.passed ? 'text-[color:var(--tt-text)]' : 'text-[color:var(--tt-warning)]'}
            />
            <MetricCell
              label="Typing Speed"
              value={phase1Result.avgTypingSpeed > 0 ? `${Math.round(phase1Result.avgTypingSpeed)} WPM` : '-'}
            />
          </div>
        </div>

        <FormulaCallout
          className="mb-6"
          formula="R = W + D"
          caption="Served-client response time includes queue waiting plus service. This finite burst reports observed samples."
        />

        <div className="mb-6">
          <SectionLabel className="mb-3">Level Results</SectionLabel>
          <div className="flex flex-col gap-2">
            {phase1Result.levelResults.map((result) => {
              const responseRatio = result.avgServiceTime > 0 ? result.avgResponseTime / result.avgServiceTime : 0
              const status = result.isDemo ? 'Demo' : result.passed ? 'Pass' : 'Retry'
              const statusTone = result.isDemo ? 'info' : result.passed ? 'success' : 'warning'
              return (
                <div key={result.levelId} className="grid gap-2 border-[2px] border-black bg-[color:var(--tt-surface-raised)] px-3 py-2 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--tt-text)]">{result.label}</div>
                    <div className="tt-label">
                      lambda {result.lambda.toFixed(2)}/s during burst - ref load {Math.round(result.referenceLoad * 100)}%
                    </div>
                  </div>
                  <StatusBadge tone={statusTone}>{status}</StatusBadge>
                  <span className="text-xs text-[color:var(--tt-text-muted)]">
                    {result.completedCount} served, {result.unfinishedAtEndCount} waiting
                  </span>
                  <span className="text-xs text-[color:var(--tt-text-muted)]">R/D {responseRatio > 0 ? responseRatio.toFixed(1) : '-'}</span>
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
          <p className="tt-copy mb-8 text-sm">
            D = {D.toFixed(2)}s carries into Phase 2. Each server worker uses that service demand while you manage the shared request queue.
          </p>
        ) : (
          <p className="tt-copy mb-8 text-sm">
            Replay Phase 1 to gather a stable service demand. Phase 2 unlocks after all gated levels pass with at least eight completed sample requests.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <AppButton
            onClick={returnToMenu}
            className="flex-1"
          >
            Back to Menu
          </AppButton>
          <AppButton
            onClick={reset}
            variant="secondary"
            className="flex-1"
          >
            Play Again
          </AppButton>
        </div>
      </Panel>
    </div>
  )
}
