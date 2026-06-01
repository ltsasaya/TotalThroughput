# Project Status

Last updated: 2026-06-01

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
- Matched instructional popup dismissal to the design: any key or outside
  click continues the pre-phase and debrief prompts.

## Remaining Work

- Rebuild Phase 2 as a constant-rate RPC server-pool dispatch challenge.
- Add the small TypeScript API planned for persisted run and task data.
- Add managed Postgres schema and migrations for runs, tasks, events, and
  summary metrics.
- Connect the browser flow to server-owned task generation and run reloads.
- Deploy one app that serves the built frontend and same-origin API routes.

## Verification

- `npm test`: passed, 130 tests
- `npm run lint`: passed
- `npm run build`: passed with Vite's existing large chunk warning
