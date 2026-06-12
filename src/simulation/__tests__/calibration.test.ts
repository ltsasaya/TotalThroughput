import { describe, expect, it, vi } from 'vitest'
import {
  buildCalibrationText,
  buildPhase1DifficultyOptions,
  calculateCalibrationResult,
  splitCalibrationRows,
  visibleCalibrationRows,
  WPM_BINS,
  wpmBinIndex,
} from '../calibration'

describe('calibration WPM bins', () => {
  it('uses the approved WPM table', () => {
    expect(WPM_BINS.map(bin => bin.label)).toEqual([
      '30-40',
      '40-50',
      '50-60',
      '60-75',
      '75-90',
      '90-105',
      '105-120',
      '120-140',
      '140-160',
      '160-180',
      '180-200',
    ])
  })

  it('clamps below and above the approved display range', () => {
    expect(wpmBinIndex(12)).toBe(0)
    expect(wpmBinIndex(220)).toBe(WPM_BINS.length - 1)
  })
})

describe('calculateCalibrationResult', () => {
  it('computes WPM from correct chars over 30 seconds', () => {
    const text = 'a'.repeat(150)
    const result = calculateCalibrationResult({ text, typedContent: text })
    expect(result.rawWpm).toBe(60)
    expect(result.binIndex).toBe(3)
    expect(result.wpmRange.label).toBe('60-75')
  })

  it('preserves raw WPM and uses effective WPM for service-demand estimate', () => {
    const result = calculateCalibrationResult({ text: 'abcdef', typedContent: 'abcxef' })
    expect(result.correctChars).toBe(5)
    expect(result.typedChars).toBe(6)
    expect(result.rawWpm).toBe(2)
    expect(result.effectiveWpm).toBe(30)
    expect(result.estimatedServiceDemandMs).toBeGreaterThan(0)
  })
})

describe('buildPhase1DifficultyOptions', () => {
  it('maps Easy/Medium/Hard/Impossible from calibrated bin and target loads', () => {
    const result = calculateCalibrationResult({ text: 'a'.repeat(150), typedContent: 'a'.repeat(150) })
    const options = buildPhase1DifficultyOptions(result)
    expect(options.map(option => option.key)).toEqual(['easy', 'medium', 'hard', 'impossible'])
    expect(options.map(option => option.range.label)).toEqual(['50-60', '60-75', '75-90', '90-105'])
    expect(options.map(option => option.targetLoad)).toEqual([0.25, 0.50, 0.75, 1.00])
  })
})

describe('calibration row window', () => {
  it('uses random word selection for generated typing text', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

    try {
      expect(buildCalibrationText(3)).toBe('server server server')
      expect(randomSpy).toHaveBeenCalledTimes(3)
    } finally {
      randomSpy.mockRestore()
    }
  })

  it('generates lowercase-only typing text', () => {
    const text = buildCalibrationText(80)
    expect(text).toBe(text.toLowerCase())
  })

  it('moves the visible window by complete generated rows', () => {
    const text = 'server queue worker request response client latency throughput service arrival waiting capacity busy idle typing system'
    const rows = splitCalibrationRows(text, 20)
    const early = visibleCalibrationRows(rows, 0, 5)
    const later = visibleCalibrationRows(rows, rows[0].startIndex + rows[0].text.length, 5)

    expect(later[0].rowIndex).toBe(early[0].rowIndex + 1)
    expect(later).toHaveLength(5)
    expect(later[0].text[0]).not.toBe(' ')
  })

  it('keeps generated rows inside the requested character capacity', () => {
    const text = 'throughput window buffer load server load system waiting complete queue busy measure baseline load timer server response busy buffer worker window system load service'
    const rows = splitCalibrationRows(text, 34)

    expect(rows.length).toBeGreaterThan(1)
    rows.forEach((row) => {
      expect(row.text.length).toBeLessThanOrEqual(34)
      expect(row.text).toBe(row.text.trim())
    })
  })
})
