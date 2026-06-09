import { useGameStore } from '@/store/gameStore'
import { AppButton, FormulaCallout, MetricItem, Panel, SectionLabel, StatusBadge } from '@/components/ui/primitives'
import { RetroHeader } from './RetroHeader'

function ms(value: number): string {
  return value > 0 ? `${(value / 1000).toFixed(2)}s` : '-'
}

export function Phase1RunSummary() {
  const reset = useGameStore(s => s.reset)
  const record = useGameStore(s => s.lastPhase1RunRecord)
  const returnToDifficultySelect = useGameStore(s => s.returnToDifficultySelect)
  const recalibrate = useGameStore(s => s.recalibrate)

  if (!record) return null

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader onHome={reset} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
        <Panel className="p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <StatusBadge tone={record.targetLoad >= 1 ? 'danger' : record.targetLoad >= 0.9 ? 'warning' : 'info'}>
                {record.difficultyLabel}
              </StatusBadge>
              <h1 className="mt-3 text-3xl font-bold text-[color:var(--tt-text)]">Run complete</h1>
              <p className="tt-copy mt-2">
                These are observed finite-run metrics from one 60-second request window.
              </p>
            </div>
            <div className="border-[3px] border-black bg-white p-4">
              <SectionLabel>Total Throughput</SectionLabel>
              <div className="mt-2 font-mono text-4xl font-bold text-[color:var(--tt-accent)]">
                {record.totalThroughput}
              </div>
              <div className="tt-label">requests completed</div>
            </div>
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionLabel className="mb-3">Recorded metrics</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricItem label="Avg Response Time" value={ms(record.averageResponseTime)} />
            <MetricItem label="Avg Service Demand D" value={ms(record.averageServiceDemand)} />
            <MetricItem label="Avg Typing Speed" value={record.averageTypingSpeed > 0 ? `${Math.round(record.averageTypingSpeed)} WPM` : '-'} />
            <MetricItem label="Reaction Speed" value={ms(record.reactionSpeed)} />
            <MetricItem label="Utilization" value={`${Math.round(record.utilizationPercent)}%`} />
            <MetricItem label="Max Queue Length" value={record.maxQueueLength} />
            <MetricItem label="Arrivals" value={`${record.arrivalCount}/${record.expectedArrivals} expected`} />
            <MetricItem label="Still Waiting" value={record.stillWaitingCount} />
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionLabel className="mb-3">Run setup</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricItem label="Difficulty Range" value={`${record.difficultyRangeLabel} WPM`} />
            <MetricItem label="Calibration Range" value={`${record.calibrationRangeLabel} WPM`} />
            <MetricItem label="Arrival Rate" value={`${record.arrivalRate.toFixed(3)}/s`} />
            <MetricItem label="Target Load" value={`${Math.round(record.targetLoad * 100)}%`} />
          </div>
        </Panel>

        <FormulaCallout
          formula={record.referenceResponseTimeMs === null
            ? 'Reference R is unstable when target load is at or above 100%'
            : `Reference intuition: R ~= ${ms(record.referenceResponseTimeMs)}`}
          caption="This reference is steady-state single-server intuition. The recorded metrics above are from the finite one-minute typing run."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <AppButton data-testid="summary-continue" onClick={returnToDifficultySelect}>Continue</AppButton>
          <AppButton data-testid="summary-recalibrate" variant="secondary" onClick={recalibrate}>Recalibrate</AppButton>
        </div>
      </main>
    </div>
  )
}
