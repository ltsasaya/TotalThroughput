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
      { type: 'formula', formula: 'λ = arrival rate', caption: 'Long-run average RPC arrival rate during the burst window.' },
      { type: 'formula', formula: 'λmax = 1 / D', caption: 'One server saturates when arrivals match service capacity.' },
      { type: 'formula', formula: 'ρ ≈ λD', caption: 'Reference load rises as request arrivals approach service capacity.' },
      { type: 'formula', formula: 'R = W + D', caption: 'Client response time is waiting time plus service time.' },
      { type: 'text', text: 'Each level uses one fixed RPC arrival rate. Serve queued RPCs and watch backlog turn into response time.' },
    ],
  },
  postPhase1: {
    title: 'Single-Server Baseline',
    entries: [
      { type: 'formula', formula: 'λmax = 1 / D', caption: 'Your measured single-server RPC capacity: one request every D seconds.' },
      { type: 'formula', formula: 'X = served / time', caption: 'Observed throughput is completed RPCs per measured window.' },
      { type: 'formula', formula: 'R = W + D', caption: 'Served-client response time is waiting time plus service time.' },
      { type: 'formula', formula: 'R ~= D / (1 - ρ)', caption: 'Simple stable M/M/1 reference curve, not a finite-run scoring rule.' },
      { type: 'formula', formula: 'N = λR  (Little\'s Law)', caption: 'Long-run stable-system reference for requests resident in the system.' },
      { type: 'text', text: 'When calibration passes, your measured D becomes the service demand for each worker in the Phase 2 server pool.' },
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
      { type: 'formula', formula: 'R ≈ D / (1 − ρ)', caption: 'Simple stable single-server reference curve: response time rises sharply near saturation.' },
      { type: 'formula', formula: 'N = λR  (Little\'s Law)', caption: 'Queue length is a function of arrival rate and response time.' },
      { type: 'text', text: 'The same client/RPC, queue, service, and response model generalizes to larger systems.' },
    ],
  },
}
