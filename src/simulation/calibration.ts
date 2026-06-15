import type { CalibrationResult, Phase1DifficultyOption, Phase1DifficultyKey, WpmRange } from '../types/game'
import { estimatePhase1PromptLength, SHARED_TYPING_WORDS } from './content'

export const CALIBRATION_DURATION_MS = 30_000
export const CALIBRATION_VISIBLE_ROWS = 5
export const CALIBRATION_ROW_CHAR_LENGTH = 56

export const WPM_BINS: readonly WpmRange[] = [
  { min: 30, max: 40, label: '30-40' },
  { min: 40, max: 50, label: '40-50' },
  { min: 50, max: 60, label: '50-60' },
  { min: 60, max: 75, label: '60-75' },
  { min: 75, max: 90, label: '75-90' },
  { min: 90, max: 105, label: '90-105' },
  { min: 105, max: 120, label: '105-120' },
  { min: 120, max: 140, label: '120-140' },
  { min: 140, max: 160, label: '140-160' },
  { min: 160, max: 180, label: '160-180' },
  { min: 180, max: 200, label: '180-200' },
]

const DIFFICULTY_SPECS: Array<{
  key: Phase1DifficultyKey
  label: string
  offset: number
  targetLoad: number
  regime: Phase1DifficultyOption['regime']
  seed: number
}> = [
  { key: 'easy', label: 'Easy', offset: -1, targetLoad: 0.25, regime: 'low', seed: 61_025 },
  { key: 'medium', label: 'Medium', offset: 0, targetLoad: 0.50, regime: 'moderate', seed: 61_050 },
  { key: 'hard', label: 'Hard', offset: 1, targetLoad: 0.75, regime: 'high', seed: 61_075 },
  { key: 'impossible', label: 'Impossible', offset: 2, targetLoad: 1.00, regime: 'overload', seed: 61_100 },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function buildCalibrationText(wordCount = 360): string {
  return Array.from({ length: wordCount }, () => {
    const wordIndex = Math.floor(Math.random() * SHARED_TYPING_WORDS.length)
    return SHARED_TYPING_WORDS[wordIndex]
  }).join(' ')
}

export interface CalibrationRow {
  text: string
  startIndex: number
  rowIndex: number
}

export function splitCalibrationRows(
  text: string,
  rowLength = CALIBRATION_ROW_CHAR_LENGTH,
): CalibrationRow[] {
  const words = text.split(' ')
  const rows: CalibrationRow[] = []
  let current = ''
  let currentStartIndex = 0
  let nextWordStartIndex = 0

  words.forEach((word) => {
    const wordStartIndex = nextWordStartIndex
    nextWordStartIndex += word.length + 1

    if (!current) {
      current = word
      currentStartIndex = wordStartIndex
      return
    }

    const next = `${current} ${word}`
    if (next.length <= rowLength) {
      current = next
      return
    }

    rows.push({
      text: current,
      startIndex: currentStartIndex,
      rowIndex: rows.length,
    })
    current = word
    currentStartIndex = wordStartIndex
  })

  if (current) {
    rows.push({
      text: current,
      startIndex: currentStartIndex,
      rowIndex: rows.length,
    })
  }

  return rows
}

export function calibrationCursorRow(rows: readonly CalibrationRow[], typedLength: number): number {
  const rowIndex = rows.findIndex(row => typedLength < row.startIndex + row.text.length)
  return rowIndex >= 0 ? rowIndex : Math.max(0, rows.length - 1)
}

export function visibleCalibrationRows(
  rows: readonly CalibrationRow[],
  typedLength: number,
  visibleCount = CALIBRATION_VISIBLE_ROWS,
): CalibrationRow[] {
  const firstRow = calibrationCursorRow(rows, typedLength)
  return rows.slice(firstRow, firstRow + visibleCount)
}

export function wpmBinIndex(wpm: number): number {
  if (!Number.isFinite(wpm)) return 0
  if (wpm < WPM_BINS[0].min) return 0
  const index = WPM_BINS.findIndex((range, i) => {
    const isLast = i === WPM_BINS.length - 1
    return wpm >= range.min && (wpm < range.max || isLast)
  })
  return index >= 0 ? index : WPM_BINS.length - 1
}

export function calculateCalibrationResult({
  text,
  typedContent,
  firstKeystrokeTime,
  durationMs = CALIBRATION_DURATION_MS,
}: {
  text: string
  typedContent: string
  firstKeystrokeTime?: number
  durationMs?: number
}): CalibrationResult {
  const typedChars = typedContent.length
  const correctChars = [...typedContent].filter((char, index) => char === text[index]).length
  const minutes = durationMs / 60_000
  const rawWpm = minutes > 0 ? (correctChars / 5) / minutes : 0
  const binIndex = wpmBinIndex(rawWpm)
  const wpmRange = WPM_BINS[binIndex]
  const effectiveWpm = clamp(rawWpm, WPM_BINS[0].min, WPM_BINS[WPM_BINS.length - 1].max)
  const estimatedPromptChars = estimatePhase1PromptLength()
  const estimatedServiceDemandMs = Math.round((estimatedPromptChars * 60_000) / (effectiveWpm * 5))

  return {
    rawWpm,
    effectiveWpm,
    binIndex,
    wpmRange,
    correctChars,
    typedChars,
    accuracy: typedChars > 0 ? correctChars / typedChars : 0,
    estimatedServiceDemandMs,
    reactionSpeedMs: firstKeystrokeTime ?? 0,
    durationMs,
  }
}

export function buildPhase1DifficultyOptions(result: CalibrationResult): Phase1DifficultyOption[] {
  return DIFFICULTY_SPECS.map((spec) => {
    const binIndex = clamp(result.binIndex + spec.offset, 0, WPM_BINS.length - 1)
    return {
      key: spec.key,
      label: spec.label,
      range: WPM_BINS[binIndex],
      targetLoad: spec.targetLoad,
      regime: spec.regime,
      seed: spec.seed + binIndex,
    }
  })
}
