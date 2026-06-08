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
    definition: 'How long a served request occupies one server worker. In Phase 1 this is estimated from completed typing samples.',
  },
  {
    symbol: 'R',
    name: 'Response Time',
    formula: 'R = D + W',
    definition: 'Client-observed time from RPC arrival to completion for served requests. Includes waiting time and service time.',
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
    definition: 'Reference RPC arrival rate at saturation. A continuing queue cannot sustain arrivals above λmax without growing backlog.',
  },
  {
    symbol: 'ρ',
    name: 'Offered Load',
    formula: 'ρ ≈ λD',
    definition: 'Reference load for one server during the arrival window. It estimates pressure against capacity, not an exact finite-run busy fraction.',
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
    definition: 'Long-run requests in the server equal arrival rate times response time for stable systems. Use as reference intuition for finite runs.',
  },
  {
    symbol: 'R = D / (1 − ρ)',
    name: 'Simple Response Reference',
    definition: 'Simple stable M/M/1 reference curve: as offered load approaches 1, response time grows sharply. It is not the game\'s exact finite-run model.',
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
