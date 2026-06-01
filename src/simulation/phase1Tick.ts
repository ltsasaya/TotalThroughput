import type { Task } from '../types/task'
import type { GameConfig, Phase1LevelConfig } from '../types/game'
import type { LiveMetrics } from '../types/metrics'
import type { ScheduledArrival } from './arrival'
import { generatePhase1Task } from './content'
import { phase1LevelDurationMs } from './phase1Levels'

export interface Phase1TickInput {
  config: GameConfig
  tasks: Record<string, Task>
  queue: string[]
  activePhase1TaskId: string | null
  liveMetrics: LiveMetrics
  arrivalSchedule: ScheduledArrival[]
  nextArrivalIndex: number
  phaseElapsed: number
  currentPhase1Level: Phase1LevelConfig
  phase1MaxQueueLength: number
}

export interface Phase1TickOutput {
  phaseElapsed: number
  tasks: Record<string, Task>
  queue: string[]
  activePhase1TaskId: string | null
  nextArrivalIndex: number
  liveMetrics: LiveMetrics
  phase1MaxQueueLength: number
  levelEnded?: boolean
}

export function computePhase1Tick(state: Phase1TickInput, elapsed: number): Phase1TickOutput {
  const {
    tasks,
    queue,
    activePhase1TaskId,
    liveMetrics,
    arrivalSchedule,
    nextArrivalIndex,
    currentPhase1Level,
    phase1MaxQueueLength,
  } = state

  // 1. Spawn tasks whose scheduled arrival time has elapsed
  let arrivalIdx = nextArrivalIndex
  const newTasks: Record<string, Task> = { ...tasks }
  const newQueue: string[] = [...queue]

  while (arrivalIdx < arrivalSchedule.length && arrivalSchedule[arrivalIdx].arrivalTime <= elapsed) {
    const arrival = arrivalSchedule[arrivalIdx]
    const task = generatePhase1Task(arrival.arrivalTime, currentPhase1Level.seed + arrivalIdx)
    newTasks[task.id] = task
    newQueue.push(task.id)
    arrivalIdx++
  }

  // 2. Activate the next waiting task if the player has nothing to type.
  let newActiveId = activePhase1TaskId
  if (!newActiveId && newQueue.length > 0) {
    newActiveId = newQueue.shift()!
    newTasks[newActiveId] = { ...newTasks[newActiveId], status: 'active', serviceStartTime: elapsed }
  }

  // 3. Compute live metrics
  const allTasks = Object.values(newTasks)
  const completedTasks = allTasks.filter(t => t.status === 'completed')
  const completedCount = completedTasks.length
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
    queueLength: newQueue.length,
    avgWaitingTime,
    avgResponseTime: avgWaitingTime + avgServiceTime,
    avgServiceTime,
    avgReactionSpeed,
    avgTypingSpeed,
    completedCount,
    droppedCount: 0,
    actualThroughput: throughput,
    idealThroughput: currentPhase1Level.lambda,
  }

  return {
    phaseElapsed: elapsed,
    tasks: newTasks,
    queue: newQueue,
    activePhase1TaskId: newActiveId,
    nextArrivalIndex: arrivalIdx,
    liveMetrics: newMetrics,
    phase1MaxQueueLength: Math.max(phase1MaxQueueLength, newQueue.length),
    levelEnded: elapsed >= phase1LevelDurationMs(currentPhase1Level),
  }
}
