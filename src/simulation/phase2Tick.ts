import type { Task, TaskSize } from '../types/task'
import type { Core } from '../types/core'
import type { GameConfig, GamePhase } from '../types/game'
import type { LiveMetrics, RunSummary, Phase1Result, TimePoint, GradeLevel } from '../types/metrics'
import type { ScheduledArrival } from './arrival'
import { generateTask } from './content'

export interface Phase2TickInput {
  config: GameConfig
  tasks: Record<string, Task>
  queue: string[]
  cores: Core[]
  liveMetrics: LiveMetrics
  arrivalSchedule: ScheduledArrival[]
  nextArrivalIndex: number
  phaseElapsed: number
  phase1Result: Phase1Result | null
  coreBusyMs: number[]
  throughputHistory: TimePoint[]
  queueLengthHistory: TimePoint[]
  lastHistoryTick: number
  idleWasteMs: number
}

export interface Phase2TickOutput {
  phaseElapsed: number
  tasks: Record<string, Task>
  queue: string[]
  cores: Core[]
  nextArrivalIndex: number
  liveMetrics: LiveMetrics
  coreBusyMs: number[]
  throughputHistory: TimePoint[]
  queueLengthHistory: TimePoint[]
  lastHistoryTick: number
  idleWasteMs: number
  phase?: GamePhase
  runSummary?: RunSummary
}

// Service time multipliers relative to avg Phase 1 service time, by task size.
const SIZE_MULTIPLIER: Record<TaskSize, number> = { S: 0.7, M: 1.0, L: 1.5 }

// ---------------------------------------------------------------------------
// Grade helpers
// ---------------------------------------------------------------------------

function latencyGrade(waitRatio: number): GradeLevel {
  if (waitRatio < 0.5) return 'S'
  if (waitRatio < 1.0) return 'A'
  if (waitRatio < 2.0) return 'B'
  if (waitRatio < 4.0) return 'C'
  if (waitRatio < 8.0) return 'D'
  return 'F'
}

function utilizationGrade(avgUtil: number): GradeLevel {
  if (avgUtil > 0.90) return 'S'
  if (avgUtil > 0.80) return 'A'
  if (avgUtil > 0.65) return 'B'
  if (avgUtil > 0.50) return 'C'
  if (avgUtil > 0.35) return 'D'
  return 'F'
}

function throughputGrade(ratio: number): GradeLevel {
  if (ratio > 0.90) return 'S'
  if (ratio > 0.80) return 'A'
  if (ratio > 0.65) return 'B'
  if (ratio > 0.50) return 'C'
  if (ratio > 0.35) return 'D'
  return 'F'
}

function gradeToNum(g: GradeLevel): number {
  return ({ S: 5, A: 4, B: 3, C: 2, D: 1, F: 0 } as Record<GradeLevel, number>)[g]
}

function numToGrade(n: number): GradeLevel {
  if (n >= 4.5) return 'S'
  if (n >= 3.5) return 'A'
  if (n >= 2.5) return 'B'
  if (n >= 1.5) return 'C'
  if (n >= 0.5) return 'D'
  return 'F'
}

function efficiencyGrade(waitRatio: number, avgUtil: number, tpRatio: number): GradeLevel {
  const avg = (gradeToNum(latencyGrade(waitRatio)) + gradeToNum(utilizationGrade(avgUtil)) + gradeToNum(throughputGrade(tpRatio))) / 3
  return numToGrade(avg)
}

// ---------------------------------------------------------------------------
// Main tick
// ---------------------------------------------------------------------------

export function computePhase2Tick(state: Phase2TickInput, elapsed: number): Phase2TickOutput {
  const {
    config, tasks, queue, cores, liveMetrics, arrivalSchedule, nextArrivalIndex,
    phase1Result, coreBusyMs, throughputHistory, queueLengthHistory, lastHistoryTick, idleWasteMs,
  } = state

  const avgSvcTime = phase1Result?.avgServiceTime ?? 3_000

  // 1. Spawn arrivals
  let arrivalIdx = nextArrivalIndex
  const newTasks: Record<string, Task> = { ...tasks }
  const newQueue: string[] = [...queue]

  while (arrivalIdx < arrivalSchedule.length && arrivalSchedule[arrivalIdx].arrivalTime <= elapsed) {
    const arrival = arrivalSchedule[arrivalIdx]
    const svcTime = avgSvcTime * SIZE_MULTIPLIER[arrival.size]
    const task = generateTask(arrival.size, arrival.arrivalTime, svcTime)
    newTasks[task.id] = task
    newQueue.push(task.id)
    arrivalIdx++
  }

  // 2. Advance cores and complete finished tasks
  const newCores: Core[] = cores.map(c => ({ ...c }))
  const newCoreBusyMs = [...coreBusyMs]

  for (const core of newCores) {
    if (core.status !== 'busy' || !core.currentTaskId) continue
    const task = newTasks[core.currentTaskId]
    if (!task || task.serviceStartTime === undefined) continue

    const elapsedOnTask = elapsed - task.serviceStartTime
    core.progress = Math.min(elapsedOnTask / task.trueServiceDemand, 1)

    if (elapsedOnTask >= task.trueServiceDemand) {
      const completionTime = task.serviceStartTime + task.trueServiceDemand
      newTasks[core.currentTaskId] = { ...task, status: 'completed', completionTime }
      newCoreBusyMs[core.id] += task.trueServiceDemand
      core.status = 'idle'
      core.currentTaskId = null
      core.progress = 0
      core.completedTaskCount++
      delete core.busySince
    }
  }

  // 3. Expire queued tasks past deadline
  const expiredIds = new Set<string>()
  for (const taskId of newQueue) {
    const task = newTasks[taskId]
    if (task.deadline !== undefined && elapsed > task.deadline) {
      newTasks[taskId] = { ...task, status: 'expired' }
      expiredIds.add(taskId)
    }
  }
  const filteredQueue = newQueue.filter(id => !expiredIds.has(id))

  // 4. Track idle waste: core-idle-ms when queue is non-empty
  const tickDuration = Math.max(0, elapsed - state.phaseElapsed)
  let newIdleWasteMs = idleWasteMs
  if (filteredQueue.length > 0) {
    const idleCount = newCores.filter(c => c.status === 'idle').length
    newIdleWasteMs += idleCount * tickDuration
  }

  // 5. Compute live metrics
  const allTasks = Object.values(newTasks)
  const completedArr = allTasks.filter(t => t.status === 'completed')
  const droppedCount = allTasks.filter(t => t.status === 'expired' || t.status === 'dropped').length
  const completedCount = completedArr.length
  const throughput = elapsed > 0 ? completedCount / (elapsed / 1000) : 0

  const avgWaitingTime = completedCount > 0
    ? completedArr.reduce((s, t) => s + (t.serviceStartTime! - t.arrivalTime), 0) / completedCount
    : 0
  const avgServiceTime = completedCount > 0
    ? completedArr.reduce((s, t) => s + (t.completionTime! - t.serviceStartTime!), 0) / completedCount
    : avgSvcTime

  const perCoreUtilization = newCores.map((core, i) => {
    const ongoingMs = core.status === 'busy' && core.currentTaskId
      ? elapsed - (newTasks[core.currentTaskId]?.serviceStartTime ?? elapsed)
      : 0
    return elapsed > 0 ? (newCoreBusyMs[i] + ongoingMs) / elapsed : 0
  })

  const idealThroughput = newCores.length * 1000 / avgSvcTime

  const newMetrics: LiveMetrics = {
    ...liveMetrics,
    throughput,
    queueLength: filteredQueue.length,
    avgWaitingTime,
    avgResponseTime: avgWaitingTime + avgServiceTime,
    avgServiceTime,
    completedCount,
    droppedCount,
    perCoreUtilization,
    idealThroughput,
    actualThroughput: throughput,
  }

  // 6. Record history every 1000ms
  const newThroughputHistory = [...throughputHistory]
  const newQueueLengthHistory = [...queueLengthHistory]
  let newLastHistoryTick = lastHistoryTick

  if (elapsed - lastHistoryTick >= 1_000) {
    newThroughputHistory.push({ time: elapsed, value: throughput })
    newQueueLengthHistory.push({ time: elapsed, value: filteredQueue.length })
    newLastHistoryTick = elapsed
  }

  // 7. Check failure / phase-end
  const failed = droppedCount > config.dropLimit || filteredQueue.length > config.queueSizeLimit
  const phaseEnded = elapsed >= config.phase2Duration || failed

  const output: Phase2TickOutput = {
    phaseElapsed: elapsed,
    tasks: newTasks,
    queue: filteredQueue,
    cores: newCores,
    nextArrivalIndex: arrivalIdx,
    liveMetrics: newMetrics,
    coreBusyMs: newCoreBusyMs,
    throughputHistory: newThroughputHistory,
    queueLengthHistory: newQueueLengthHistory,
    lastHistoryTick: newLastHistoryTick,
    idleWasteMs: newIdleWasteMs,
  }

  if (!phaseEnded) return output

  // 8. Build RunSummary
  const finalCoreBusyMs = [...newCoreBusyMs]
  newCores.forEach((core, i) => {
    if (core.status === 'busy' && core.currentTaskId) {
      const task = newTasks[core.currentTaskId]
      if (task?.serviceStartTime !== undefined) {
        finalCoreBusyMs[i] += elapsed - task.serviceStartTime
      }
    }
  })

  // Convert any task still unfinished (queued, assigned, running) to dropped so the
  // final summary accounts for every task that entered the run.
  for (const task of Object.values(newTasks)) {
    if (task.status === 'waiting' || task.status === 'assigned' || task.status === 'running') {
      newTasks[task.id] = { ...task, status: 'dropped' }
    }
  }

  const finalCompleted = Object.values(newTasks).filter(t => t.status === 'completed')
  const finalDropped = Object.values(newTasks).filter(t => t.status === 'expired' || t.status === 'dropped')

  const finalAvgWaiting = finalCompleted.length > 0
    ? finalCompleted.reduce((s, t) => s + (t.serviceStartTime! - t.arrivalTime), 0) / finalCompleted.length
    : 0
  const maxWaiting = finalCompleted.length > 0
    ? Math.max(...finalCompleted.map(t => t.serviceStartTime! - t.arrivalTime))
    : 0
  const finalAvgSvc = finalCompleted.length > 0
    ? finalCompleted.reduce((s, t) => s + (t.completionTime! - t.serviceStartTime!), 0) / finalCompleted.length
    : avgSvcTime
  const maxResponse = finalCompleted.length > 0
    ? Math.max(...finalCompleted.map(t => t.completionTime! - t.arrivalTime))
    : 0

  const finalPerCoreUtil = finalCoreBusyMs.map(ms => elapsed > 0 ? ms / elapsed : 0)
  const avgUtil = finalPerCoreUtil.length > 0
    ? finalPerCoreUtil.reduce((s, u) => s + u, 0) / finalPerCoreUtil.length : 0
  const finalActualTP = elapsed > 0 ? finalCompleted.length / (elapsed / 1000) : 0
  const finalIdealTP = newCores.length * 1000 / avgSvcTime

  const baseScore = finalCompleted.length * 10
  const waitingPenalty = (finalAvgWaiting / 1000) * finalCompleted.length * 0.5
  const idlePenalty = newIdleWasteMs / 10_000
  const score = Math.max(0, Math.round(baseScore - waitingPenalty - idlePenalty))

  const waitRatio = finalAvgSvc > 0 ? finalAvgWaiting / finalAvgSvc : 0
  const tpRatio = finalIdealTP > 0 ? finalActualTP / finalIdealTP : 0

  const runSummary: RunSummary = {
    completedTasks: finalCompleted.length,
    droppedTasks: finalDropped.length,
    avgWaitingTime: finalAvgWaiting,
    maxWaitingTime: maxWaiting,
    avgResponseTime: finalAvgWaiting + finalAvgSvc,
    maxResponseTime: maxResponse,
    avgServiceTime: finalAvgSvc,
    perCoreUtilization: finalPerCoreUtil,
    throughputHistory: newThroughputHistory,
    queueLengthHistory: newQueueLengthHistory,
    idealThroughput: finalIdealTP,
    actualThroughput: finalActualTP,
    score,
    latencyGrade: latencyGrade(waitRatio),
    utilizationGrade: utilizationGrade(avgUtil),
    throughputGrade: throughputGrade(tpRatio),
    efficiencyGrade: efficiencyGrade(waitRatio, avgUtil, tpRatio),
    failed,
    survivedMs: elapsed,
    idleWasteMs: newIdleWasteMs,
  }

  output.phase = 'postrun'
  output.runSummary = runSummary
  output.coreBusyMs = finalCoreBusyMs
  return output
}
