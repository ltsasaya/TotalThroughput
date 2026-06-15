import type { AuthedUser, UserCalibration } from './http.js'

export interface UserCalibrationRow {
  id: string
  username: string
  calibration_wpm: unknown
  calibration_range_label: unknown
  calibration_bin_index: unknown
  calibration_service_demand_ms: unknown
  calibration_updated_at: unknown
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function calibrationFromRow(row: UserCalibrationRow): UserCalibration | null {
  const wpm = numberOrNull(row.calibration_wpm)
  if (wpm === null) return null

  return {
    wpm,
    rangeLabel: row.calibration_range_label ? String(row.calibration_range_label) : '',
    binIndex: Math.trunc(numberOrNull(row.calibration_bin_index) ?? 0),
    serviceDemandMs: numberOrNull(row.calibration_service_demand_ms) ?? 0,
    updatedAt: row.calibration_updated_at ? new Date(String(row.calibration_updated_at)).toISOString() : null,
  }
}

export function authUserFromRow(row: UserCalibrationRow): AuthedUser {
  return {
    id: row.id,
    username: row.username,
    calibration: calibrationFromRow(row),
  }
}
