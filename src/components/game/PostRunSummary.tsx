import { useGameStore } from '@/store/gameStore'
import { PostRunCharts } from './PostRunCharts'
import { SummaryHeader } from './postrun/SummaryHeader'
import { MetricSections } from './postrun/MetricSections'
import { AnalysisSection } from './postrun/AnalysisSection'

function WaitServiceBar({ waitResponseRatio }: { waitResponseRatio: number }) {
  const waitPct = (waitResponseRatio * 100).toFixed(0)
  const servicePct = ((1 - waitResponseRatio) * 100).toFixed(0)
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Response Time Breakdown</div>
      <div className="border-t border-gray-800 mb-3" />
      <div className="flex h-4 rounded-full overflow-hidden w-full bg-gray-700 mb-2">
        <div className="bg-amber-500 h-full" style={{ width: `${waitResponseRatio * 100}%` }} />
        <div className="bg-blue-500 h-full flex-1" />
      </div>
      <div className="text-xs text-gray-400">
        <span className="text-amber-400">{waitPct}% waiting</span>
        {' / '}
        <span className="text-blue-400">{servicePct}% service</span>
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">No run data available.</p>
      </div>
    )
  }

  const {
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
    <div className="min-h-screen bg-gray-950 flex items-start justify-center p-8 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full">

        <SummaryHeader
          failed={failed}
          survivedMs={survivedMs}
          phaseDuration={config.phase2Duration}
          difficulty={config.difficulty}
          coreCount={config.phase2CoreCount}
        />

        <MetricSections
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
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Charts</div>
          <div className="border-t border-gray-800 mb-3" />
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
          tpRatio={tpRatio}
          avgUtil={avgUtil}
          waitRatio={waitRatio}
          idleWasteMs={idleWasteMs}
          coreCount={config.phase2CoreCount}
          avgServiceTime={avgServiceTime}
          avgResponseTime={avgResponseTime}
        />

        <div className="flex justify-center mt-4">
          <button
            onClick={returnToMenu}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl cursor-pointer"
          >
            Back to Menu
          </button>
        </div>

      </div>
    </div>
  )
}
