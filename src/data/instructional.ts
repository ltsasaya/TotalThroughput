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
    title: 'Phase 1: One Server',
    entries: [
      { type: 'text', text: 'Clients send RPCs to a server. You are the server worker processing those requests.' },
      { type: 'formula', formula: 'D = service demand', caption: 'How long one request occupies the server worker.' },
      { type: 'formula', formula: 'λ = arrival rate', caption: 'How quickly client RPCs arrive.' },
      { type: 'formula', formula: 'λmax = 1 / D', caption: 'One server saturates when arrivals match service capacity.' },
      { type: 'formula', formula: 'U = λ / λmax', caption: 'Utilization rises as request arrivals approach capacity.' },
      { type: 'text', text: 'Complete queued RPCs and watch client response time grow as the server queue builds.' },
    ],
  },
  postPhase1: {
    title: 'Single-Server Baseline',
    entries: [
      { type: 'formula', formula: 'X ≈ λmax = 1 / D', caption: 'Your measured single-server RPC capacity: one request every D seconds.' },
      { type: 'formula', formula: 'R = D + W', caption: 'Response time is service time plus waiting time.' },
      { type: 'formula', formula: 'N = λR  (Little\'s Law)', caption: 'As λ approaches λmax, queue length N grows unboundedly.' },
      { type: 'text', text: 'Your measured D becomes the service demand for each worker in the Phase 2 server pool.' },
    ],
  },
  prePhase2: {
    title: 'Phase 2: Server Pool',
    entries: [
      { type: 'formula', formula: 'λmax ≈ c / D', caption: 'More workers raise peak server capacity.' },
      { type: 'formula', formula: 'ρcore = λD / c', caption: 'Per-worker load falls as capacity is spread across c workers.' },
      { type: 'text', text: 'Dispatch queued RPCs to idle workers. Keep client response time low by avoiding both backlog and idle capacity.' },
    ],
  },
  postPhase2: {
    title: 'Run Complete',
    entries: [
      { type: 'formula', formula: 'rho ≈ λD / c', caption: 'Average offered load per worker in the server pool.' },
      { type: 'formula', formula: 'R ≈ D / (1 − U)', caption: 'Single-server reference curve: response time rises sharply near saturation.' },
      { type: 'formula', formula: 'N = λR  (Little\'s Law)', caption: 'Queue length is a function of arrival rate and response time.' },
      { type: 'text', text: 'The same client/RPC, queue, service, and response model generalizes to larger systems.' },
    ],
  },
}
