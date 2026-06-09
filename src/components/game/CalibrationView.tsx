import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MetricItem, Panel, SectionLabel } from '@/components/ui/primitives'
import {
  CALIBRATION_DURATION_MS,
  CALIBRATION_ROW_CHAR_LENGTH,
  splitCalibrationRows,
  visibleCalibrationRows,
  type CalibrationRow,
} from '@/simulation/calibration'
import { RetroHeader } from './RetroHeader'

const CALIBRATION_ROW_GUARD_CHARS = 4
const CALIBRATION_MIN_ROW_CHARS = 12
const CALIBRATION_MAX_ROW_CHARS = 96

function measuredCalibrationRowLength(element: HTMLElement): number {
  const styles = window.getComputedStyle(element)
  const fontSize = Number.parseFloat(styles.fontSize) || 24
  let charWidth = fontSize * 0.65
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (context) {
    context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`
    charWidth = context.measureText('w').width || context.measureText('m').width || charWidth
  }

  const measured = Math.floor(element.clientWidth / charWidth) - CALIBRATION_ROW_GUARD_CHARS
  return Math.max(CALIBRATION_MIN_ROW_CHARS, Math.min(CALIBRATION_MAX_ROW_CHARS, measured))
}

function characterClassName({
  index,
  typedContent,
  targetText,
}: {
  index: number
  typedContent: string
  targetText: string
}) {
  if (index < typedContent.length) {
    return typedContent[index] === targetText[index]
      ? 'text-[color:var(--tt-success)]'
      : 'text-[color:var(--tt-danger)]'
  }
  if (index === typedContent.length) return 'text-[color:var(--tt-text)] underline underline-offset-4'
  return 'text-[color:var(--tt-text-subtle)]'
}

function CalibrationTextRows({
  rows,
  typedContent,
  targetText,
  windowRef,
}: {
  rows: CalibrationRow[]
  typedContent: string
  targetText: string
  windowRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div ref={windowRef} className="calibration-text-window">
      {rows.map(row => (
        <div key={row.rowIndex} className="calibration-text-row">
          {[...row.text].map((char, offset) => {
            const index = row.startIndex + offset
            const visibleChar = char === ' ' ? '\u00a0' : char
            return (
              <span key={index} className={characterClassName({ index, typedContent, targetText })}>
                {visibleChar}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function CalibrationView() {
  const gameStartTime = useGameStore(s => s.gameStartTime)
  const phaseElapsed = useGameStore(s => s.phaseElapsed)
  const calibrationText = useGameStore(s => s.calibrationText)
  const calibrationTypedContent = useGameStore(s => s.calibrationTypedContent)
  const typeCalibrationChar = useGameStore(s => s.typeCalibrationChar)
  const handleCalibrationBackspace = useGameStore(s => s.handleCalibrationBackspace)
  const textWindowRef = useRef<HTMLDivElement | null>(null)
  const [rowLength, setRowLength] = useState(CALIBRATION_ROW_CHAR_LENGTH)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key === 'Backspace') {
        e.preventDefault()
        handleCalibrationBackspace()
        return
      }
      if (e.key.length === 1) {
        e.preventDefault()
        typeCalibrationChar(e.key)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [typeCalibrationChar, handleCalibrationBackspace])

  useEffect(() => {
    const element = textWindowRef.current
    if (!element) return

    const updateRowLength = () => {
      const nextRowLength = measuredCalibrationRowLength(element)
      setRowLength(current => (current === nextRowLength ? current : nextRowLength))
    }

    updateRowLength()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateRowLength)
      return () => window.removeEventListener('resize', updateRowLength)
    }

    const observer = new ResizeObserver(updateRowLength)
    observer.observe(element)
    window.addEventListener('resize', updateRowLength)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateRowLength)
    }
  }, [])

  const calibrationRows = useMemo(
    () => splitCalibrationRows(calibrationText, rowLength),
    [calibrationText, rowLength],
  )
  const visibleRows = useMemo(
    () => visibleCalibrationRows(calibrationRows, calibrationTypedContent.length),
    [calibrationRows, calibrationTypedContent.length],
  )
  const remainingMs = Math.max(0, CALIBRATION_DURATION_MS - phaseElapsed)
  const typedCount = calibrationTypedContent.length
  const correctCount = [...calibrationTypedContent].filter((char, index) => char === calibrationText[index]).length
  const liveWpm = phaseElapsed > 0 ? ((correctCount / 5) / (phaseElapsed / 60_000)) : 0
  const accuracy = typedCount > 0 ? correctCount / typedCount : 1
  const accuracyValue = typedCount > 0 ? `${Math.round(accuracy * 100)}%` : '-'

  return (
    <div className="app-shell min-h-screen">
      <RetroHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-4 px-4 py-6">
        <Panel className="p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <SectionLabel>Calibration</SectionLabel>
              <h1 className="mt-2 text-3xl font-bold text-[color:var(--tt-text)]">30 second baseline</h1>
              <p className="tt-copy mt-2 max-w-2xl">
                Type the text as it appears. The fewer errors the better.
              </p>
            </div>
          </div>

          <div className="calibration-text-panel">
            <CalibrationTextRows
              rows={visibleRows}
              typedContent={calibrationTypedContent}
              targetText={calibrationText}
              windowRef={textWindowRef}
            />
            {gameStartTime === null && (
              <div className="calibration-start-overlay" aria-hidden="true">
                <span>(start typing to begin)</span>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 border-[3px] border-black p-4 sm:grid-cols-3">
            <MetricItem label="Time" value={`${Math.ceil(remainingMs / 1000)}s`} />
            <MetricItem label="Live WPM" value={liveWpm > 0 ? Math.round(liveWpm) : '-'} />
            <MetricItem label="Accuracy" value={accuracyValue} />
          </div>
        </Panel>
      </main>
    </div>
  )
}
