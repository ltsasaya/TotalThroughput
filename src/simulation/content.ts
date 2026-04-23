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

function pickWords(size: TaskSize): string {
  const [min, max] = WORD_COUNT_RANGE[size]
  const count = min + Math.floor(Math.random() * (max - min + 1))

  // Build a combined pool weighted toward the task's own size
  const pool: string[] = []
  if (size === 'S') {
    pool.push(...CONTENT_BY_SIZE.S, ...CONTENT_BY_SIZE.S)
  } else if (size === 'M') {
    pool.push(...CONTENT_BY_SIZE.S, ...CONTENT_BY_SIZE.M, ...CONTENT_BY_SIZE.M)
  } else {
    pool.push(...CONTENT_BY_SIZE.S, ...CONTENT_BY_SIZE.M, ...CONTENT_BY_SIZE.L, ...CONTENT_BY_SIZE.L)
  }

  const words: string[] = []
  for (let i = 0; i < count; i++) {
    words.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return words.join(' ')
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
