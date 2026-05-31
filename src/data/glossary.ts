export interface GlossaryEntry {
  symbol: string
  name: string
  formula?: string
  definition: string
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    symbol: 'RPC',
    name: 'Remote Procedure Call',
    definition: 'A client request to a server that waits for a response. In this game, each typing task represents one RPC.',
  },
  {
    symbol: 'D',
    name: 'Service Demand',
    definition: 'How long a request occupies one server worker. In this game: your typing time per task.',
  },
  {
    symbol: 'R',
    name: 'Response Time',
    formula: 'R = D + W',
    definition: 'Client-observed time from RPC arrival to completion. Includes waiting time and service time.',
  },
  {
    symbol: 'W',
    name: 'Queue Delay',
    definition: 'The waiting portion of response time — time spent in queue before service begins.',
  },
  {
    symbol: 'X / λ',
    name: 'Throughput',
    definition: 'Number of requests completed per unit time. In this game, completed typing tasks represent completed requests.',
  },
  {
    symbol: 'λmax',
    name: 'Peak Rate',
    formula: 'λmax = 1/D (one server)  |  λmax ≈ c/D (c workers)',
    definition: 'Maximum RPC arrival rate at saturation. A server cannot sustain arrivals above λmax.',
  },
  {
    symbol: 'U',
    name: 'Utilization',
    formula: 'U = XD = λ / λmax (one server)',
    definition: 'Fraction of time one server is busy. In a worker pool, use per-worker load to compare against saturation.',
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
    definition: 'Number of requests in the server at any moment, including waiting and active work.',
  },
  {
    symbol: 'U = XD',
    name: 'Utilization Law',
    definition: 'For one service center, utilization equals throughput times service demand.',
  },
  {
    symbol: 'N = λR',
    name: "Little's Law",
    definition: 'Long-run requests in the server equal arrival rate times response time. This generalizes to stable systems.',
  },
  {
    symbol: 'R = D / (1 − U)',
    name: 'Response Time Law',
    definition: 'Single-server reference model: as utilization approaches 1, response time grows sharply.',
  },
  {
    symbol: 'λmax ≈ c / D',
    name: 'Parallel Throughput',
    definition: 'With c identical server workers, ideal peak throughput scales linearly before dispatch and coordination costs.',
  },
  {
    symbol: 'ρcore = λD / c',
    name: 'Per-Worker Load',
    definition: 'Average offered load per worker in a server pool. High per-worker load makes queues and response time sensitive to bursts.',
  },
]
