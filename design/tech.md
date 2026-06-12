# Technical Design

## Platform

Browser game for the MVP. The promoted post-MVP data slice adds a small
same-origin TypeScript API and managed Postgres database for simple accounts,
classes, profiles, and global run summaries. The local implementation runs a
Vite dev server plus a local Node API backed by `DATABASE_URL`; Vercel
deployment is deferred until the slice works locally.

## Stack And Cost Discipline

The stack should stay divided into the fewest practical parts. Every new
dependency, hosted service, database, external API, queue, worker, framework,
build tool, or paid tier is a deliberate expansion and must be justified before
implementation.

Before adding stack surface, document:

* Why the existing stack cannot cover the need.
* Whether the new part adds direct cost, usage-based cost, vendor lock-in, or
  operational maintenance.
* How it runs locally for development.
* How it is configured, deployed, backed up, and replaced.
* What simpler or no-cost alternatives were rejected.

Default posture: prefer boring TypeScript, one app process, same-origin API
routes, explicit SQL, one managed Postgres database when persistence is needed,
and no extra services until the requirement proves they are necessary.

## MVP Stack

| Piece | Choice | Reason |
|---|---|---|
| Build tool | Vite | Static bundle output, fast dev server, no SSR overhead |
| UI framework | React 19 | Component model fits management-sim update rates (10–20 ticks/sec) |
| Language | TypeScript | Type safety for simulation model (task events, timestamps, core state) |
| UI library | Tailwind CSS | Lightweight, flexible enough for game-like layouts without fighting a business-app aesthetic |
| State management | Zustand | Game loop runs outside React's render cycle; Zustand lets the loop write state that components subscribe to |
| Charts | Recharts | React-native, good time-series support, small API surface |
| Rendering | DOM / React | Canvas only if performance becomes an issue at high task counts |

## Why not Next.js

Next.js is still not part of the first data slice. The app keeps Vite/React and
adds a small Node API rather than moving the gameplay surface into an SSR
framework. A later Vercel deployment can adapt the same route handlers to
serverless functions if needed.

## Post-MVP Data Slice

- Database: managed Postgres, currently configured through `DATABASE_URL`.
- Server: small TypeScript Node API, explicit SQL migrations, `pg`, and
  bounded JSON request parsing.
- Auth: first-party username/password accounts with opaque HttpOnly session
  cookies. Session tokens are random, stored only as hashes in Postgres, and do
  not require a `SESSION_SECRET`.
- Classes: server-generated class codes, masked click-to-reveal instructor
  displays, code-only joining, instructor ownership checks, duplicate membership
  protection, and optional student name/ID requirements.
- Run data: this slice persists validated Phase 1 run summaries after completed
  signed-in runs. It does not yet move task schedule generation, task lifecycle
  events, or final metric computation fully to the server.
- Simulation Lab: only signed-in Run-button activity count is persisted. Seeds,
  inputs, samples, sweeps, and simulator output remain browser-only.
- Deployment: Vercel configuration is intentionally deferred until the local
  slice is implemented and verified.

## Game Loop Architecture

The simulation runs on a `setInterval` tick (target: 100ms intervals). Each tick:
1. Advances core progress
2. Checks for task arrivals per the load curve
3. Checks for task expirations
4. Updates the event log

All game state lives in Zustand. React components subscribe to slices they need. The loop writes state directly — no dependency on React's render cycle.

## Data Tracking Requirements

The system must record event timestamps for:
* Arrival
* Dispatch
* Start of service
* Completion
* Drop or expiration

See [metrics.md](metrics.md) for full definitions.
