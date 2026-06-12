# Total Throughput

Total Throughput is a typing-based browser game that teaches server
performance first: clients send requests, work arrives at a server, queued work
waits for service, and responses return. It then uses that server model to
teach throughput, latency, utilization, overload, and systems performance more
generally.

Players build intuition before formulas. The current playable flow focuses on
one server: calibrate typing capacity, choose a calibrated one-minute request
run, and observe how arrival rate, service demand, queue length, utilization,
throughput, and response time relate.

## Gameplay

### Phase 1: Single-Server Calibration

Tasks represent client requests to a server. The player completes each request by
typing its words exactly. The run measures service demand: how long one server
worker needs to process one request.

As arrival rate increases, queued tasks wait longer. If arrivals outpace
service rate, backlog and response time grow.

### Future Phase 2

The previous multi-server dispatch concept is deferred. A new Phase 2 concept
will be planned separately after the current Phase 1 path is stable.

## Model

The game maps directly to server-performance concepts, then generalizes them to
larger systems:

- Worker: core, thread, process, or server.
- Queue: request backlog.
- Dispatcher: future policy surface for assigning queued requests to available
  workers.
- Arrival rate: incoming work over time.
- Service rate: completed work capacity over time.
- Response time: waiting time plus service time.

The model is intentionally simplified for teaching. It does not currently model
preemption, migration, context-switch costs, caches, networking, I/O, memory
pressure, or multi-worker dispatch in the active player flow. Current Phase 1
service is the player's typed work on one request at a time.

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
