import type { CalibrationResult, Phase1DifficultyKey, Phase1DifficultyOption, Phase1RunConfig } from '../types/game'
import type { Phase1RunRecord } from '../types/metrics'
import type { Task } from '../types/task'
import { generatePoissonArrivalSchedule, type ScheduledArrival } from './arrival'

export const PHASE1_RUN_DURATION_MS = 60_000

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function completedTasks(tasks: Record<string, Task>): Task[] {
  return Object.values(tasks).filter(task => task.status === 'completed')
}

export function observedInGameWpm(task: Task): number {
  if (task.serviceStartTime === undefined || task.completionTime === undefined) return 0
  const serviceMs = task.completionTime - task.serviceStartTime
  return serviceMs > 0 ? ((task.content ?? '').length / 5) / (serviceMs / 60_000) : 0
}

export function buildPhase1RunConfig({
  option,
  calibrationResult,
  runIndex,
}: {
  option: Phase1DifficultyOption
  calibrationResult: CalibrationResult
  runIndex: number
}): Phase1RunConfig {
  const serviceDemandSeconds = calibrationResult.estimatedServiceDemandMs / 1000
  const lambda = option.targetLoad / serviceDemandSeconds

  return {
    difficulty: option,
    seed: option.seed + runIndex * 997,
    lambda,
    targetLoad: option.targetLoad,
    expectedArrivals: Math.round(lambda * (PHASE1_RUN_DURATION_MS / 1000)),
    arrivalWindowMs: PHASE1_RUN_DURATION_MS,
    serviceDemandMs: calibrationResult.estimatedServiceDemandMs,
    calibrationWpm: calibrationResult.rawWpm,
    calibrationBinIndex: calibrationResult.binIndex,
  }
}

export function generatePhase1RunArrivalSchedule(run: Phase1RunConfig): ScheduledArrival[] {
  return generatePoissonArrivalSchedule({
    lambdaPerSecond: run.lambda,
    arrivalWindowMs: run.arrivalWindowMs,
    seed: run.seed,
  })
}

export function busyTimeWithinWindow(tasks: Record<string, Task>, durationMs: number): number {
  return Object.values(tasks).reduce((sum, task) => {
    if (task.serviceStartTime === undefined) return sum
    const end = Math.min(task.completionTime ?? durationMs, durationMs)
    return end > task.serviceStartTime ? sum + (end - task.serviceStartTime) : sum
  }, 0)
}

export function averageQueueLengthWithinWindow(tasks: Record<string, Task>, durationMs: number): number {
  if (durationMs <= 0) return 0

  const waitingMs = Object.values(tasks).reduce((sum, task) => {
    const arrival = Math.min(Math.max(task.arrivalTime, 0), durationMs)
    const waitEnd = task.serviceStartTime === undefined
      ? durationMs
      : Math.min(task.serviceStartTime, durationMs)

    return waitEnd > arrival ? sum + (waitEnd - arrival) : sum
  }, 0)

  return waitingMs / durationMs
}

export function buildPhase1RunRecord({
  runConfig,
  calibrationResult,
  tasks,
  maxQueueLength,
  durationMs = PHASE1_RUN_DURATION_MS,
}: {
  runConfig: Phase1RunConfig
  calibrationResult: CalibrationResult
  tasks: Record<string, Task>
  maxQueueLength: number
  durationMs?: number
}): Phase1RunRecord {
  const completed = completedTasks(tasks)
  const allTasks = Object.values(tasks)
  const serviceTimes = completed.map(task => (task.completionTime ?? 0) - (task.serviceStartTime ?? 0))
  const responseTimes = completed.map(task => (task.completionTime ?? 0) - task.arrivalTime)
  const reactionTimes = completed
    .filter(task => task.firstKeystrokeTime !== undefined && task.serviceStartTime !== undefined)
    .map(task => task.firstKeystrokeTime! - task.serviceStartTime!)
  const typingSpeeds = completed
    .filter(task => task.serviceStartTime !== undefined && task.completionTime !== undefined)
    .map(observedInGameWpm)

  const averageServiceDemand = avg(serviceTimes)
  const referenceResponseTimeMs = runConfig.targetLoad < 1
    ? runConfig.serviceDemandMs / (1 - runConfig.targetLoad)
    : null

  return {
    id: `${runConfig.difficulty.key}-${runConfig.seed}`,
    difficultyKey: runConfig.difficulty.key,
    difficultyLabel: runConfig.difficulty.label,
    calibrationWpm: calibrationResult.rawWpm,
    calibrationRangeLabel: calibrationResult.wpmRange.label,
    calibrationBinIndex: calibrationResult.binIndex,
    targetLoad: runConfig.targetLoad,
    arrivalRate: runConfig.lambda,
    observedArrivalRate: durationMs > 0 ? allTasks.length / (durationMs / 1000) : 0,
    expectedArrivals: runConfig.expectedArrivals,
    arrivalCount: allTasks.length,
    completedCount: completed.length,
    throughputPerSecond: durationMs > 0 ? completed.length / (durationMs / 1000) : 0,
    averageResponseTime: avg(responseTimes),
    averageServiceDemand,
    averageTypingSpeed: avg(typingSpeeds),
    reactionSpeed: avg(reactionTimes),
    utilizationPercent: durationMs > 0 ? (busyTimeWithinWindow(tasks, durationMs) / durationMs) * 100 : 0,
    averageQueueLength: averageQueueLengthWithinWindow(tasks, durationMs),
    maxQueueLength,
    stillWaitingCount: allTasks.filter(task => task.status !== 'completed').length,
    durationMs,
    serviceDemandEstimateMs: runConfig.serviceDemandMs,
    referenceResponseTimeMs,
    seed: runConfig.seed,
  }
}

export function findPhase1DifficultyOption(
  options: readonly Phase1DifficultyOption[],
  key: Phase1DifficultyKey,
): Phase1DifficultyOption | undefined {
  return options.find(option => option.key === key)
}
