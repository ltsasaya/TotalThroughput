import {
  asObject,
  enumField,
  integerRangeField,
  numberRangeField,
  optionalNumberRangeField,
  optionalUuidField,
  stringField,
} from './validation.js'

const DIFFICULTIES = ['easy', 'medium', 'hard', 'impossible'] as const

export interface Phase1RunSummaryInput {
  classId: string | null
  difficultyKey: string
  calibrationWpm: number
  calibrationRangeLabel: string
  calibrationBinIndex: number
  targetLoad: number
  arrivalRate: number
  expectedArrivals: number
  arrivalCount: number
  completedCount: number
  averageResponseTime: number
  averageServiceDemand: number
  averageTypingSpeed: number
  reactionSpeed: number
  utilizationPercent: number
  averageQueueLength: number
  maxQueueLength: number
  stillWaitingCount: number
  durationMs: number
  serviceDemandEstimateMs: number
  referenceResponseTimeMs: number | null
  seed: number
}

export function parsePhase1RunSummaryBody(value: unknown): Phase1RunSummaryInput {
  const body = asObject(value)
  return {
    classId: optionalUuidField(body, 'classId'),
    difficultyKey: enumField(body, 'difficultyKey', DIFFICULTIES),
    calibrationWpm: numberRangeField(body, 'calibrationWpm', 0, 250),
    calibrationRangeLabel: stringField(body, 'calibrationRangeLabel', { min: 1, max: 80 }),
    calibrationBinIndex: integerRangeField(body, 'calibrationBinIndex', 0, 20),
    targetLoad: numberRangeField(body, 'targetLoad', 0, 2),
    arrivalRate: numberRangeField(body, 'arrivalRate', 0, 20),
    expectedArrivals: integerRangeField(body, 'expectedArrivals', 0, 1_000),
    arrivalCount: integerRangeField(body, 'arrivalCount', 0, 1_000),
    completedCount: integerRangeField(body, 'completedCount', 0, 1_000),
    averageResponseTime: numberRangeField(body, 'averageResponseTime', 0, 600_000),
    averageServiceDemand: numberRangeField(body, 'averageServiceDemand', 0, 600_000),
    averageTypingSpeed: numberRangeField(body, 'averageTypingSpeed', 0, 300),
    reactionSpeed: numberRangeField(body, 'reactionSpeed', 0, 60_000),
    utilizationPercent: numberRangeField(body, 'utilizationPercent', 0, 100),
    averageQueueLength: numberRangeField(body, 'averageQueueLength', 0, 1_000),
    maxQueueLength: integerRangeField(body, 'maxQueueLength', 0, 1_000),
    stillWaitingCount: integerRangeField(body, 'stillWaitingCount', 0, 1_000),
    durationMs: integerRangeField(body, 'durationMs', 1_000, 600_000),
    serviceDemandEstimateMs: numberRangeField(body, 'serviceDemandEstimateMs', 0, 600_000),
    referenceResponseTimeMs: optionalNumberRangeField(body, 'referenceResponseTimeMs', 0, 600_000),
    seed: integerRangeField(body, 'seed', 0, 2_147_483_647),
  }
}
