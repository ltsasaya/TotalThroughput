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

## Store

| File | Description |
|---|---|
| `src/store/gameStore.ts` | Zustand store — browser-only calibration, difficulty selection, calibrated Phase 1 runs, Phase 2 compatibility, persistent navigation, typing/tick/reset actions |
| `src/store/__tests__/gameStore.test.ts` | Unit tests — calibration, difficulty selection, calibrated Phase 1 run transitions, run records, persistent navigation, reset |
| `src/store/__tests__/gameStore.phase2.test.ts` | Unit tests — Phase 2: startPhase2, dispatchTask, core progress, completion, metrics, end condition |

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
| `src/simulation/phase2Runs.ts` | Phase 2 server-pool run config builder — target per-worker load, measured-D lambda, seeds, size mix, and Poisson schedule helper |
| `src/simulation/phase2Tick.ts` | `computePhase2Tick` — pure Phase 2 tick: arrivals, core progress, completion, idle waste, RunSummary + grade computation |
| `src/simulation/__tests__/content.test.ts` | Unit tests — task generation, Phase 1 medium prompts, word count ranges per size, exact deadline values |
| `src/simulation/__tests__/arrival.poisson.test.ts` | Unit tests — seeded Poisson arrival schedule determinism, bounds, expected count, default size bucket, weighted mix, and invalid inputs |
| `src/simulation/__tests__/calibration.test.ts` | Unit tests — calibration WPM/binning, clamping, difficulty derivation, and row-window movement |
| `src/simulation/__tests__/phase1Results.test.ts` | Unit tests — Phase 1 gate/demo result math and aggregate unlock rules |
| `src/simulation/__tests__/phase1Runs.test.ts` | Unit tests — calibrated run lambda, deterministic run schedule, browser-only run record metrics |
| `src/simulation/__tests__/phase1Tick.test.ts` | Unit tests — computePhase1RunTick: no-drop run timing, Phase 1 prompt spawning, activation, live metrics |
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
| `src/components/game/RetroHeader.tsx` | Shared semi-retro placeholder header with persistent Home/Game Menu navigation and placeholder instructor/Sign In controls |
| `src/components/game/StartScreen.tsx` | Idle phase — semi-retro monochrome start screen with placeholder nav/actions and `Play` handoff to the Game Menu |
| `src/components/game/EducationalManual.tsx` | Play-to-Game-Menu onboarding manual — modal/full-screen manual shell, page navigation, close/home handoff, and page-specific diagrams |
| `src/components/game/EducationalManualDiagrams.tsx` | Semi-retro SVG diagrams for Educational Manual pages |
| `src/components/game/CalibrationView.tsx` | 30-second monkeytype-style calibration screen with a fixed five-row generated-row viewport, start overlay, and live WPM/accuracy |
| `src/components/game/CalibrationSummaryView.tsx` | Post-calibration summary card — WPM, accuracy, display bin, recalibrate, and Game Menu actions |
| `src/components/game/DifficultySelectView.tsx` | Game Menu — pre-calibration manual/calibration hub, calibrated Easy/Medium/Hard/Impossible run selection, and browser-session run record list |
| `src/components/game/TopBar.tsx` | Shared active-run header — persistent Home/Game Menu navigation, phase label, countdown timer, optional dropped counter, queue display, optional score |
| `src/components/game/Phase1View.tsx` | Calibrated 60-second single-server typing run — active request, FIFO queue, countdown, live stats sidebar |
| `src/components/game/Phase1RunSummary.tsx` | Browser-only Phase 1 run summary — recorded metrics, setup values, finite-run/reference formula caveat, continue/recalibrate actions |
| `src/components/game/Phase1Complete.tsx` | Legacy post-Phase-1 level summary retained for compatibility while the new workflow uses `Phase1RunSummary` |
| `src/components/game/Phase2View.tsx` | Phase 2 server-pool layout — TopBar + QueuePanel + worker grid + StatsPanel |
| `src/components/game/QueuePanel.tsx` | Scrollable list of waiting requests — NEXT marker, waiting time color coding |
| `src/components/game/CoreCard.tsx` | Individual worker display — idle/busy status, progress bar, dispatch target pulsing |
| `src/components/game/StatsPanel.tsx` | Live stats sidebar — throughput vs ideal, queue length, worker utilization, wait time, counts |
| `src/components/game/PostRunSummary.tsx` | Full end-of-game summary — section-based layout: header, metrics, charts, wait/service bar, analysis |
| `src/components/game/PostRunCharts.tsx` | Recharts line charts — throughput over time + queue length over time |
| `src/components/game/postrun/SummaryHeader.tsx` | Run outcome header — success/failure title, difficulty + cores + duration subheader |
| `src/components/game/postrun/MetricSections.tsx` | SUMMARY, LATENCY, CORE UTILIZATION sections with CSS progress bars per core |
| `src/components/game/postrun/AnalysisSection.tsx` | Prose analysis, observed response/service ratio, dispatcher bottleneck warning banner |
| `src/components/game/EducationalCharts.tsx` | Theory charts — Phase 1 saturation, Phase 2 reference curve, per-worker utilization, ideal server-pool capacity (not currently rendered) |
| `src/components/game/EducationalGlossary.tsx` | Expandable metric reference glossary — all queueing theory symbols, formulas, definitions (not currently rendered) |

## Config

| File | Description |
|---|---|
| `vite.config.ts` | Vite + Vitest config — React plugin, Tailwind plugin, `@` path alias, test environment |
| `tsconfig.json` | Root TypeScript config — references app + node |
| `tsconfig.app.json` | App TypeScript config — strict, path aliases |
| `tsconfig.node.json` | Node TypeScript config for Vite config file |
| `eslint.config.js` | ESLint config — typescript-eslint, no-console, `_`-prefixed args ignored |
| `package.json` | Dependencies and npm scripts (`dev`, `build`, `lint`, `test`, `test:watch`) |
| `index.html` | HTML entry point |

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
