# Technical Design

## Platform

Browser game. No persistent accounts or cloud backend in MVP. Deployed as a static bundle — shareable via a single URL.

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

Next.js is a full-stack SSR framework. This game has no backend, no API routes, no SEO requirements, and no server components. The App Router model actively conflicts with a 100% client-side game loop. Vite produces a static bundle that is trivially deployable and shareable.

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
