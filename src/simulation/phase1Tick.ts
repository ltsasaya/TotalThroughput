import type { Task } from '../types/task'
import type { GameConfig, GamePhase } from '../types/game'
import type { LiveMetrics, Phase1Result } from '../types/metrics'
import type { ScheduledArrival } from './arrival'
import { generateTask } from './content'

export interface Phase1TickInput {
  config: GameConfig
  tasks: Record<string, Task>
  queue: string[]
  activePhase1TaskId: string | null
  liveMetrics: LiveMetrics
  arrivalSchedule: ScheduledArrival[]
  nextArrivalIndex: number
  phaseElapsed: number
}

export interface Phase1TickOutput {
  phaseElapsed: number
  tasks: Record<string, Task>
  queue: string[]
  activePhase1TaskId: string | null
  nextArrivalIndex: number
  liveMetrics: LiveMetrics
  phase?: GamePhase
  phase1Result?: Phase1Result
}

export function computePhase1Tick(state: Phase1TickInput, elapsed: number): Phase1TickOutput {
  const { config, tasks, queue, activePhase1TaskId, liveMetrics, arrivalSchedule, nextArrivalIndex } = state

  // 1. Spawn tasks whose scheduled arrival time has elapsed
  let arrivalIdx = nextArrivalIndex
  const newTasks: Record<string, Task> = { ...tasks }
  const newQueue: string[] = [...queue]

  while (arrivalIdx < arrivalSchedule.length && arrivalSchedule[arrivalIdx].arrivalTime <= elapsed) {
    const arrival = arrivalSchedule[arrivalIdx]
    const task = generateTask(arrival.size, arrival.arrivalTime, 0, config.deadlineMultiplier)
    newTasks[task.id] = task
    newQueue.push(task.id)
    arrivalIdx++
  }

  // 2. Activate the next waiting task if the player has nothing to type (skip expired)
  let newActiveId = activePhase1TaskId
  if (!newActiveId) {
    while (newQueue.length > 0) {
      const candidateId = newQueue[0]
      const candidate = newTasks[candidateId]
      if (candidate.deadline !== undefined && elapsed > candidate.deadline) {
        newQueue.shift()
        newTasks[candidateId] = { ...candidate, status: 'expired' }
      } else {
        newActiveId = newQueue.shift()!
        newTasks[newActiveId] = { ...newTasks[newActiveId], status: 'active', serviceStartTime: elapsed }
        break
      }
    }
  }

  // 3. Expire waiting tasks past their deadline
  const expiredIds = new Set<string>()
  for (const taskId of newQueue) {
    const task = newTasks[taskId]
    if (task.deadline !== undefined && elapsed > task.deadline) {
      newTasks[taskId] = { ...task, status: 'expired' }
      expiredIds.add(taskId)
    }
  }
  const filteredQueue = newQueue.filter(id => !expiredIds.has(id))

  // 4. Compute live metrics
  const allTasks = Object.values(newTasks)
  const completedTasks = allTasks.filter(t => t.status === 'completed')
  const completedCount = completedTasks.length
  const droppedCount = allTasks.filter(t => t.status === 'expired' || t.status === 'dropped').length
  const throughput = elapsed > 0 ? completedCount / (elapsed / 1000) : 0

  let avgWaitingTime = liveMetrics.avgWaitingTime
  let avgServiceTime = liveMetrics.avgServiceTime
  let avgReactionSpeed = liveMetrics.avgReactionSpeed ?? 0
  let avgTypingSpeed = liveMetrics.avgTypingSpeed ?? 0

  if (completedCount > 0) {
    avgWaitingTime =
      completedTasks.reduce((s, t) => s + (t.serviceStartTime! - t.arrivalTime), 0) / completedCount
    avgServiceTime =
      completedTasks.reduce((s, t) => s + (t.completionTime! - t.serviceStartTime!), 0) / completedCount

    const tasksWithKeystroke = completedTasks.filter(
      t => t.firstKeystrokeTime !== undefined && t.serviceStartTime !== undefined,
    )
    if (tasksWithKeystroke.length > 0) {
      avgReactionSpeed =
        tasksWithKeystroke.reduce((s, t) => s + (t.firstKeystrokeTime! - t.serviceStartTime!), 0) /
        tasksWithKeystroke.length
      const tasksWithTyping = tasksWithKeystroke.filter(t => t.completionTime !== undefined)
      if (tasksWithTyping.length > 0) {
        avgTypingSpeed =
          tasksWithTyping.reduce((s, t) => {
            const chars = (t.content ?? '').length
            const typingMs = t.completionTime! - t.firstKeystrokeTime!
            return s + (typingMs > 0 ? (chars / 5) / (typingMs / 60_000) : 0)
          }, 0) / tasksWithTyping.length
      }
    }
  }

  const newMetrics: LiveMetrics = {
    ...liveMetrics,
    throughput,
    queueLength: filteredQueue.length,
    avgWaitingTime,
    avgResponseTime: avgWaitingTime + avgServiceTime,
    avgServiceTime,
    avgReactionSpeed,
    avgTypingSpeed,
    completedCount,
    droppedCount,
    actualThroughput: throughput,
    idealThroughput: throughput,
  }

  // 5. Check failure and phase-end conditions
  const failedRun = droppedCount > config.dropLimit || filteredQueue.length > config.queueSizeLimit
  const phaseEnded = elapsed >= config.phase1Duration || failedRun

  const output: Phase1TickOutput = {
    phaseElapsed: elapsed,
    tasks: newTasks,
    queue: filteredQueue,
    activePhase1TaskId: newActiveId,
    nextArrivalIndex: arrivalIdx,
    liveMetrics: newMetrics,
  }

  if (phaseEnded) {
    // Convert anything still unfinished (queued or in-progress) to dropped so the
    // final summary accounts for every task that entered the run.
    for (const task of Object.values(newTasks)) {
      if (task.status === 'waiting' || task.status === 'active') {
        newTasks[task.id] = { ...task, status: 'dropped' }
      }
    }
    const completedFinal = Object.values(newTasks).filter(t => t.status === 'completed')
    const droppedFinal = Object.values(newTasks).filter(
      t => t.status === 'expired' || t.status === 'dropped',
    )
    const totalServiceMs = completedFinal.reduce(
      (s, t) => s + (t.completionTime! - t.serviceStartTime!),
      0,
    )
    const avgSvcTime = completedFinal.length > 0 ? totalServiceMs / completedFinal.length : 3_000

    const totalResponseMs = completedFinal.reduce(
      (s, t) => s + (t.completionTime! - t.arrivalTime),
      0,
    )
    const avgResponseTimeFinal = completedFinal.length > 0 ? totalResponseMs / completedFinal.length : 0

    const tasksWithKeystrokeFinal = completedFinal.filter(
      t => t.firstKeystrokeTime !== undefined && t.serviceStartTime !== undefined,
    )
    let avgReactionSpeedFinal = 0
    let avgTypingSpeedFinal = 0

    if (tasksWithKeystrokeFinal.length > 0) {
      avgReactionSpeedFinal =
        tasksWithKeystrokeFinal.reduce((s, t) => s + (t.firstKeystrokeTime! - t.serviceStartTime!), 0) /
        tasksWithKeystrokeFinal.length
      const tasksWithTypingFinal = tasksWithKeystrokeFinal.filter(t => t.completionTime !== undefined)
      if (tasksWithTypingFinal.length > 0) {
        avgTypingSpeedFinal =
          tasksWithTypingFinal.reduce((s, t) => {
            const chars = (t.content ?? '').length
            const typingMs = t.completionTime! - t.firstKeystrokeTime!
            return s + (typingMs > 0 ? (chars / 5) / (typingMs / 60_000) : 0)
          }, 0) / tasksWithTypingFinal.length
      }
    }

    output.phase = 'postrun'
    output.phase1Result = {
      measuredTasksPerSecond: elapsed > 0 ? completedFinal.length / (elapsed / 1000) : 0,
      avgServiceTime: avgSvcTime,
      avgResponseTime: avgResponseTimeFinal,
      completedCount: completedFinal.length,
      droppedCount: droppedFinal.length,
      avgReactionSpeed: avgReactionSpeedFinal,
      avgTypingSpeed: avgTypingSpeedFinal,
      failed: failedRun,
    }
  }

  return output
}
