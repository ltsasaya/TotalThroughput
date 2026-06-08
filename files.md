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
| `src/App.tsx` | Root component — mounts `useGameLoop`, routes to phase-specific views and debrief popups |
| `src/index.css` | Global styles — Tailwind v4 import plus Total Throughput visual tokens, panels, buttons, badges, formula callouts, and scrollbar helpers |
| `src/vite-env.d.ts` | Vite client type declarations |

## Types

| File | Description |
|---|---|
| `src/types/task.ts` | `Task`, `TaskEvent`, `TaskSize`, `TaskStatus`, `TaskEventType` |
| `src/types/core.ts` | `Core`, `CoreStatus` — internal worker/core model |
| `src/types/game.ts` | `GamePhase`, `DifficultyMode`, `LoadRegime`, `Phase1LevelConfig`, `Phase2RunConfig`, `GameConfig` |
| `src/types/metrics.ts` | `LiveMetrics`, `RunSummary`, `Phase1LevelResult`, `Phase1Result`, `GradeLevel`, `TimePoint` |

## Store

| File | Description |
|---|---|
| `src/store/gameStore.ts` | Zustand store — all game state + actions: `startGame`, `startPhase2`, `dispatchTask`, `selectTask`, `typeChar`, `tick`, `reset` |
| `src/store/__tests__/gameStore.test.ts` | Unit tests — Phase 1 store actions and tick |
| `src/store/__tests__/gameStore.phase2.test.ts` | Unit tests — Phase 2: startPhase2, dispatchTask, core progress, completion, metrics, end condition |

## Simulation

| File | Description |
|---|---|
| `src/simulation/content.ts` | Task word pools (S/M/L), Phase 2 `generateTask(...)`, and Phase 1 two-word `generatePhase1Task(...)` |
| `src/simulation/arrival.ts` | Seeded constant-rate Poisson arrival schedule generator shared by phase run builders |
| `src/simulation/phase1Levels.ts` | Phase 1 level table, fixed seeds, per-level durations, and Poisson schedule helper |
| `src/simulation/phase1Results.ts` | Phase 1 per-level and aggregate calibration result builders, including active-window rate and backlog/tail metrics |
| `src/simulation/phase1Tick.ts` | `computePhase1Tick` — pure no-drop Phase 1 tick: Poisson arrivals, activation, metrics, level-end flag |
| `src/simulation/phase2Runs.ts` | Phase 2 server-pool run config builder — target per-worker load, measured-D lambda, seeds, size mix, and Poisson schedule helper |
| `src/simulation/phase2Tick.ts` | `computePhase2Tick` — pure Phase 2 tick: arrivals, core progress, completion, idle waste, RunSummary + grade computation |
| `src/simulation/__tests__/content.test.ts` | Unit tests — task generation, Phase 1 two-word prompts, word count ranges per size, exact deadline values |
| `src/simulation/__tests__/arrival.poisson.test.ts` | Unit tests — seeded Poisson arrival schedule determinism, bounds, expected count, S-only default, weighted mix, and invalid inputs |
| `src/simulation/__tests__/phase1Results.test.ts` | Unit tests — Phase 1 gate/demo result math and aggregate unlock rules |
| `src/simulation/__tests__/phase1Tick.test.ts` | Unit tests — computePhase1Tick: no-drop level timing, Phase 1 prompt spawning, activation, live metrics |
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
| `src/components/game/RetroHeader.tsx` | Shared semi-retro placeholder header used by the start screen and Educational Manual |
| `src/components/game/StartScreen.tsx` | Idle phase — semi-retro monochrome start screen with placeholder nav/actions and `Play` handoff to the Educational Manual |
| `src/components/game/EducationalManual.tsx` | Play-to-Phase-1 onboarding screen — one-page manual shell, page count, close handoff, and RPC client/server diagram |
| `src/components/game/TopBar.tsx` | Shared header — phase label, countdown timer, optional dropped counter, queue display, optional score |
| `src/components/game/Phase1View.tsx` | Phase 1 typing interface — fixed-rate RPC level status, character-level word display, queue preview, live stats sidebar |
| `src/components/game/Phase1Complete.tsx` | Post-Phase-1 calibration results — gate/demo level summary, formulas, Phase 2 readiness |
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
| `design/phases.md` | Phase 1 (calibration) and Phase 2 (scheduling) details |
| `design/simulation.md` | Task model, arrival model, Phase 1 and 2 service models |
| `design/interaction.md` | Player interaction model, dispatch mechanics |
| `design/scoring.md` | Score formula and secondary performance grades |
| `design/metrics.md` | Metric definitions (throughput, latency, utilization, etc.) |
| `src/data/educationalManual.ts` | Educational Manual page content and text segment metadata |
| `src/data/instructional.ts` | Later phase popup instructional content |
| `src/data/glossary.ts` | `GlossaryEntry` type + `GLOSSARY` array — all metric symbols, formulas, definitions |
| `design/tech.md` | Stack choices and game loop architecture |
| `design/ui.md` | App-wide visual system — product feel, stack/cost rule, color tokens, typography, layout, primitives, and screen rules |
| `design/difficulty.md` | Beginner / standard / hard / theory mode differences |
| `design/future.md` | Planned future features (Phase 3, preemption, migration) |
