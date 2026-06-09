import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { AppButton, cx, MetricItem, Panel, SectionLabel } from '@/components/ui/primitives'
import type { Phase1DifficultyKey, Phase1DifficultyOption } from '@/types/game'
import { EducationalManual } from './EducationalManual'
import { RetroHeader } from './RetroHeader'

interface GameMenuOption {
  key: Phase1DifficultyKey
  label: string
  regime: Phase1DifficultyOption['regime']
  rangeLabel?: string
  targetLoad?: number
}

const UNCALIBRATED_OPTIONS: GameMenuOption[] = [
  { key: 'easy', label: 'Easy', regime: 'low' },
  { key: 'medium', label: 'Medium', regime: 'moderate' },
  { key: 'hard', label: 'Hard', regime: 'near-saturation' },
  { key: 'impossible', label: 'Impossible', regime: 'overload' },
]

function difficultyDescription(regime: Phase1DifficultyOption['regime']) {
  if (regime === 'low') return 'Little to no queue expected.'
  if (regime === 'moderate') return 'Short queues should appear.'
  if (regime === 'near-saturation') return 'Near saturation.'
  return 'Do you dare.'
}

function ManualIcon() {
  return (
    <svg
      className="game-menu-manual-icon"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 42 42"
      shapeRendering="crispEdges"
    >
      <path d="M33 8H36V37H12" fill="none" stroke="#000" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="3" />
      <rect
        x="7"
        y="4"
        width="26"
        height="32"
        fill="#fff"
        stroke="#000"
        strokeLinejoin="miter"
        strokeWidth="3"
      />
      <path d="M14 5V35" fill="none" stroke="#000" strokeLinecap="square" strokeWidth="3" />
    </svg>
  )
}

export function DifficultySelectView() {
  const calibrationResult = useGameStore(s => s.calibrationResult)
  const phase1DifficultyOptions = useGameStore(s => s.phase1DifficultyOptions)
  const phase1RunRecords = useGameStore(s => s.phase1RunRecords)
  const startCalibratedRun = useGameStore(s => s.startCalibratedRun)
  const recalibrate = useGameStore(s => s.recalibrate)
  const hasSeenEducationalManual = useGameStore(s => s.hasSeenEducationalManual)
  const markEducationalManualSeen = useGameStore(s => s.markEducationalManualSeen)
  const [isManualOpen, setIsManualOpen] = useState(false)

  const hasValidCalibration = calibrationResult !== null && phase1DifficultyOptions.length > 0
  const isManualDiscoveryLocked = !hasValidCalibration && !hasSeenEducationalManual
  const menuOptions: GameMenuOption[] = hasValidCalibration
    ? phase1DifficultyOptions.map(option => ({
      key: option.key,
      label: option.label,
      regime: option.regime,
      rangeLabel: option.range.label,
      targetLoad: option.targetLoad,
    }))
    : UNCALIBRATED_OPTIONS

  return (
    <div className="app-shell game-menu-shell min-h-screen">
      <RetroHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
        <Panel className="p-5 md:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="game-menu-intro">
              <div>
                <SectionLabel>Game menu</SectionLabel>
                <h1 className="mt-2 text-3xl font-bold text-[color:var(--tt-text)]">Calibrate and Play</h1>
                <p className="tt-copy mt-2 max-w-2xl">
                  Your typing baseline sets your level availability. The following one-minute runs have different request arrival rates. Please try your best, you wouldn't want to leave your clients dissatisfied...
                </p>
              </div>
              <button
                type="button"
                className={cx(
                  'game-menu-manual-icon-button',
                  isManualDiscoveryLocked && 'game-menu-manual-icon-button-highlighted',
                )}
                aria-label="Open educational manual"
                title="Educational manual"
                onClick={() => {
                  markEducationalManualSeen()
                  setIsManualOpen(true)
                }}
              >
                <ManualIcon />
              </button>
            </div>
            <div className="game-menu-baseline-panel">
              <h2>Baseline</h2>
              <div className="game-menu-baseline-stats">
                <MetricItem
                  label="WPM"
                  value={hasValidCalibration ? Math.round(calibrationResult?.rawWpm ?? 0) : '-'}
                />
                <MetricItem
                  label="Display bin"
                  value={hasValidCalibration ? `${calibrationResult?.wpmRange.label ?? '-'} WPM` : '-'}
                />
              </div>
              <AppButton
                data-testid="difficulty-recalibrate"
                variant="secondary"
                disabled={isManualDiscoveryLocked}
                onClick={recalibrate}
                className={cx(
                  'game-menu-calibration-button min-h-10 self-end px-3 py-2 text-sm',
                  !hasValidCalibration && 'game-menu-calibration-required',
                )}
              >
                {hasValidCalibration ? 'Recalibrate' : 'Calibrate'}
              </AppButton>
            </div>
          </div>
        </Panel>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {menuOptions.map(option => (
            <button
              key={option.key}
              type="button"
              data-testid={`start-${option.key}`}
              disabled={!hasValidCalibration}
              onClick={() => startCalibratedRun(option.key)}
              aria-label={hasValidCalibration ? `Start ${option.label}` : `${option.label} unavailable until calibration`}
              className={cx(
                'game-menu-difficulty-card',
                `game-menu-difficulty-card-${option.key}`,
                !hasValidCalibration && 'game-menu-difficulty-disabled',
              )}
            >
              <div>
                <div className="game-menu-difficulty-card-header">
                  <h2>{option.label}</h2>
                  <span className="game-menu-difficulty-load">
                    {option.targetLoad !== undefined ? `${Math.round(option.targetLoad * 100)}%` : '-'}
                  </span>
                </div>
                <div
                  className={cx(
                    'game-menu-difficulty-range',
                    !hasValidCalibration && 'game-menu-calibration-required-text',
                  )}
                >
                  {option.rangeLabel ? `${option.rangeLabel} WPM range` : 'calibration required'}
                </div>
              </div>
              <div className="game-menu-difficulty-description">
                {difficultyDescription(option.regime)}
              </div>
            </button>
          ))}
        </div>

        {phase1RunRecords.length > 0 && (
          <Panel className="p-4">
            <SectionLabel className="mb-3">Browser-session run records</SectionLabel>
            <div className="grid gap-2">
              {phase1RunRecords.slice(-4).map(record => (
                <div
                  key={record.id}
                  className="grid gap-2 border-[2px] border-black bg-white px-3 py-2 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
                >
                  <div>
                    <div className="font-bold text-[color:var(--tt-text)]">{record.difficultyLabel}</div>
                    <div className="tt-label">{record.difficultyRangeLabel} WPM - load {Math.round(record.targetLoad * 100)}%</div>
                  </div>
                  <span className="font-mono text-sm">{record.completedCount} done</span>
                  <span className="font-mono text-sm">R {(record.averageResponseTime / 1000).toFixed(2)}s</span>
                  <span className="font-mono text-sm">Q max {record.maxQueueLength}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </main>

      {isManualDiscoveryLocked && <div className="game-menu-discovery-scrim" aria-hidden="true" />}

      {isManualOpen && (
        <div className="game-menu-manual-overlay">
          <EducationalManual
            presentation="modal"
            onComplete={() => setIsManualOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
