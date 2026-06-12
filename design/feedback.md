# Feedback and Instructional Layer

Educational elements are optional and should not interrupt fast play after the
initial player workflow has set context.

## Educational Manual

The start flow uses a dedicated Educational Manual screen after `Play` and
before active Phase 1 play. This replaces the old `prePhase1` popup as the
primary onboarding surface for the server request/response premise.

The manual starts with the player as the server, introduces clients using the
signed-in username, explains request/response flow, shows a simple client/server
diagram, and then explains the client waiting consequence. The
first diagram follows BOSS's request sequence reference using a simplified client
computer, simplified server, dashed lifelines, request/response arrows, and
waiting/executing annotations.

The second page focuses only on queueing: the server contains a request queue
and a worker; incoming requests wait in the request queue when the worker is busy;
the queue shows three named waiting requests (`P1`, `P2`, `P3`) plus a
partial fourth slot to imply more buildup; the front request moves to the
worker when it is ready; and the server sends a response back to the client.
The main arrows show the closed client/server request-response loop. Secondary
arrows show other clients sending requests and receiving responses. The diagram
intentionally avoids the API concept and avoids a work-list inside the
server.

The third page explains the player's immediate objective: complete typing tasks
for the signed-in username and other clients, improve client satisfaction by completing
work faster, minimize Response Time (`R`), and enter calibration so the game can
determine the player's red-highlighted level.

## Instructional Popups

Remaining modal popups are legacy content unless the current player flow uses
them. Each is dismissed by any keypress or outside click (card click does not
dismiss).

| Popup | Trigger | Content |
|---|---|---|
| postPhase1 | Legacy Phase 1 completion | Throughput, completed-sample service demand, served-client response time, unfinished work, Little's Law reference |

The original Phase 2 instructional popups are out of current scope. Do not use
them as active product requirements unless BOSS reuses them in the future Phase
2 concept.

Manual content lives in `src/data/educationalManual.ts` and renders through
`src/components/game/EducationalManual.tsx`. Popup content lives in
`src/data/instructional.ts` and renders through
`src/components/game/InstructionalPopup.tsx`.

## Live Feedback

Displayed during gameplay:
* Queue length indicator
* Current throughput
* Arrival-window rate for the current run
* Observed utilization
* Completed sample count and unfinished work, if unfinished work remains shown
* Latency warning when waiting time begins to spike
* (Phase 1) Character-level typing state: incorrect characters turn red, receive
  a red underline, and the whole incorrect word receives a light red highlight.
  The red underline makes incorrectly typed spaces visible. Do not show a
  separate shifting error-count badge during the current run.

## Post-Run Summary

The game generates text explanations tied to the player's actual performance.

### Example explanations

* "Your single-server service rate was high enough to keep the queue stable early in the run, but once sustained offered load approached capacity, waiting time increased rapidly."
* "Some clients were unfinished when observation ended. Those requests are not counted in completed throughput or completed-request latency."

### Back-of-napkin derivation

Post-run feedback should connect the player's data to the course derivation:

```
rho ~= lambda * D
N = lambda * R
R ~= D / (1 - rho)
```

Explain the assumptions: stable load, FIFO, one service center, steady state,
Poisson arrivals, and the simple M/M/1 response curve. For one short stochastic
run, phrase comparisons as "reference model" or "back-of-napkin estimate"
rather than exact prediction. When a summary uses served-only response time,
pair it with observed completion throughput `X` as `N_served ~= X R`; keep
configured `lambda` for offered-load cards such as `lambda D`.

## Optional Theory Overlay

Toggleable explanations for:
* Arrival rate vs service rate
* Why queue length matters
* Why response time includes waiting time
* Why added capacity does not automatically guarantee low latency, once a
  future multi-resource or multi-worker phase is defined
* Why p95/max response time can be worse than the average
* How client request-response maps to systems beyond one server
