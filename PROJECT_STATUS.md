# Project Status

Last updated: 2026-06-15

## Current State

Total Throughput is a Vite, React, and TypeScript instructional game focused
on server performance. The current branch has the first data-backed slice: a
small same-origin TypeScript API with a Vercel `/api/*` rewrite, Neon/Postgres
migrations, simple username/password auth, profile dashboards,
instructor/classes, code-only class joining, global data scatterplots,
Simulation Lab activity counts, and a start-page Concurrency Race sample.

## Recent Work

- Added latest-calibration persistence on `users`, hydrated signed-in sessions
  with calibration data, and saved completed calibration updates through the
  profile API.
- Added complete target-profile viewing so instructors can open a student's
  real profile from the class dashboard instead of a generated popup.
- Cleaned class student action menus, added outside-click dismissal, and
  reduced the profile return control to a compact `Back` button.
- Unified calibration and Phase 1 typing words into one shared pool and removed
  Phase 1 prompt-size selection.
- Removed noisy Global Data hover and graph-switch animations, fixed visible
  queueing notation to use `U`, and kept utilization/arrival graph bounds
  aligned with observed data.
- Simplified the educational preview diagrams and auth/profile/game-menu
  headers per BOSS's UI cleanup requests.
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
- BOSS configured the Vercel `DATABASE_URL` and confirmed the hosted app works.
- Closed the calibrated gameplay review gate; follow-up tweaks and bug fixes
  are now tracked in `TODO-015`.

## Remaining Work

- Work through BOSS-supplied small changes and bug fixes under `TODO-015`.
- Keep future Phase 2 deferred until BOSS supplies the new concept.

## Verification

- `git diff --check`: passed
- `npm test`: passed, 171 tests
- `npm run lint`: passed
- `npm run build`: passed with Vite's existing large chunk warning
- `npm run db:migrate`: not run for migration 005 in this checkpoint.
- HTTP smoke: Vite served `/` on the fallback local dev port and the running
  API returned `/api/auth/me`.
- Browser interaction smoke: not run in the final review because no browser
  automation tool or local Playwright package was available in this session.
- Browser QA: Sign In/Register/Sign Out, Profile metrics/tabs, instructor name
  popup, class create/code display, Join Class, duplicate already-enrolled
  message, class dashboard student row/menu, Global Data empty scatterplot
  shell, and Simulation Lab activity count passed locally.
- Hosted smoke: BOSS confirmed the Vercel deployment works after configuring
  `DATABASE_URL`.
- Browser QA: Phase 1 layout stability passed on desktop and mobile for empty
  queue, queued requests with overflow, wrong-letter highlighting, and
  wrong-space underline states.
- Browser QA: Navigation smoke passed for first Game Menu, Home -> Game Menu,
  active run -> Game Menu, and Phase 1 summary -> Home.
- Browser QA: Simulation Lab passed for Game Menu -> Simulation, initial empty
  lab state, Run-generated seed/chart/sweep, nearest-point hover tooltip, and
  editable `t = 200` input behavior.
