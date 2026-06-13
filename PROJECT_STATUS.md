# Project Status

Last updated: 2026-06-12

## Current State

Total Throughput is a Vite, React, and TypeScript instructional game focused
on server performance. The current branch has the first data-backed slice: a
small same-origin TypeScript API with a Vercel `/api/*` rewrite, Neon/Postgres
migrations, simple username/password auth, profile dashboards,
instructor/classes, code-only class joining, global data scatterplots,
Simulation Lab activity counts, and a start-page Concurrency Race sample.

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
- Added local Node API routes, Postgres migrations, and opaque HttpOnly
  database-backed sessions without a `SESSION_SECRET`.
- Added Sign In/Register/Sign Out, Profile, For Instructors, Class Dashboard,
  Join Class, and Global Data screens using the existing semi-retro UI system.
- Added instructor-name first-use popup, Class Info modal, class code creation,
  masked click-to-reveal class codes, duplicate enrollment handling, and class
  student rows with `...` actions.
- Persisted signed-in completed Phase 1 run summaries for profile/class/global
  views and counted Simulation Lab Run-button activity without persisting lab
  seeds, inputs, samples, or results.
- Simplified persisted run summary columns: `difficulty_key` derives display
  labels, `completed_count` is the only completed-request count,
  `observed_arrival_rate` is stored next to configured `arrival_rate`, and
  `actual_throughput` is renamed to `throughput_per_second`.
- Added a start-page `another game idea` button that opens an isolated
  Concurrency Race sample adapted from BOSS's provided zip without adding zip
  dependencies or theme files.
- Added a Vercel API rewrite for the existing server routes so
  deployed `/api/*` calls reuse the same local API handler.
- Made Postgres pool initialization lazy so Vercel can build function bundles
  before a DB-backed endpoint actually needs `DATABASE_URL`.
- Removed the temporary 100 WPM run-testing calibration bypass; Game Menu now
  requires a real completed calibration before runs unlock.

## Remaining Work

- Manually test difficulty offsets, target loads, and WPM bins during TODO-006.
- Decide the final seed/data-collection strategy for Phase 1 runs.
- Decide whether unfinished work should stay visible, be relabeled, or be
  hidden in run summaries.
- Run BOSS's pre-main Simulation Lab walkthrough and record any remaining UI,
  labeling, or model-tuning fixes.
- Decide whether the current `Queue Length (N)` display label should remain or
  be adjusted for stricter queueing notation.
- Add full server-owned run/task/event lifecycle and server-finalized metrics
  for the later TODO-007 through TODO-011 foundation.
- Connect the finalized browser-owned run model to server-owned task generation
  and run reloads.
- Smoke-test Vercel after the API wrapper fix is deployed.

## Verification

- `git diff --check`: passed
- `npm test`: passed, 168 tests
- `npm run lint`: passed
- `npm run build`: passed with Vite's existing large chunk warning
- `npm run db:migrate`: passed against the configured `.env` `DATABASE_URL`
  for migrations 001 through 004, with a non-blocking `pg` SSL-mode warning.
- HTTP smoke: Vite served `/` on the fallback local dev port and the running
  API returned `/api/auth/me`.
- Browser interaction smoke: not run in the final review because no browser
  automation tool or local Playwright package was available in this session.
- Browser QA: Sign In/Register/Sign Out, Profile metrics/tabs, instructor name
  popup, class create/code display, Join Class, duplicate already-enrolled
  message, class dashboard student row/menu, Global Data empty scatterplot
  shell, and Simulation Lab activity count passed locally.
- Browser QA: Phase 1 layout stability passed on desktop and mobile for empty
  queue, queued requests with overflow, wrong-letter highlighting, and
  wrong-space underline states.
- Browser QA: Navigation smoke passed for first Game Menu, Home -> Game Menu,
  active run -> Game Menu, and Phase 1 summary -> Home.
- Browser QA: Simulation Lab passed for Game Menu -> Simulation, initial empty
  lab state, Run-generated seed/chart/sweep, nearest-point hover tooltip, and
  editable `t = 200` input behavior.
