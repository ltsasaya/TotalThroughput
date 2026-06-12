# Project Status

Last updated: 2026-06-12

## Current State

Total Throughput is a browser-only Vite, React, and TypeScript instructional
game focused on server performance. The current branch contains the
semi-retro player flow from start screen to Game Menu, Educational Manual,
temporary 100 WPM run-testing bypass, calibrated one-minute Phase 1 runs,
browser-session run summaries, and a local Simulation Lab for server
concurrency intuition. The original Phase 2 server-pool flow is deferred until
a new concept is supplied.

## Recent Work

- Moved current Phase 1 run tasks to medium-length request prompts and updated
  expected service-demand and arrival-rate calculations.
- Reworked the Phase 1 play view so the active typing task stays anchored while
  queued requests render directly beneath it with capped overflow.
- Removed Phase 1 progress/error-count/size-chip UI and made incorrect typed
  characters red with red underlines, including incorrect spaces.
- Updated run summaries and browser-session records around total throughput,
  average response time, utilization, and average queue length.
- Fixed Home and Game Menu navigation so completed calibration and
  browser-session run records survive route changes.
- Removed the old start-page learning section and documented the current Phase
  1 scope and deferred Phase 2 boundary.
- Added a full-width Game Menu Learn More / Simulation panel that opens a
  standalone browser-local Simulation Lab.
- Added a seeded M/M/c-style local simulator with Erlang C stable-reference
  values, run-time experiment guards, nice graph ticks, nearest-point hover,
  seed records, and a `c = 1, 2, 4, 8` concurrency sweep.
- Documented the Simulation Lab model boundary: finite seeded observations are
  separate from steady-state reference values, with no backend, persistence,
  accounts, or old Phase 2 routing in scope.

## Remaining Work

- Manually test difficulty offsets, target loads, and WPM bins during TODO-006.
- Decide the final seed/data-collection strategy for Phase 1 runs.
- Decide whether unfinished work should stay visible, be relabeled, or be
  hidden in run summaries.
- Run BOSS's pre-main Simulation Lab walkthrough and record any remaining UI,
  labeling, or model-tuning fixes.
- Decide whether the current `Queue Length (N)` display label should remain or
  be adjusted for stricter queueing notation.
- Remove the temporary 100 WPM run-testing bypass before final calibration
  behavior is accepted.
- Add the small TypeScript API planned for persisted run and task data.
- Add managed Postgres schema and migrations for runs, tasks, events, and
  summary metrics.
- Connect the finalized browser-owned run model to server-owned task generation
  and run reloads.

## Verification

- `git diff --check`: passed
- `npm test`: passed, 161 tests
- `npm run lint`: passed
- `npm run build`: passed with Vite's existing large chunk warning
- Browser QA: Phase 1 layout stability passed on desktop and mobile for empty
  queue, queued requests with overflow, wrong-letter highlighting, and
  wrong-space underline states.
- Browser QA: Navigation smoke passed for first Game Menu, Home -> Game Menu,
  active run -> Game Menu, and Phase 1 summary -> Home.
- Browser QA: Simulation Lab passed for Game Menu -> Simulation, initial empty
  lab state, Run-generated seed/chart/sweep, nearest-point hover tooltip, and
  editable `t = 200` input behavior.
