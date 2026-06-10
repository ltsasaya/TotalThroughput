import type { Phase1RunConfig } from '../types/game'
import type { LiveMetrics } from '../types/metrics'
import type { Task } from '../types/task'
import type { ScheduledArrival } from './arrival'
import { generatePhase1Task } from './content'
import { busyTimeWithinWindow, PHASE1_RUN_DURATION_MS } from './phase1Runs'

export interface Phase1RunTickInput {
  tasks: Record<string, Task>
  queue: string[]
  activePhase1TaskId: string | null
  liveMetrics: LiveMetrics
  arrivalSchedule: ScheduledArrival[]
  nextArrivalIndex: number
  phase1MaxQueueLength: number
  phase1RunConfig: Phase1RunConfig
}

export interface Phase1RunTickOutput {
  phaseElapsed: number
  tasks: Record<string, Task>
  queue: string[]
  activePhase1TaskId: string | null
  nextArrivalIndex: number
  liveMetrics: LiveMetrics
  phase1MaxQueueLength: number
  runEnded?: boolean
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function computePhase1RunTick(state: Phase1RunTickInput, elapsed: number): Phase1RunTickOutput {
  const {
    tasks,
    queue,
    activePhase1TaskId,
    liveMetrics,
    arrivalSchedule,
    nextArrivalIndex,
    phase1MaxQueueLength,
    phase1RunConfig,
  } = state

  let arrivalIdx = nextArrivalIndex
  const newTasks: Record<string, Task> = { ...tasks }
  const newQueue: string[] = [...queue]

  while (arrivalIdx < arrivalSchedule.length && arrivalSchedule[arrivalIdx].arrivalTime <= elapsed) {
    const arrival = arrivalSchedule[arrivalIdx]
    const task = generatePhase1Task(arrival.arrivalTime, phase1RunConfig.seed + arrivalIdx, arrival.size)
    newTasks[task.id] = task
    newQueue.push(task.id)
    arrivalIdx++
  }

  let newActiveId = activePhase1TaskId
  if (!newActiveId && newQueue.length > 0) {
    newActiveId = newQueue.shift()!
    newTasks[newActiveId] = { ...newTasks[newActiveId], status: 'active', serviceStartTime: elapsed }
  }

  const allTasks = Object.values(newTasks)
  const completedTasks = allTasks.filter(task => task.status === 'completed')
  const completedCount = completedTasks.length
  const throughput = elapsed > 0 ? completedCount / (elapsed / 1000) : 0

  let avgWaitingTime = liveMetrics.avgWaitingTime
  let avgServiceTime = liveMetrics.avgServiceTime
  let avgReactionSpeed = liveMetrics.avgReactionSpeed ?? 0
  let avgTypingSpeed = liveMetrics.avgTypingSpeed ?? 0

  if (completedCount > 0) {
    avgWaitingTime = avg(completedTasks.map(task => (task.serviceStartTime ?? task.arrivalTime) - task.arrivalTime))
    avgServiceTime = avg(completedTasks.map(task => (task.completionTime ?? 0) - (task.serviceStartTime ?? 0)))

    const tasksWithKeystroke = completedTasks.filter(
      task => task.firstKeystrokeTime !== undefined && task.serviceStartTime !== undefined,
    )
    avgReactionSpeed = avg(tasksWithKeystroke.map(task => task.firstKeystrokeTime! - task.serviceStartTime!))
    avgTypingSpeed = avg(tasksWithKeystroke
      .filter(task => task.completionTime !== undefined)
      .map((task) => {
        const typingMs = task.completionTime! - task.firstKeystrokeTime!
        return typingMs > 0 ? ((task.content ?? '').length / 5) / (typingMs / 60_000) : 0
      }))
  }

  const boundedElapsed = Math.min(elapsed, PHASE1_RUN_DURATION_MS)
  const utilization = boundedElapsed > 0 ? busyTimeWithinWindow(newTasks, boundedElapsed) / boundedElapsed : 0
  const newMaxQueueLength = Math.max(phase1MaxQueueLength, newQueue.length)

  return {
    phaseElapsed: boundedElapsed,
    tasks: newTasks,
    queue: newQueue,
    activePhase1TaskId: newActiveId,
    nextArrivalIndex: arrivalIdx,
    phase1MaxQueueLength: newMaxQueueLength,
    liveMetrics: {
      ...liveMetrics,
      throughput,
      queueLength: newQueue.length,
      avgWaitingTime,
      avgResponseTime: avgWaitingTime + avgServiceTime,
      avgServiceTime,
      perCoreUtilization: [utilization],
      droppedCount: 0,
      completedCount,
      actualThroughput: throughput,
      idealThroughput: phase1RunConfig.lambda,
      arrivalRate: phase1RunConfig.lambda,
      targetPerWorkerLoad: phase1RunConfig.targetLoad,
      avgReactionSpeed,
      avgTypingSpeed,
    },
    runEnded: elapsed >= PHASE1_RUN_DURATION_MS,
  }
}
