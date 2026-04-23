export interface GlossaryEntry {
  symbol: string
  name: string
  formula?: string
  definition: string
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    symbol: 'D',
    name: 'Service Demand',
    definition: 'How long a request occupies the server. In this game: your typing time per task.',
  },
  {
    symbol: 'R',
    name: 'Response Time',
    formula: 'R = D + W',
    definition: 'Time from request arrival to completion. Includes waiting time and service time.',
  },
  {
    symbol: 'W',
    name: 'Queue Delay',
    definition: 'The waiting portion of response time — time spent in queue before service begins.',
  },
  {
    symbol: 'X / λ',
    name: 'Throughput',
    definition: 'Number of requests completed per unit time. Your tasks per second.',
  },
  {
    symbol: 'λmax',
    name: 'Peak Rate',
    formula: 'λmax = 1/D (serial)  |  X = P/D (parallel)',
    definition: 'Maximum throughput at saturation. The system cannot go faster than λmax.',
  },
  {
    symbol: 'U',
    name: 'Utilization',
    formula: 'U = XD = λ / λmax',
    definition: 'Fraction of time the server is busy. Above saturation (U > 1) tasks queue indefinitely.',
  },
  {
    symbol: '1 − U',
    name: 'Idle Time',
    definition: 'Fraction of time the server is idle. Wasted capacity that could handle more load.',
  },
  {
    symbol: 'N',
    name: 'Queue Length',
    formula: 'N = λR  (Little\'s Law)',
    definition: 'Number of requests in the system at any moment. Universally: N = λR.',
  },
  {
    symbol: 'U = XD',
    name: 'Utilization Law',
    definition: 'Server utilization equals throughput times service demand.',
  },
  {
    symbol: 'N = λR',
    name: "Little's Law",
    definition: 'Queue length equals arrival rate times response time. Holds for any stable system.',
  },
  {
    symbol: 'R = D / (1 − U)',
    name: 'Response Time Law',
    definition: 'As utilization approaches 1, response time grows to infinity. The fundamental queueing blowup.',
  },
  {
    symbol: 'X = P / D',
    name: 'Parallel Throughput',
    definition: 'With P parallel servers each with demand D, peak throughput scales linearly.',
  },
  {
    symbol: 'R/D = 1 / (1 − U/c)',
    name: 'Expansion Factor',
    definition: 'With c parallel servers, the response time expansion factor is reduced by parallelism.',
  },
]
