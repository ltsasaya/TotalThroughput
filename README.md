# Total Throughput

Total Throughput is a typing-based browser game that teaches server
performance first: clients send RPCs, requests arrive at a server, queued work
waits for service, and responses return. It then uses that server model to
teach throughput, latency, utilization, overload, and systems performance more
generally.

Players build intuition before formulas. They first operate a single-server RPC
queue, then use that measured service demand to dispatch work across multiple
simulated server workers.

## Gameplay

### Phase 1: Single-Server Calibration

Tasks represent client RPCs to a server. The player completes each request by
typing its words exactly. The run measures service demand: how long one server
worker needs to process one RPC.

As arrival rate increases, queued tasks wait longer. If arrivals outpace
service rate, backlog and response time grow.

### Phase 2: Multi-Server Dispatch

The player becomes the dispatcher for a server pool. They route requests from
a shared queue to multiple automatic workers. The workers process at the
service demand measured in Phase 1.

This phase teaches why parallel servers increase capacity, why latency rises
near saturation, and why keeping every worker busy is not the same thing as
keeping response time low.

## Model

The game maps directly to server-performance concepts, then generalizes them to
larger systems:

- Worker: core, thread, process, or server.
- Queue: request backlog.
- Dispatcher: policy for assigning queued requests to available workers.
- Arrival rate: incoming work over time.
- Service rate: completed work capacity over time.
- Response time: waiting time plus service time.

The model is intentionally simplified for teaching. It does not currently model
preemption, migration, context-switch costs, caches, networking, I/O, or memory
pressure. Dispatch is FIFO and service is deterministic in the current
playable model.

## Project Direction

The current app is a browser-only Vite/React simulation. The planned deployed
direction is a small TypeScript API plus managed Postgres for storing typing
runs, server-generated tasks, task lifecycle events, and summary metrics.

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for current project state, recent
work, remaining work, and verification.

## Installation

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- Git

### Setup

```bash
git clone https://github.com/ltsasaya/TotalThroughput.git
cd TotalThroughput
npm install
npm run dev
```

The app will be available at the local URL printed by Vite, usually
`http://localhost:5173`.

## Commands

```bash
npm test
npm run lint
npm run build
npm run preview
```

- `npm test`: run the unit and integration test suite.
- `npm run lint`: run ESLint.
- `npm run build`: type-check and build the production bundle.
- `npm run preview`: preview the production build locally.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. The short
version: work on a feature branch, keep changes scoped, update tests and docs
when behavior changes, and include verification results in the PR.
