export type PopupId = 'prePhase1' | 'postPhase1' | 'prePhase2' | 'postPhase2'

type PopupEntry =
  | { type: 'formula'; formula: string; caption: string }
  | { type: 'text'; text: string }

interface PopupContent {
  title: string
  entries: PopupEntry[]
}

export type { PopupEntry, PopupContent }

export const POPUP_CONTENT: Record<PopupId, PopupContent> = {
  prePhase1: {
    title: 'Phase 1: Calibration',
    entries: [
      { type: 'formula', formula: 'D = service demand', caption: 'How long it takes to complete each task (1 typing task)' },
      { type: 'formula', formula: 'λ = arrival rate', caption: 'How quickly tasks arrive (requests/second)' },
      { type: 'formula', formula: 'λmax = 1 / D', caption: 'Max throughput: Throughput at saturation (server capacity is fully busy)' },
      { type: 'formula', formula: 'U = λ / λmax', caption: 'Utilization rises as task arrivals approach your service capacity.' },
      { type: 'text', text: 'Complete typing tasks as they arrive. Beware of your queue length and taking too long to complete tasks' },
    ],
  },
  postPhase1: {
    title: 'Calibration Complete',
    entries: [
      { type: 'formula', formula: 'X ≈ λmax = 1 / D', caption: 'Your measured throughput at capacity — one task completed every D seconds.' },
      { type: 'formula', formula: 'R = D + W', caption: 'Response time is service time plus waiting time.' },
      { type: 'formula', formula: 'N = λR  (Little\'s Law)', caption: 'As λ approaches λmax, queue length N grows unboundedly.' },
      { type: 'text', text: 'Your measured D is now the processing rate for each core in Phase 2.' },
    ],
  },
  prePhase2: {
    title: 'Phase 2: Scheduling',
    entries: [
      { type: 'formula', formula: 'X = P / D', caption: 'Parallel throughput scales with core count P.' },
      { type: 'formula', formula: 'U = XD', caption: 'Utilization: fraction of core time spent on useful work.' },
      { type: 'text', text: 'Dispatch tasks to cores. Maximize throughput and prevent queue from getting too long.' },
    ],
  },
  postPhase2: {
    title: 'Run Complete',
    entries: [
      { type: 'formula', formula: 'U = XD', caption: 'Fraction of core time spent on useful work. Idle gaps are wasted capacity.' },
      { type: 'formula', formula: 'R = D / (1 − U/c)', caption: 'With c parallel cores the response time curve shifts right.' },
      { type: 'formula', formula: 'N = λR  (Little\'s Law)', caption: 'Queue length is a function of arrival rate and response time.' },
      { type: 'text', text: 'Check the theory charts in the summary to see where your run landed on each curve.' },
    ],
  },
}
