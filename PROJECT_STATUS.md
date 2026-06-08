# Project Status

Last updated: 2026-06-08

## Current State

Total Throughput is a browser-only Vite, React, and TypeScript instructional
game focused on server performance first, introduced through clients sending
requests to a queued server, then systems performance as the generalization. The
playable flow includes Phase 1 single-server typing calibration, Phase 2
server-pool dispatch, live metrics, post-run charts, and instructional
feedback. The active visual direction is a semi-retro monochrome UI revamp
using rectangular controls, sparse network motifs, and system monospace
typography. `Play` now opens a three-page Educational Manual before Phase 1.

## Recent Work

- Cleaned up public project documentation for setup, contribution, and source
  layout.
- Added a public status document for teammate-facing project progress.
- Updated public docs so teammate-facing material stays focused on setup,
  status, and project direction.
- Shifted product framing and visible instructional copy to server
  performance first, with broader systems concepts introduced from that model.
- Added clients/requests as the concrete introductory story for arrivals, queues,
  service demand, and response time.
- Rebuilt Phase 1 as fixed-rate seeded Poisson request levels with no punitive
  drops, completed-sample calibration gates, demo overload levels, and
  per-level backlog/tail feedback.
- Rebuilt Phase 2 as a fixed-rate seeded Poisson request server-pool dispatch run
  where arrival rate derives from Phase 1 service demand, worker count, and
  target per-worker load.
- Updated Phase 2 metrics and feedback to distinguish configured load
  (`lambda`, `lambda_max ~= c / D`, `lambda D / c`) from observed finite-run
  throughput, utilization, waiting time, and response time.
- Clarified the Phase 2 debrief so served response time is paired with observed
  completed throughput as `N_served ~= X R`.
- Matched instructional popup dismissal to the design: any key or outside
  click continues the pre-phase and debrief prompts.
- Added the app-wide visual system: design rules, CSS tokens, shared UI
  primitives, and a full visual pass across start, learn, gameplay, debrief,
  chart, and summary surfaces without adding stack dependencies.
- Rebuilt the start screen to match the approved monochrome reference: top
  nav line, disabled placeholder actions, large centered title, `Play` and
  `Join Class` controls, scanline texture, and responsive hub-and-spoke
  network background.
- Tuned the start-screen network from BOSS's Figma code so hubs connect toward
  the `Play` button, satellite nodes avoid awkward border/line collisions, and
  no hub-to-hub links are shown.
- Added the first Educational Manual page in the player workflow: `Play` now
  opens a semi-retro manual screen with the persistent header, server
  request/response explanation, and simplified client/server sequence diagram.
- Added the second Educational Manual page: incoming requests wait in a request
  queue inside the server, the front request moves to a worker, and the server
  sends a response back to the client.
- Added the third Educational Manual page: typing-task objective, client
  satisfaction, lowest Response Time (`R`) goal, and calibration level setup.
- Removed player-facing RPC wording from the app and docs in favor of broader
  request/response language.

## Remaining Work

- Continue the UI revamp with the next player-workflow manual/page slice.
- Continue feedback-driven visual tuning on gameplay and results screens after
  BOSS approves each slice.
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
- Browser QA: desktop/mobile start screen and Educational Manual pages 1-3
  rendered correctly, with no console errors; `Home` returns to start and
  `Close` enters Phase 1
