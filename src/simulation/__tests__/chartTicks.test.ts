import { describe, expect, it } from 'vitest'
import { createNiceTicks, formatTickLabel } from '../chartTicks'

describe('createNiceTicks', () => {
  it('uses clean ten-second ticks for a 120 second time window', () => {
    expect(createNiceTicks(0, 120)).toEqual([
      0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120,
    ])
  })

  it('uses clean five-second ticks for the default 60 second time window', () => {
    expect(createNiceTicks(0, 60)).toEqual([
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
    ])
  })

  it('keeps fractional short ranges readable', () => {
    expect(createNiceTicks(0, 1.6)).toEqual([
      0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6,
    ])
  })
})

describe('formatTickLabel', () => {
  it('removes unnecessary trailing decimals', () => {
    expect(formatTickLabel(10)).toBe('10')
    expect(formatTickLabel(3.5)).toBe('3.5')
    expect(formatTickLabel(3.125)).toBe('3.125')
  })
})
