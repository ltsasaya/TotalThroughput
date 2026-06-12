import { useGameStore } from '@/store/gameStore'
import { AppButton, FormulaCallout, MetricItem, Panel, SectionLabel, StatusBadge } from '@/components/ui/primitives'
import { RetroHeader } from './RetroHeader'

function ms(value: number): string {
  return value > 0 ? `${(value / 1000).toFixed(2)}s` : '-'
}

function queueLength(value: number | undefined): string {
  return value !== undefined && Number.isFinite(value) ? value.toFixed(1) : '-'
}

export function Phase1RunSummary() {
  const record = useGameStore(s => s.lastPhase1RunRecord)
  const returnToDifficultySelect = useGameStore(s => s.returnToDifficultySelect)

  if (!record) return null

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
        <Panel className="p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <StatusBadge tone={record.targetLoad >= 1 ? 'danger' : record.targetLoad >= 0.9 ? 'warning' : 'info'}>
                {record.difficultyLabel}
              </StatusBadge>
              <h1 className="mt-3 text-3xl font-bold text-[color:var(--tt-text)]">Run complete</h1>
            </div>
            <div className="border-[3px] border-black bg-white p-4">
              <SectionLabel>Total Throughput</SectionLabel>
              <div className="mt-2 font-mono text-4xl font-bold text-[color:var(--tt-accent)]">
                {record.completedCount}
              </div>
              <div className="tt-label">requests completed</div>
            </div>
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionLabel className="mb-3">Recorded metrics</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricItem label="Avg Response Time" value={ms(record.averageResponseTime)} />
            <MetricItem label="Observed Demand D" value={ms(record.averageServiceDemand)} />
            <MetricItem label="Avg Typing Speed" value={record.averageTypingSpeed > 0 ? `${Math.round(record.averageTypingSpeed)} WPM` : '-'} />
            <MetricItem label="Reaction Speed" value={ms(record.reactionSpeed)} />
            <MetricItem label="Utilization (U)" value={`${Math.round(record.utilizationPercent)}%`} />
            <MetricItem label="Avg Queue Length" value={queueLength(record.averageQueueLength)} />
            <MetricItem label="Arrivals" value={`${record.arrivalCount}/${record.expectedArrivals} expected`} />
            <MetricItem label="Unfinished" value={`${record.stillWaitingCount}`} />
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionLabel className="mb-3">Run setup</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricItem label="Expected Service Demand (D*)" value={ms(record.serviceDemandEstimateMs)} />
            <MetricItem label="Expected Arrival Rate (λ*)" value={`${record.arrivalRate.toFixed(3)}/s`} />
            <MetricItem label="Configured Load" value={`${Math.round(record.targetLoad * 100)}%`} />
          </div>
        </Panel>

        <FormulaCallout
          formula={record.referenceResponseTimeMs === null
            ? 'Expected Response Time (R*) is unstable when target load is at or above 100%'
            : `Expected Response Time (R*) ~= ${ms(record.referenceResponseTimeMs)}`}
        />

        <div className="grid gap-3">
          <AppButton data-testid="summary-continue" onClick={returnToDifficultySelect}>Continue</AppButton>
        </div>
      </main>
    </div>
  )
}
