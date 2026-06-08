# Contributing

Total Throughput is a Vite/React/TypeScript instructional game for learning
throughput, latency, queueing, utilization, and scheduling through typing-based
simulation.

## Local Setup

```bash
git clone https://github.com/ltsasaya/TotalThroughput.git
cd TotalThroughput
npm install
npm run dev
```

The Vite dev server prints the local URL, usually `http://localhost:5173`.

## Useful Commands

```bash
npm test
npm run lint
npm run build
npm run preview
```

- `npm test`: run Vitest once.
- `npm run lint`: run ESLint.
- `npm run build`: type-check and build the production bundle.
- `npm run preview`: preview the built app locally.

## Project Map

- `src/`: React app, simulation logic, Zustand store, tests, and types.
- `design/`: product, simulation, metrics, UI, and technical specs.
- `files.md`: source file index.
- `PROJECT_STATUS.md`: current state, recent work, remaining work, and
  verification summary for teammates.

## Development Workflow

1. Create a feature branch from `main`.
2. Read `design/design.md` and the relevant design docs before changing
   behavior.
3. Keep changes scoped to the feature or bug being addressed.
4. Add or update tests for changed simulation, store, API, or UI behavior.
5. Run `npm test`, `npm run lint`, and `npm run build`.
6. Update `files.md` if the source layout changes.
7. Open a pull request with the problem, solution, test results, and any known
   follow-up.

## Code Expectations

- Keep the architecture simple.
- Prefer existing patterns over new abstractions.
- Avoid barrel exports and unused imports.
- Do not leave debug logging in production code.
- Keep UI copy short and tied to the learning objective.
- Treat performance metrics and simulation math as user-facing behavior.

## Database/API Direction

The current app is browser-only. The planned deployed direction is a small
TypeScript API plus managed Postgres for typing runs, generated tasks, task
events, and summary metrics.

When backend work begins:

- Keep generated typing tasks server-owned.
- Validate every API request body.
- Use parameterized SQL.
- Keep the browser away from database credentials.
- Store only the raw typing data needed for the teaching feature.
