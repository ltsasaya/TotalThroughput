# Project Status

Last updated: 2026-06-09

## Current State

Total Throughput is a browser-only Vite, React, and TypeScript instructional
game focused on server performance. The current branch contains the semi-retro
monochrome player flow from start screen to Game Menu, Educational Manual,
calibration, difficulty selection, one-minute Phase 1 runs, and browser-session
run summaries.

## Recent Work

- Rebuilt the start screen with the approved monochrome sample direction.
- Added the Game Menu as the recurring hub after `Play`, calibration, and run
  summaries.
- Added a modal Educational Manual over the Game Menu with request/response,
  request queue, and calibration setup pages.
- Added the 30-second calibration typing test with five generated rows, no
  layout-shifting start prompt, WPM, accuracy, and a completion summary card.
- Added calibrated Easy, Medium, Hard, and Impossible difficulty cards using
  browser-only WPM bins and target loads.
- Added persistent `Home` and `Game Menu` navigation with unsaved-run notices.
- Added local rulebook coverage for header typography, calibration typing UI,
  manual discovery, and manual icon styling.

## Remaining Work

- Continue the next round of work on active one-minute run gameplay and run
  summary tuning.
- Review calibrated gameplay assumptions before backend work resumes.
- Add the small TypeScript API planned for persisted run and task data.
- Add managed Postgres schema and migrations for runs, tasks, events, and
  summary metrics.
- Connect the finalized browser-owned run model to server-owned task generation
  and run reloads.

## Verification

- `git diff --check`: passed
- `npm test`: passed, 132 tests
- `npm run lint`: passed
- `npm run build`: passed with Vite's existing large chunk warning
- Browser QA: Start -> Game Menu -> Manual -> Calibration -> Summary -> Game
  Menu passed at desktop size; calibration summary also passed at mobile width
  with no horizontal overflow.
