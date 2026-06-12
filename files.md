# File Index

## Project Docs

| File | Description |
|---|---|
| `README.md` | Project overview, local setup, commands, and contribution entry point |
| `CONTRIBUTING.md` | GitHub contributor setup, workflow, code expectations, and backend direction |
| `PROJECT_STATUS.md` | Teammate-facing current state, recent work, remaining work, and verification |

## Source

| File | Description |
|---|---|
| `src/main.tsx` | React 19 entry point — mounts `<App>` into DOM root |
| `src/App.tsx` | Root component — mounts `useGameLoop`, routes to phase-specific views and debrief popups, and renders app-level system notifications |
| `src/index.css` | Global styles — Tailwind v4 import plus Total Throughput visual tokens, panels, buttons, badges, formula callouts, and scrollbar helpers |
| `src/vite-env.d.ts` | Vite client type declarations |

## Types

| File | Description |
|---|---|
| `src/types/task.ts` | `Task`, `TaskEvent`, `TaskSize`, `TaskStatus`, `TaskEventType` |
| `src/types/core.ts` | `Core`, `CoreStatus` — internal worker/core model |
| `src/types/game.ts` | `GamePhase`, legacy `DifficultyMode`, calibrated Phase 1 difficulty/result/config types, Phase 2 run config, `GameConfig` |
| `src/types/metrics.ts` | `LiveMetrics`, browser-only `Phase1RunRecord`, legacy `Phase1Result`, `RunSummary`, `GradeLevel`, `TimePoint` |
| `src/types/account.ts` | Account, profile, instructor dashboard, class dashboard, join-class, and global-data DTO types |

## API Client

| File | Description |
|---|---|
| `src/api/client.ts` | Same-origin JSON fetch wrapper with credentials, auth/profile/class/global-data calls, and signed-in activity/run persistence helpers |

## Store

| File | Description |
|---|---|
| `src/store/gameStore.ts` | Zustand store — browser-only calibration, difficulty selection, calibrated Phase 1 runs, Phase 2 compatibility, persistent navigation, typing/tick/reset actions |
| `src/store/simulationLabStore.ts` | Zustand store — local simulation lab inputs, active graph series, latest seeded run, recent seed records, and validation errors |
| `src/store/accountStore.ts` | Zustand account store — current user bootstrap, sign-in/register/sign-out state, and auth errors |
| `src/store/__tests__/gameStore.test.ts` | Unit tests — calibration, difficulty selection, calibrated Phase 1 run transitions, run records, persistent navigation, reset |
| `src/store/__tests__/gameStore.phase2.test.ts` | Unit tests — Phase 2: startPhase2, dispatchTask, core progress, completion, metrics, end condition |
| `src/store/__tests__/simulationLabStore.test.ts` | Unit tests — Simulation Lab store starts without an auto-run and reports successful Run calls for activity counting |

## Server

| File | Description |
|---|---|
| `server/index.ts` | Local Node API entry point on `PORT` or 8787 |
| `server/app.ts` | API route registration, request dispatch, safe error responses, and same-origin mutation guard |
| `server/db.ts` | `pg` pool, `.env` loading, and transaction helper |
| `server/env.ts` | Minimal local `.env` parser and required environment validation |
| `server/crypto.ts` | Password hashing, password verification, opaque session token hashing, and class-code generation |
| `server/http.ts` | Route helper, JSON response helpers, bounded JSON body parser, cookies, and auth context types |
| `server/runValidation.ts` | Field-specific Phase 1 run-summary validation and bounds before persistence |
| `server/sessionCookie.ts` | HttpOnly SameSite session cookie string helpers without database dependency |
| `server/sessions.ts` | HttpOnly session cookie creation, session lookup, and revocation |
| `server/validation.ts` | Runtime request-body validation helpers for strings, booleans, usernames, passwords, and numeric fields |
| `server/migrate.ts` | SQL migration runner for `migrations/*.sql` |
| `server/routes/auth.ts` | Register, login, logout, and current-user API routes |
| `server/routes/classes.ts` | Instructor profile/dashboard, class creation, class check/join, class dashboard, student remove/profile routes |
| `server/routes/globalData.ts` | Global completed-run scatterplot data route with WPM filtering |
| `server/routes/profile.ts` | Signed-in profile summary, run list, joined classes, and teaching classes route |
| `server/routes/runs.ts` | Signed-in Phase 1 run summary persistence and Simulation Lab activity counter routes |
| `server/crypto.test.ts` | Unit tests for password hashing/verification, opaque session token hashing, and cookie flags |
| `server/runValidation.test.ts` | Unit tests for Phase 1 run-summary bounds, difficulty enum, and UUID validation |

## Database

| File | Description |
|---|---|
| `migrations/001_profiles_classes_global_data.sql` | Postgres schema for users, sessions, instructor profiles, classes, class memberships, user activity, and Phase 1 run summaries |
| `migrations/002_typing_run_summary_constraints.sql` | Postgres check constraints for persisted Phase 1 summary bounds and difficulty keys |
| `migrations/003_remove_class_password_requirement.sql` | Postgres migration that makes legacy class password hashes nullable for code-only class joins |
| `migrations/004_simplify_typing_run_summary.sql` | Postgres migration that removes duplicate run-summary columns and adds observed arrival rate plus throughput/sec |

## Simulation

| File | Description |
|---|---|
| `src/simulation/content.ts` | Task word pools (S/M/L), Phase 2 `generateTask(...)`, and Phase 1 medium-length `generatePhase1Task(...)` |
| `src/simulation/arrival.ts` | Seeded constant-rate Poisson arrival schedule generator shared by phase run builders |
| `src/simulation/calibration.ts` | Calibration random-word text, generated display rows, WPM bins, WPM calculation, and calibrated difficulty option derivation |
| `src/simulation/phase1Levels.ts` | Phase 1 level table, fixed seeds, per-level durations, and Poisson schedule helper |
| `src/simulation/phase1Results.ts` | Phase 1 per-level and aggregate calibration result builders, including active-window rate and backlog/tail metrics |
| `src/simulation/phase1Runs.ts` | Calibrated Phase 1 run config builder, 60-second schedule helper, utilization helper, and browser-only run record builder |
| `src/simulation/phase1Tick.ts` | `computePhase1RunTick` — pure no-drop calibrated Phase 1 tick: Poisson arrivals, activation, live metrics, 60-second run-end flag |
| `src/simulation/serverLab.ts` | Browser-only simulation lab model — seeded finite M/M/c-style simulation and Erlang C steady-state reference |
| `src/simulation/serverLabExperiment.ts` | Simulation Lab experiment helpers — load bands, browser-cost estimates, confirmation guard, and concurrency sweeps |
| `src/simulation/chartTicks.ts` | Graph tick helpers — clean time-axis tick generation and compact numeric tick labels |
| `src/simulation/phase2Runs.ts` | Phase 2 server-pool run config builder — target per-worker load, measured-D lambda, seeds, size mix, and Poisson schedule helper |
| `src/simulation/phase2Tick.ts` | `computePhase2Tick` — pure Phase 2 tick: arrivals, core progress, completion, idle waste, RunSummary + grade computation |
| `src/simulation/__tests__/content.test.ts` | Unit tests — task generation, Phase 1 medium prompts, word count ranges per size, exact deadline values |
| `src/simulation/__tests__/arrival.poisson.test.ts` | Unit tests — seeded Poisson arrival schedule determinism, bounds, expected count, default size bucket, weighted mix, and invalid inputs |
| `src/simulation/__tests__/calibration.test.ts` | Unit tests — calibration WPM/binning, clamping, difficulty derivation, and row-window movement |
| `src/simulation/__tests__/phase1Results.test.ts` | Unit tests — Phase 1 gate/demo result math and aggregate unlock rules |
| `src/simulation/__tests__/phase1Runs.test.ts` | Unit tests — calibrated run lambda, deterministic run schedule, browser-only run record metrics |
| `src/simulation/__tests__/phase1Tick.test.ts` | Unit tests — computePhase1RunTick: no-drop run timing, Phase 1 prompt spawning, activation, live metrics |
| `src/simulation/__tests__/serverLab.test.ts` | Unit tests — simulation lab determinism, seed variation, worker-count behavior, input validation, and Erlang C reference |
| `src/simulation/__tests__/serverLabExperiment.test.ts` | Unit tests — Simulation Lab load bands, run guards, and concurrency sweep behavior |
| `src/simulation/__tests__/chartTicks.test.ts` | Unit tests — simulation graph tick helper output and label formatting |
| `src/simulation/__tests__/phase2Runs.test.ts` | Unit tests — Phase 2 run config lambda math, worker counts, deterministic Poisson schedules, and S/M/L mix |
| `src/simulation/__tests__/phase2Tick.test.ts` | Unit tests — computePhase2Tick: phase-end, score formula, grade thresholds, idle waste, task completion |

## Hooks

| File | Description |
|---|---|
| `src/hooks/useGameLoop.ts` | `setInterval` hook — starts/stops 100ms tick loop based on game phase |

## Components

| File | Description |
|---|---|
| `src/components/ui/primitives.tsx` | Shared visual-system primitives — panels, labels, metric items, buttons, badges, formula callouts, and `cx` helper |
| `src/components/account/DashboardBits.tsx` | Shared account/class dashboard helpers — dashboard shell, metric band, fields, errors, masked class-code display, class cards, and run rows |
| `src/components/account/AuthView.tsx` | Sign In/Register page with post-auth return routing |
| `src/components/profile/ProfileDashboardView.tsx` | Profile dashboard with top metrics, Runs/Classes tabs, saved run bars, joined classes, and teaching classes |
| `src/components/classes/InstructorDashboardView.tsx` | Instructor dashboard with first-use instructor-name modal, metric band, icon-only new-class button, and Class Info modal |
| `src/components/classes/ClassDashboardView.tsx` | Class dashboard with class metrics, student rows, `...` actions, remove student, and class-scoped student profile modal |
| `src/components/classes/JoinClassView.tsx` | Two-step Join Class flow: class code, then optional/required student name and ID |
| `src/components/global-data/GlobalDataView.tsx` | Global Data page with graph selector, WPM filter rail, and Recharts scatterplot |
| `src/components/game/RetroHeader.tsx` | Shared semi-retro header with persistent Home/Game Menu, Global Data, For Instructors, and Sign In/Profile controls |
| `src/components/game/StartScreen.tsx` | Idle phase — semi-retro monochrome start screen with `Play` and real `Join Class` action |
| `src/components/game/ConcurrencyRaceSampleView.tsx` | Start-page sample game idea — transaction scheduling prototype adapted from the Concurrency Race zip |
| `src/components/game/EducationalManual.tsx` | Play-to-Game-Menu onboarding manual — modal/full-screen manual shell, page navigation, close/home handoff, and page-specific diagrams |
| `src/components/game/EducationalManualDiagrams.tsx` | Semi-retro SVG diagrams for Educational Manual pages |
| `src/components/game/LearnMorePage.tsx` | Single-page Learn More modal using the Educational Manual shell |
| `src/components/game/CalibrationView.tsx` | 30-second monkeytype-style calibration screen with a fixed five-row generated-row viewport, start overlay, and live WPM/accuracy |
| `src/components/game/CalibrationSummaryView.tsx` | Post-calibration summary card — WPM, accuracy, difficulty bin, recalibrate, and Game Menu actions |
| `src/components/game/DifficultySelectView.tsx` | Game Menu — pre-calibration manual/calibration hub, calibrated Easy/Medium/Hard/Impossible run selection, Global Data entry, and browser-session run record list |
| `src/components/game/TopBar.tsx` | Shared active-run header — persistent Home/Game Menu navigation, phase label, countdown timer, optional dropped counter, queue display, optional score |
| `src/components/game/Phase1View.tsx` | Calibrated 60-second single-server typing run — active request, FIFO queue, countdown, live stats sidebar |
| `src/components/game/Phase1RunSummary.tsx` | Browser-only Phase 1 run summary — recorded metrics, setup values, finite-run/reference formula caveat, continue/recalibrate actions |
| `src/components/game/SimulationLabView.tsx` | Standalone Simulation Lab screen — controls, series toggles, M/M/c reference, seed records, graph settings band, and signed-in activity count after successful Run |
| `src/components/game/SimulationInputs.tsx` | Simulation Lab boxed input components — draft editing for model parameters and graph-axis inputs |
| `src/components/game/SimulationChart.tsx` | Recharts line chart for finite seeded simulation samples |
| `src/components/game/SimulationSweepPanel.tsx` | Simulation Lab compact concurrency sweep table for `c = 1, 2, 4, 8` |
| `src/components/game/Phase1Complete.tsx` | Legacy post-Phase-1 level summary retained for compatibility while the new workflow uses `Phase1RunSummary` |
| `src/components/game/Phase2View.tsx` | Phase 2 server-pool layout — TopBar + QueuePanel + worker grid + StatsPanel |
| `src/components/game/QueuePanel.tsx` | Scrollable list of waiting requests — NEXT marker, waiting time color coding |
| `src/components/game/CoreCard.tsx` | Individual worker display — idle/busy status, progress bar, dispatch target pulsing |
| `src/components/game/StatsPanel.tsx` | Live stats sidebar — throughput vs ideal, queue length, worker utilization, wait time, counts |
| `src/components/game/PostRunSummary.tsx` | Full end-of-game summary — section-based layout: header, metrics, charts, wait/service bar, analysis |
| `src/components/game/PostRunCharts.tsx` | Recharts line charts — throughput over time + queue length over time |
| `src/components/game/__tests__/SimulationChart.test.tsx` | Unit tests — Simulation Lab chart hover chooses one nearest rendered series |
| `src/components/game/postrun/SummaryHeader.tsx` | Run outcome header — success/failure title, difficulty + cores + duration subheader |
| `src/components/game/postrun/MetricSections.tsx` | SUMMARY, LATENCY, CORE UTILIZATION sections with CSS progress bars per core |
| `src/components/game/postrun/AnalysisSection.tsx` | Prose analysis, observed response/service ratio, dispatcher bottleneck warning banner |
| `src/components/game/EducationalCharts.tsx` | Theory charts — Phase 1 saturation, Phase 2 reference curve, per-worker utilization, ideal server-pool capacity (not currently rendered) |
| `src/components/game/EducationalGlossary.tsx` | Expandable metric reference glossary — all queueing theory symbols, formulas, definitions (not currently rendered) |

## Config

| File | Description |
|---|---|
| `vite.config.ts` | Vite + Vitest config — React plugin, Tailwind plugin, `@` path alias, `/api` dev proxy, test environment |
| `tsconfig.json` | Root TypeScript config — references app + node |
| `tsconfig.app.json` | App TypeScript config — strict, path aliases |
| `tsconfig.node.json` | Node TypeScript config for Vite config and server files |
| `eslint.config.js` | ESLint config — browser and Node globals, no-console, `_`-prefixed args ignored |
| `package.json` | Dependencies and npm scripts (`dev`, `dev:vite`, `dev:api`, `db:migrate`, `build`, `lint`, `test`, `test:watch`) |
| `index.html` | HTML entry point |
| `scripts/dev.mjs` | Local dev supervisor that runs API and Vite dev servers together |

## Design

| File | Description |
|---|---|
| `design/design.md` | Design index — links to all spec files |
| `design/overview.md` | Project overview, goals, MVP scope, success criteria |
| `design/phases.md` | Phase 1 calibration/runs and future Phase 2 scope boundary |
| `design/simulation.md` | Task model, Phase 1 arrival/service model, and future Phase 2 boundary |
| `design/interaction.md` | Player interaction model, dispatch mechanics |
| `design/scoring.md` | Score formula and secondary performance grades |
| `design/metrics.md` | Metric definitions (throughput, latency, utilization, etc.) |
| `src/data/educationalManual.ts` | Educational Manual page content and text segment metadata |
| `src/data/instructional.ts` | Later phase popup instructional content |
| `src/data/glossary.ts` | `GlossaryEntry` type + `GLOSSARY` array — all metric symbols, formulas, definitions |
| `design/tech.md` | Stack choices and game loop architecture |
| `design/ui.md` | App-wide visual system — product feel, stack/cost rule, color tokens, typography, layout, primitives, and screen rules |
| `design/difficulty.md` | Calibrated Phase 1 difficulty bins, provisional offsets, and target loads |
| `design/future.md` | Planned future features (Phase 3, preemption, migration) |
