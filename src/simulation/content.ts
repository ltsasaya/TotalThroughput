import type { Task, TaskSize } from '../types/task'

// Task content pools grouped by size.
// Words are systems/performance themed to reinforce learning.
const CONTENT_BY_SIZE: Record<TaskSize, string[]> = {
  S: [
    'queue', 'cache', 'flush', 'fork', 'spawn',
    'tick', 'rate', 'byte', 'core', 'load',
    'heap', 'pool', 'lock', 'pipe', 'swap',
    'slot', 'flag', 'poll', 'log', 'node',
  ],
  M: [
    'latency', 'service', 'dispatch', 'arrival', 'timeout',
    'process', 'preempt', 'context', 'migrate', 'segment',
    'starvation', 'blocking', 'handler', 'overflow',
  ],
  L: [
    'throughput', 'utilization', 'scheduling', 'parallelism',
    'bottleneck', 'performance', 'multicore', 'queueing',
    'concurrency', 'bandwidth', 'workstealing',
  ],
}

export const PHASE1_PROMPT_SIZE: TaskSize = 'M'

// Word count ranges per size: [min, max]
const WORD_COUNT_RANGE: Record<TaskSize, [number, number]> = {
  S: [2, 3],
  M: [3, 5],
  L: [5, 8],
}

// Deadline window: how long a task can sit in the queue before expiring.
// Flat across sizes so queue pressure depends on arrival tempo, not task length.
const DEADLINE_MS: Record<TaskSize, number> = {
  S: 20_000,
  M: 20_000,
  L: 20_000,
}

function poolForSize(size: TaskSize): string[] {
  if (size === 'S') return [...CONTENT_BY_SIZE.S, ...CONTENT_BY_SIZE.S]
  if (size === 'M') return [...CONTENT_BY_SIZE.S, ...CONTENT_BY_SIZE.M, ...CONTENT_BY_SIZE.M]
  return [...CONTENT_BY_SIZE.S, ...CONTENT_BY_SIZE.M, ...CONTENT_BY_SIZE.L, ...CONTENT_BY_SIZE.L]
}

function phase1PromptWordCount(size: TaskSize): number {
  const [min, max] = WORD_COUNT_RANGE[size]
  return Math.round((min + max) / 2)
}

function pickWords(size: TaskSize): string {
  const [min, max] = WORD_COUNT_RANGE[size]
  const count = min + Math.floor(Math.random() * (max - min + 1))
  const pool = poolForSize(size)

  const words: string[] = []
  for (let i = 0; i < count; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return words.join(' ')
}

function pickPhase1Words(contentSeed: number, size = PHASE1_PROMPT_SIZE): string {
  const pool = poolForSize(size)
  const count = phase1PromptWordCount(size)
  const words: string[] = []

  for (let i = 0; i < count; i++) {
    let idx = Math.abs((contentSeed * (17 + i * 14)) + 3 + i * 11) % pool.length
    let guard = 0
    while (words.includes(pool[idx]) && guard < pool.length) {
      idx = (idx + 1) % pool.length
      guard++
    }
    words.push(pool[idx])
  }

  return words.join(' ')
}

export function estimatePhase1PromptLength(size = PHASE1_PROMPT_SIZE): number {
  const pool = poolForSize(size)
  const count = phase1PromptWordCount(size)
  const totalChars = pool.reduce((sum, word) => sum + word.length, 0)
  const avgWordLength = totalChars / pool.length
  return Math.round((avgWordLength * count) + (count - 1))
}

// trueServiceDemand: pass calibrated ms value for Phase 2 cores; omit (0) for Phase 1.
// deadlineMultiplier: scales the deadline window (1.0 = standard, >1 = more time, <1 = tighter).
export function generateTask(size: TaskSize, arrivalTime: number, trueServiceDemand = 0, deadlineMultiplier = 1.0): Task {
  const content = pickWords(size)
  return {
    id: crypto.randomUUID(),
    arrivalTime,
    size,
    trueServiceDemand,
    deadline: arrivalTime + Math.round(DEADLINE_MS[size] * deadlineMultiplier),
    status: 'waiting',
    content,
    typedContent: '',
  }
}

export function generatePhase1Task(arrivalTime: number, contentSeed: number, size = PHASE1_PROMPT_SIZE): Task {
  return {
    id: crypto.randomUUID(),
    arrivalTime,
    size,
    trueServiceDemand: 0,
    status: 'waiting',
    content: pickPhase1Words(contentSeed, size),
    typedContent: '',
  }
}
