export interface ServerLabInputs {
  serviceDemandSeconds: number
  arrivalRatePerSecond: number
  concurrency: number
  durationSeconds: number
  seed: number
}

export interface ServerLabJob {
  id: number
  arrivalTime: number
  serviceStartTime: number
  completionTime: number
  serviceTime: number
  workerIndex: number
}

export interface ServerLabSample {
  time: number
  systemCount: number
  queueLength: number
  responseTime: number | null
  utilization: number
  arrivalRate: number
  throughput: number
}

export interface ServerLabSteadyState {
  stable: boolean
  offeredLoad: number
  utilization: number
  waitProbability: number | null
  averageWaitingTime: number | null
  responseTime: number | null
  systemCount: number | null
  queueLength: number | null
}

export interface ServerLabSummary {
  arrivals: number
  completedWithinWindow: number
  averageResponseTime: number | null
  averageQueueLength: number
  averageSystemCount: number
  averageUtilization: number
  observedArrivalRate: number
  observedThroughput: number
}

export interface ServerLabRun {
  inputs: ServerLabInputs
  jobs: ServerLabJob[]
  samples: ServerLabSample[]
  displaySampleCount: number
  summary: ServerLabSummary
  steadyState: ServerLabSteadyState
}

export const SERVER_LAB_LIMITS = {
  minServiceDemandSeconds: 0.05,
  maxServiceDemandSeconds: 30,
  minArrivalRatePerSecond: 0.01,
  maxArrivalRatePerSecond: 20,
  minConcurrency: 1,
  maxConcurrency: 64,
  minDurationSeconds: 5,
  maxDurationSeconds: 3_600,
  maxExpectedArrivals: 50_000,
  minDisplaySamples: 60,
  maxDisplaySamples: 240,
}

interface ServerLabSimulationOptions {
  includeSamples?: boolean
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

function sampleExponentialSeconds(random: () => number, meanSeconds: number): number {
  const u = Math.max(Number.MIN_VALUE, 1 - random())
  return -Math.log(u) * meanSeconds
}

function assertFiniteRange(value: number, min: number, max: number, label: string) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${label} must be between ${min} and ${max}`)
  }
}

export function normalizeServerLabInputs(inputs: ServerLabInputs): ServerLabInputs {
  assertFiniteRange(
    inputs.serviceDemandSeconds,
    SERVER_LAB_LIMITS.minServiceDemandSeconds,
    SERVER_LAB_LIMITS.maxServiceDemandSeconds,
    'Service demand D',
  )
  assertFiniteRange(
    inputs.arrivalRatePerSecond,
    SERVER_LAB_LIMITS.minArrivalRatePerSecond,
    SERVER_LAB_LIMITS.maxArrivalRatePerSecond,
    'Arrival rate lambda',
  )
  assertFiniteRange(
    inputs.durationSeconds,
    SERVER_LAB_LIMITS.minDurationSeconds,
    SERVER_LAB_LIMITS.maxDurationSeconds,
    'Time t',
  )
  assertFiniteRange(
    inputs.concurrency,
    SERVER_LAB_LIMITS.minConcurrency,
    SERVER_LAB_LIMITS.maxConcurrency,
    'Concurrency c',
  )

  const concurrency = Math.round(inputs.concurrency)
  if (Math.abs(concurrency - inputs.concurrency) > 0.0001) {
    throw new RangeError('Concurrency c must be a whole number')
  }

  const expectedArrivals = inputs.arrivalRatePerSecond * inputs.durationSeconds
  if (expectedArrivals > SERVER_LAB_LIMITS.maxExpectedArrivals) {
    throw new RangeError(`Expected arrivals must be ${SERVER_LAB_LIMITS.maxExpectedArrivals} or fewer`)
  }

  return {
    serviceDemandSeconds: inputs.serviceDemandSeconds,
    arrivalRatePerSecond: inputs.arrivalRatePerSecond,
    concurrency,
    durationSeconds: inputs.durationSeconds,
    seed: inputs.seed >>> 0,
  }
}

export function computeMmCSteadyState({
  serviceDemandSeconds,
  arrivalRatePerSecond,
  concurrency,
}: Pick<ServerLabInputs, 'serviceDemandSeconds' | 'arrivalRatePerSecond' | 'concurrency'>): ServerLabSteadyState {
  const offeredLoad = arrivalRatePerSecond * serviceDemandSeconds
  const utilization = offeredLoad / concurrency

  if (utilization >= 1) {
    return {
      stable: false,
      offeredLoad,
      utilization,
      waitProbability: null,
      averageWaitingTime: null,
      responseTime: null,
      systemCount: null,
      queueLength: null,
    }
  }

  let term = 1
  let sum = 1
  for (let n = 1; n < concurrency; n++) {
    term *= offeredLoad / n
    sum += term
  }

  const cTerm = term * (offeredLoad / concurrency)
  const waitTerm = cTerm / (1 - utilization)
  const waitProbability = waitTerm / (sum + waitTerm)
  const averageWaitingTime = waitProbability * serviceDemandSeconds / (concurrency * (1 - utilization))
  const responseTime = serviceDemandSeconds + averageWaitingTime
  const queueLength = arrivalRatePerSecond * averageWaitingTime
  const systemCount = arrivalRatePerSecond * responseTime

  return {
    stable: true,
    offeredLoad,
    utilization,
    waitProbability,
    averageWaitingTime,
    responseTime,
    systemCount,
    queueLength,
  }
}

function minWorkerIndex(workerAvailableAt: number[]): number {
  let minIndex = 0
  for (let i = 1; i < workerAvailableAt.length; i++) {
    if (workerAvailableAt[i] < workerAvailableAt[minIndex]) minIndex = i
  }
  return minIndex
}

function overlapSeconds(start: number, end: number, windowEnd: number): number {
  const boundedEnd = Math.min(end, windowEnd)
  return boundedEnd > start ? boundedEnd - start : 0
}

export function runServerLabSimulation(
  rawInputs: ServerLabInputs,
  options: ServerLabSimulationOptions = {},
): ServerLabRun {
  const inputs = normalizeServerLabInputs(rawInputs)
  const includeSamples = options.includeSamples ?? true
  const arrivalRandom = createSeededRandom(inputs.seed)
  const serviceRandom = createSeededRandom(inputs.seed ^ 0x9e37_79b9)
  const workerAvailableAt = Array<number>(inputs.concurrency).fill(0)
  const jobs: ServerLabJob[] = []
  let arrivalTime = 0

  while (true) {
    arrivalTime += sampleExponentialSeconds(arrivalRandom, 1 / inputs.arrivalRatePerSecond)
    if (arrivalTime >= inputs.durationSeconds) break

    const workerIndex = minWorkerIndex(workerAvailableAt)
    const serviceTime = sampleExponentialSeconds(serviceRandom, inputs.serviceDemandSeconds)
    const serviceStartTime = Math.max(arrivalTime, workerAvailableAt[workerIndex])
    const completionTime = serviceStartTime + serviceTime
    workerAvailableAt[workerIndex] = completionTime
    jobs.push({
      id: jobs.length + 1,
      arrivalTime,
      serviceStartTime,
      completionTime,
      serviceTime,
      workerIndex,
    })
  }

  const sampleCount = includeSamples
    ? Math.min(
      SERVER_LAB_LIMITS.maxDisplaySamples,
      Math.max(SERVER_LAB_LIMITS.minDisplaySamples, Math.ceil(inputs.durationSeconds * 2)),
    )
    : 0
  const samples: ServerLabSample[] = []
  for (let i = 0; i < sampleCount; i++) {
    const time = (i / (sampleCount - 1)) * inputs.durationSeconds
    const arrived = jobs.filter(job => job.arrivalTime <= time)
    const completed = jobs.filter(job => job.completionTime <= time)
    const responseTime = completed.length > 0
      ? completed.reduce((sum, job) => sum + (job.completionTime - job.arrivalTime), 0) / completed.length
      : null
    const busySeconds = jobs.reduce((sum, job) => sum + overlapSeconds(job.serviceStartTime, job.completionTime, time), 0)

    samples.push({
      time,
      systemCount: jobs.filter(job => job.arrivalTime <= time && job.completionTime > time).length,
      queueLength: jobs.filter(job => job.arrivalTime <= time && job.serviceStartTime > time).length,
      responseTime,
      utilization: time > 0 ? busySeconds / (inputs.concurrency * time) : 0,
      arrivalRate: time > 0 ? arrived.length / time : 0,
      throughput: time > 0 ? completed.length / time : 0,
    })
  }

  const completedWithinWindow = jobs.filter(job => job.completionTime <= inputs.durationSeconds)
  const averageResponseTime = completedWithinWindow.length > 0
    ? completedWithinWindow.reduce((sum, job) => sum + (job.completionTime - job.arrivalTime), 0) / completedWithinWindow.length
    : null
  const queueAreaSeconds = jobs.reduce((sum, job) => {
    return sum + overlapSeconds(job.arrivalTime, job.serviceStartTime, inputs.durationSeconds)
  }, 0)
  const systemAreaSeconds = jobs.reduce((sum, job) => {
    return sum + overlapSeconds(job.arrivalTime, job.completionTime, inputs.durationSeconds)
  }, 0)
  const busySeconds = jobs.reduce((sum, job) => {
    return sum + overlapSeconds(job.serviceStartTime, job.completionTime, inputs.durationSeconds)
  }, 0)
  const averageQueueLength = queueAreaSeconds / inputs.durationSeconds
  const averageSystemCount = systemAreaSeconds / inputs.durationSeconds
  const averageUtilization = busySeconds / (inputs.concurrency * inputs.durationSeconds)

  return {
    inputs,
    jobs,
    samples,
    displaySampleCount: samples.length,
    summary: {
      arrivals: jobs.length,
      completedWithinWindow: completedWithinWindow.length,
      averageResponseTime,
      averageQueueLength,
      averageSystemCount,
      averageUtilization,
      observedArrivalRate: jobs.length / inputs.durationSeconds,
      observedThroughput: completedWithinWindow.length / inputs.durationSeconds,
    },
    steadyState: computeMmCSteadyState(inputs),
  }
}
