import { HttpError } from './http'

export function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Request body must be an object.')
  }
  return value as Record<string, unknown>
}

export function stringField(
  body: Record<string, unknown>,
  key: string,
  options: { min?: number; max: number; required?: boolean } = { max: 120, required: true },
): string {
  const value = body[key]
  if (value === undefined || value === null) {
    if (options.required === false) return ''
    throw new HttpError(400, `${key} is required.`)
  }
  if (typeof value !== 'string') throw new HttpError(400, `${key} must be text.`)
  const trimmed = value.trim()
  if ((options.min ?? 0) > trimmed.length) throw new HttpError(400, `${key} is too short.`)
  if (trimmed.length > options.max) throw new HttpError(400, `${key} is too long.`)
  return trimmed
}

export function optionalStringField(body: Record<string, unknown>, key: string, max: number): string | null {
  const value = body[key]
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') throw new HttpError(400, `${key} must be text.`)
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > max) throw new HttpError(400, `${key} is too long.`)
  return trimmed
}

export function booleanField(body: Record<string, unknown>, key: string): boolean {
  const value = body[key]
  if (typeof value !== 'boolean') throw new HttpError(400, `${key} must be true or false.`)
  return value
}

export function optionalNumberField(body: Record<string, unknown>, key: string): number | null {
  const value = body[key]
  if (value === undefined || value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new HttpError(400, `${key} must be a finite number.`)
  }
  return value
}

export function numberRangeField(
  body: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
): number {
  const value = optionalNumberField(body, key)
  if (value === null) throw new HttpError(400, `${key} is required.`)
  if (value < min || value > max) throw new HttpError(400, `${key} is out of range.`)
  return value
}

export function optionalNumberRangeField(
  body: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
): number | null {
  const value = optionalNumberField(body, key)
  if (value === null) return null
  if (value < min || value > max) throw new HttpError(400, `${key} is out of range.`)
  return value
}

export function optionalIntegerField(body: Record<string, unknown>, key: string): number | null {
  const value = optionalNumberField(body, key)
  if (value === null) return null
  if (!Number.isInteger(value)) throw new HttpError(400, `${key} must be an integer.`)
  return value
}

export function integerRangeField(
  body: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
): number {
  const value = optionalIntegerField(body, key)
  if (value === null) throw new HttpError(400, `${key} is required.`)
  if (value < min || value > max) throw new HttpError(400, `${key} is out of range.`)
  return value
}

export function enumField<T extends string>(
  body: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T {
  const value = stringField(body, key, { min: 1, max: 80 })
  if (!allowed.includes(value as T)) throw new HttpError(400, `${key} is invalid.`)
  return value as T
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function uuidValue(value: string, key = 'id'): string {
  if (!UUID_PATTERN.test(value)) throw new HttpError(400, `${key} is invalid.`)
  return value
}

export function optionalUuidField(body: Record<string, unknown>, key: string): string | null {
  const value = optionalStringField(body, key, 80)
  return value ? uuidValue(value, key) : null
}

export function normalizedUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function validateUsername(username: string) {
  if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) {
    throw new HttpError(400, 'Username must be 3-32 letters, numbers, underscores, or hyphens.')
  }
}

export function validatePassword(password: string) {
  if (password.length < 8 || password.length > 128) {
    throw new HttpError(400, 'Password must be 8-128 characters.')
  }
}
