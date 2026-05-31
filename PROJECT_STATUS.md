# Project Status

Last updated: 2026-05-30

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

## Remaining Work

- Rebuild Phase 1 as short RPC single-server levels with seeded Poisson
  arrivals and no mid-run drops.
- Rebuild Phase 2 as a constant-rate RPC server-pool dispatch challenge.
- Add the small TypeScript API planned for persisted run and task data.
- Add managed Postgres schema and migrations for runs, tasks, events, and
  summary metrics.
- Connect the browser flow to server-owned task generation and run reloads.
- Deploy one app that serves the built frontend and same-origin API routes.

## Verification

- `npm test`: passed, 120 tests
- `npm run lint`: passed
- `npm run build`: passed with Vite's existing large chunk warning
