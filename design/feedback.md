# Feedback and Instructional Layer

Educational elements are optional and should not interrupt fast play after the
initial player workflow has set context.

## Educational Manual

The start flow uses a dedicated Educational Manual screen after `Play` and
before active Phase 1 play. This replaces the old `prePhase1` popup as the
primary onboarding surface for the server request/response premise.

The manual starts with the player as the server, introduces clients such as
**Player Name**, explains request/response flow, shows a simple client/server
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
for **Player Name** and other clients, improve client satisfaction by completing
work faster, minimize Response Time (`R`), and enter calibration so the game can
determine the player's red-highlighted level.

## Instructional Popups

Remaining modal popups gate later phase transitions. Each is dismissed by any
keypress or outside click (card click does not dismiss).

| Popup | Trigger | Content |
|---|---|---|
| postPhase1 | Phase 1 ends | Throughput, completed-sample service demand, served-client response time, backlog/still-waiting work, Little's Law reference |
| prePhase2 | Player clicks "Start Phase 2" | The server now has a worker pool; idle workers = wasted capacity; FIFO dispatch |
| postPhase2 | Phase 2 ends | Utilization, queueing delay (wait/service ratio), throughput ratio; how the server model generalizes to larger systems |

Manual content lives in `src/data/educationalManual.ts` and renders through
`src/components/game/EducationalManual.tsx`. Popup content lives in
`src/data/instructional.ts` and renders through
`src/components/game/InstructionalPopup.tsx`.

## Live Feedback

Displayed during gameplay:
* Queue length indicator
* Current throughput
* Arrival-window rate for the current level or Phase 2 run
* Target Phase 2 per-worker load when in the server-pool run
* Active worker utilization
* Number of dropped tasks
* (Phase 1) Completed sample count and still-waiting work
* Latency warning when waiting time begins to spike
* (Phase 1) Error count badge — number of incorrect characters in current task

## Post-Run Summary

The game generates text explanations tied to the player's actual performance.

### Example explanations

* "Your single-server service rate was high enough to keep the queue stable early in the run, but once sustained offered load approached capacity, waiting time increased rapidly."
* "Some clients were still waiting when observation ended. That backlog is evidence of overload during the burst, not a dropped-request penalty."
* "In Phase 2, ideal request throughput rose with the number of server workers, but actual throughput stayed lower because dispatch delay prevented full utilization."
* "Your request queue remained nonempty while some workers were briefly idle, indicating a dispatcher bottleneck rather than a worker bottleneck."

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
configured `lambda` for offered-load cards such as `lambda D / c`.

## Optional Theory Overlay

Toggleable explanations for:
* Arrival rate vs service rate
* Why queue length matters
* Why response time includes waiting time
* Why more workers do not automatically guarantee low latency
* Why p95/max response time can be worse than the average
* How client request-response maps to systems beyond one server
