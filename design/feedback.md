# Feedback and Instructional Layer

Educational elements are optional and should not interrupt fast play.

## Instructional Popups

Four modal popups gate phase transitions. Each is dismissed by any keypress or outside click (card click does not dismiss).

| Popup | Trigger | Content |
|---|---|---|
| prePhase1 | Player clicks "Start Game" | Clients send RPCs to one server; how the typing mechanic works (backspace to correct, task only completes when all chars match) |
| postPhase1 | Phase 1 ends | Throughput, completed-sample service demand, served-client response time, backlog/still-waiting work, Little's Law reference |
| prePhase2 | Player clicks "Start Phase 2" | The RPC server now has a worker pool; idle workers = wasted capacity; FIFO dispatch |
| postPhase2 | Phase 2 ends | Utilization, queueing delay (wait/service ratio), throughput ratio; how the server model generalizes to larger systems |

Popup content lives in `src/data/instructional.ts`. Component is `src/components/game/InstructionalPopup.tsx`.

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
* "In Phase 2, ideal RPC throughput rose with the number of server workers, but actual throughput stayed lower because dispatch delay prevented full utilization."
* "Your RPC queue remained nonempty while some workers were briefly idle, indicating a dispatcher bottleneck rather than a worker bottleneck."

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
* How client/RPC request-response maps to systems beyond one server
