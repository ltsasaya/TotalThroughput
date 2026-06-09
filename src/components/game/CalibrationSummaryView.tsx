import { AppButton, MetricItem, Panel, SectionLabel } from '@/components/ui/primitives'
import { useGameStore } from '@/store/gameStore'
import { RetroHeader } from './RetroHeader'

export function CalibrationSummaryView() {
  const calibrationResult = useGameStore(s => s.calibrationResult)
  const recalibrate = useGameStore(s => s.recalibrate)
  const returnToDifficultySelect = useGameStore(s => s.returnToDifficultySelect)

  if (!calibrationResult) return null

  const accuracy = `${Math.round(calibrationResult.accuracy * 100)}%`
  const wpm = Math.round(calibrationResult.rawWpm)
  const bin = `${calibrationResult.wpmRange.label} WPM`

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader />
      <main className="calibration-summary-shell">
        <Panel className="calibration-summary-card">
          <SectionLabel>Calibration complete</SectionLabel>
          <h1>Baseline recorded</h1>
          <div className="calibration-summary-metrics">
            <MetricItem label="WPM" value={wpm} />
            <MetricItem label="Accuracy" value={accuracy} />
            <MetricItem label="Display bin" value={bin} />
          </div>
          <div className="calibration-summary-actions">
            <AppButton variant="secondary" onClick={recalibrate}>
              Recalibrate
            </AppButton>
            <AppButton onClick={returnToDifficultySelect}>
              Game Menu
            </AppButton>
          </div>
        </Panel>
      </main>
    </div>
  )
}
