import { useGameStore } from '@/store/gameStore'
import { AppButton, Panel, SectionLabel } from '@/components/ui/primitives'
import { PostRunCharts } from './PostRunCharts'
import { SummaryHeader } from './postrun/SummaryHeader'
import { MetricSections } from './postrun/MetricSections'
import { AnalysisSection } from './postrun/AnalysisSection'

function WaitServiceBar({ waitResponseRatio }: { waitResponseRatio: number }) {
  const waitPct = (waitResponseRatio * 100).toFixed(0)
  const servicePct = ((1 - waitResponseRatio) * 100).toFixed(0)
  return (
    <div className="mb-6">
      <SectionLabel className="mb-2">Response Time Breakdown</SectionLabel>
      <div className="tt-divider mb-3" />
      <div className="mb-2 flex h-4 w-full overflow-hidden rounded-full bg-[color:var(--tt-surface-muted)]">
        <div className="h-full bg-[color:var(--tt-warning)]" style={{ width: `${waitResponseRatio * 100}%` }} />
        <div className="h-full flex-1 bg-[color:var(--tt-accent)]" />
      </div>
      <div className="text-xs text-[color:var(--tt-text-muted)]">
        <span className="text-[color:var(--tt-warning)]">{waitPct}% waiting</span>
        {' / '}
        <span className="text-[color:var(--tt-accent)]">{servicePct}% service</span>
      </div>
    </div>
  )
}

export function PostRunSummary() {
  const runSummary = useGameStore(s => s.runSummary)
  const config = useGameStore(s => s.config)
  const returnToMenu = useGameStore(s => s.returnToMenu)

  if (!runSummary) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <p className="tt-muted">No run data available.</p>
      </div>
    )
  }

  const {
    arrivalRate,
    arrivalCount,
    expectedArrivals,
    targetPerWorkerLoad,
    unfinishedAtEndCount,
    completedTasks,
    droppedTasks,
    avgWaitingTime,
    maxWaitingTime,
    avgServiceTime,
    avgResponseTime,
    maxResponseTime,
    actualThroughput,
    idealThroughput,
    perCoreUtilization,
    throughputHistory,
    queueLengthHistory,
    failed,
    survivedMs,
    idleWasteMs,
  } = runSummary

  const avgUtil = perCoreUtilization.length > 0
    ? perCoreUtilization.reduce((a, b) => a + b, 0) / perCoreUtilization.length
    : 0
  const tpRatio = idealThroughput > 0 ? actualThroughput / idealThroughput : 0
  const waitRatio = avgServiceTime > 0 ? avgWaitingTime / avgServiceTime : 0
  const waitResponseRatio = avgResponseTime > 0 ? avgWaitingTime / avgResponseTime : 0

  return (
    <div className="app-shell flex min-h-screen items-start justify-center overflow-y-auto p-8">
      <Panel variant="modal" className="w-full max-w-2xl p-8">

        <SummaryHeader
          failed={failed}
          survivedMs={survivedMs}
          phaseDuration={config.phase2Duration}
          difficulty={config.difficulty}
          coreCount={config.phase2CoreCount}
        />

        <MetricSections
          arrivalRate={arrivalRate}
          arrivalCount={arrivalCount}
          expectedArrivals={expectedArrivals}
          targetPerWorkerLoad={targetPerWorkerLoad}
          unfinishedAtEndCount={unfinishedAtEndCount}
          completedTasks={completedTasks}
          droppedTasks={droppedTasks}
          actualThroughput={actualThroughput}
          idealThroughput={idealThroughput}
          tpRatio={tpRatio}
          avgWaitingTime={avgWaitingTime}
          maxWaitingTime={maxWaitingTime}
          avgServiceTime={avgServiceTime}
          avgResponseTime={avgResponseTime}
          maxResponseTime={maxResponseTime}
          waitResponseRatio={waitResponseRatio}
          perCoreUtilization={perCoreUtilization}
          avgUtil={avgUtil}
        />

        <div className="mb-6">
          <SectionLabel className="mb-2">Charts</SectionLabel>
          <div className="tt-divider mb-3" />
          <PostRunCharts
            throughputHistory={throughputHistory}
            queueLengthHistory={queueLengthHistory}
          />
        </div>

        {avgResponseTime > 0 && (
          <WaitServiceBar waitResponseRatio={waitResponseRatio} />
        )}

        <AnalysisSection
          failed={failed}
          completedTasks={completedTasks}
          tpRatio={tpRatio}
          avgUtil={avgUtil}
          waitRatio={waitRatio}
          idleWasteMs={idleWasteMs}
          coreCount={config.phase2CoreCount}
          arrivalRate={arrivalRate}
          targetPerWorkerLoad={targetPerWorkerLoad}
          avgServiceTime={avgServiceTime}
          avgResponseTime={avgResponseTime}
        />

        <div className="flex justify-center mt-4">
          <AppButton
            onClick={returnToMenu}
            variant="secondary"
            className="px-8"
          >
            Back to Menu
          </AppButton>
        </div>

      </Panel>
    </div>
  )
}
