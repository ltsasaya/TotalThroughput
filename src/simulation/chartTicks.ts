const DEFAULT_TICK_COUNT = 10
const MIN_TICK_COUNT = 2
const MAX_TICK_COUNT = 30

function niceStep(rawStep: number): number {
  const exponent = Math.floor(Math.log10(rawStep))
  const power = 10 ** exponent
  const fraction = rawStep / power

  if (fraction < 1.5) return power
  if (fraction < 3) return 2 * power
  if (fraction < 7) return 5 * power
  return 10 * power
}

function roundToStep(value: number, step: number): number {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 2)
  return Number(value.toFixed(Math.min(12, decimals)))
}

export function formatTickLabel(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

export function createNiceTicks(
  min: number,
  max: number,
  preferredCount = DEFAULT_TICK_COUNT,
): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return []

  const tickCount = Math.min(
    MAX_TICK_COUNT,
    Math.max(MIN_TICK_COUNT, Math.round(preferredCount)),
  )
  const step = niceStep((max - min) / (tickCount - 1))
  const epsilon = step / 1_000_000
  const first = Math.ceil((min - epsilon) / step) * step
  const last = Math.floor((max + epsilon) / step) * step
  const ticks: number[] = []

  for (let tick = first; tick <= last + epsilon; tick += step) {
    ticks.push(roundToStep(tick, step))
  }

  return ticks
}
