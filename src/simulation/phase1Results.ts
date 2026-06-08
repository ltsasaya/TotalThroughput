import type { Phase1LevelConfig } from '../types/game'
import type { Phase1LevelResult, Phase1Result } from '../types/metrics'
import type { Task } from '../types/task'
import { phase1LevelDurationMs } from './phase1Levels'

const FALLBACK_SERVICE_MS = 3_000
const MIN_AGGREGATE_COMPLETIONS = 8

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function weightedAvg(results: Phase1LevelResult[], key: keyof Phase1LevelResult): number {
  const totals = results.reduce(
    (acc, result) => {
      const value = result[key]
      if (typeof value !== 'number' || result.completedCount === 0) return acc
      acc.sum += value * result.completedCount
      acc.count += result.completedCount
      return acc
    },
    { sum: 0, count: 0 },
  )
  return totals.count > 0 ? totals.sum / totals.count : 0
}

export function buildPhase1LevelResult(
  level: Phase1LevelConfig,
  tasks: Record<string, Task>,
  maxQueueLength: number,
): Phase1LevelResult {
  const allTasks = Object.values(tasks)
  const completed = allTasks.filter(t => t.status === 'completed')
  const arrivalCount = allTasks.length
  const completedCount = completed.length
  const activeWindowCompletedCount = completed.filter(t => (t.completionTime ?? 0) <= level.arrivalWindowMs).length
  const tailCompletedCount = completedCount - activeWindowCompletedCount
  const backlogAtArrivalEndCount = allTasks.filter(
    t => t.arrivalTime <= level.arrivalWindowMs && (t.completionTime === undefined || t.completionTime > level.arrivalWindowMs),
  ).length
  const unfinishedAtEndCount = arrivalCount - completedCount
  const servedShare = arrivalCount > 0 ? completedCount / arrivalCount : 0

  const waitingTimes = completed.map(t => (t.serviceStartTime ?? t.arrivalTime) - t.arrivalTime)
  const serviceTimes = completed.map(t => (t.completionTime ?? 0) - (t.serviceStartTime ?? 0))
  const responseTimes = completed.map(t => (t.completionTime ?? 0) - t.arrivalTime)
  const reactionTimes = completed
    .filter(t => t.firstKeystrokeTime !== undefined && t.serviceStartTime !== undefined)
    .map(t => t.firstKeystrokeTime! - t.serviceStartTime!)
  const typingSpeeds = completed
    .filter(t => t.firstKeystrokeTime !== undefined && t.completionTime !== undefined)
    .map((t) => {
      const typingMs = t.completionTime! - t.firstKeystrokeTime!
      return typingMs > 0 ? ((t.content ?? '').length / 5) / (typingMs / 60_000) : 0
    })

  const avgServiceTime = avg(serviceTimes)
  const avgResponseTime = avg(responseTimes)
  const responseThresholdMs = avgServiceTime * level.responseThresholdMultiplier
  const passed = !level.isGate || (
    completedCount >= level.minCompletedSamples &&
    avgServiceTime > 0 &&
    avgResponseTime <= responseThresholdMs
  )

  return {
    levelId: level.levelId,
    label: level.label,
    regime: level.regime,
    lambda: level.lambda,
    referenceLoad: level.referenceLoad,
    isGate: level.isGate,
    isDemo: level.isDemo,
    passed,
    arrivalCount,
    completedCount,
    activeWindowCompletedCount,
    tailCompletedCount,
    backlogAtArrivalEndCount,
    unfinishedAtEndCount,
    servedShare,
    avgWaitingTime: avg(waitingTimes),
    avgServiceTime,
    avgResponseTime,
    avgReactionSpeed: avg(reactionTimes),
    avgTypingSpeed: avg(typingSpeeds),
    maxQueueLength,
    responseThresholdMs,
    arrivalWindowMs: level.arrivalWindowMs,
    drainTailMs: level.drainTailMs,
    durationMs: phase1LevelDurationMs(level),
  }
}

export function buildPhase1AggregateResult(levelResults: Phase1LevelResult[]): Phase1Result {
  const completedCount = levelResults.reduce((sum, result) => sum + result.completedCount, 0)
  const arrivalCount = levelResults.reduce((sum, result) => sum + result.arrivalCount, 0)
  const activeWindowCompletedCount = levelResults.reduce((sum, result) => sum + result.activeWindowCompletedCount, 0)
  const tailCompletedCount = levelResults.reduce((sum, result) => sum + result.tailCompletedCount, 0)
  const unfinishedAtEndCount = levelResults.reduce((sum, result) => sum + result.unfinishedAtEndCount, 0)
  const arrivalWindowMs = levelResults.reduce((sum, result) => sum + result.arrivalWindowMs, 0)
  const drainTailMs = levelResults.reduce((sum, result) => sum + result.drainTailMs, 0)
  const durationMs = levelResults.reduce((sum, result) => sum + result.durationMs, 0)
  const avgServiceTime = weightedAvg(levelResults, 'avgServiceTime') || FALLBACK_SERVICE_MS
  const avgResponseTime = weightedAvg(levelResults, 'avgResponseTime')
  const avgReactionSpeed = weightedAvg(levelResults, 'avgReactionSpeed')
  const avgTypingSpeed = weightedAvg(levelResults, 'avgTypingSpeed')
  const gatedResults = levelResults.filter(result => result.isGate)
  const gatesPassed = gatedResults.length > 0 && gatedResults.every(result => result.passed)
  const passed = gatesPassed && completedCount >= MIN_AGGREGATE_COMPLETIONS

  return {
    measuredTasksPerSecond: avgServiceTime > 0 ? 1000 / avgServiceTime : 0,
    avgServiceTime,
    avgResponseTime,
    arrivalRate: arrivalWindowMs > 0 ? arrivalCount / (arrivalWindowMs / 1000) : 0,
    arrivalCount,
    completedCount,
    activeWindowCompletedCount,
    tailCompletedCount,
    activeWindowThroughput: arrivalWindowMs > 0 ? activeWindowCompletedCount / (arrivalWindowMs / 1000) : 0,
    droppedCount: 0,
    unfinishedAtEndCount,
    servedShare: arrivalCount > 0 ? completedCount / arrivalCount : 0,
    avgReactionSpeed,
    avgTypingSpeed,
    passed,
    levelResults,
    arrivalWindowMs,
    drainTailMs,
    durationMs,
    failed: false,
  }
}
