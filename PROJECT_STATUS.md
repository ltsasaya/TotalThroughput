# Project Status

Last updated: 2026-06-02

## Current State

Total Throughput is a browser-only Vite, React, and TypeScript instructional
game focused on server performance first, introduced through clients sending
RPCs to a queued server, then systems performance as the generalization. The
playable flow includes Phase 1 single-server typing calibration, Phase 2
server-pool dispatch, live metrics, post-run charts, and instructional
feedback.

## Recent Work

- Cleaned up public project documentation for setup, contribution, and source
  layout.
- Added a public status document for teammate-facing project progress.
- Updated public docs so teammate-facing material stays focused on setup,
  status, and project direction.
- Shifted product framing and visible instructional copy to server
  performance first, with broader systems concepts introduced from that model.
- Added clients/RPCs as the concrete introductory story for arrivals, queues,
  service demand, and response time.
- Rebuilt Phase 1 as fixed-rate seeded Poisson RPC levels with no punitive
  drops, completed-sample calibration gates, demo overload levels, and
  per-level backlog/tail feedback.
- Rebuilt Phase 2 as a fixed-rate seeded Poisson RPC server-pool dispatch run
  where arrival rate derives from Phase 1 service demand, worker count, and
  target per-worker load.
- Updated Phase 2 metrics and feedback to distinguish configured load
  (`lambda`, `lambda_max ~= c / D`, `lambda D / c`) from observed finite-run
  throughput, utilization, waiting time, and response time.
- Clarified the Phase 2 debrief so served response time is paired with observed
  completed throughput as `N_served ~= X R`.
- Matched instructional popup dismissal to the design: any key or outside
  click continues the pre-phase and debrief prompts.

## Remaining Work

- Add the small TypeScript API planned for persisted run and task data.
- Add managed Postgres schema and migrations for runs, tasks, events, and
  summary metrics.
- Connect the finalized browser-owned Phase 1 and Phase 2 run model to
  server-owned task generation and run reloads.
- Deploy one app that serves the built frontend and same-origin API routes.

## Verification

- `npm test`: passed, 125 tests
- `npm run lint`: passed
- `npm run build`: passed with Vite's existing large chunk warning
