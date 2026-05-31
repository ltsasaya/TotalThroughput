# Feedback and Instructional Layer

Educational elements are optional and should not interrupt fast play.

## Instructional Popups

Four modal popups gate phase transitions. Each is dismissed by any keypress or outside click (card click does not dismiss).

| Popup | Trigger | Content |
|---|---|---|
| prePhase1 | Player clicks "Start Game" | Clients send RPCs to one server; how the typing mechanic works (backspace to correct, task only completes when all chars match) |
| postPhase1 | Phase 1 ends | Throughput, service demand, waiting time, response time, Little's Law reference |
| prePhase2 | Player clicks "Start Phase 2" | The RPC server now has a worker pool; idle workers = wasted capacity; FIFO dispatch |
| postPhase2 | Phase 2 ends | Utilization, queueing delay (wait/service ratio), throughput ratio; how the server model generalizes to larger systems |

Popup content lives in `src/data/instructional.ts`. Component is `src/components/game/InstructionalPopup.tsx`.

## Live Feedback

Displayed during gameplay:
* Queue length indicator
* Current throughput
* Arrival rate for the current level
* Active worker utilization
* Number of dropped tasks
* Latency warning when waiting time begins to spike
* (Phase 1) Error count badge — number of incorrect characters in current task

## Post-Run Summary

The game generates text explanations tied to the player's actual performance.

### Example explanations

* "Your single-server service rate was high enough to keep the queue stable early in the run, but once arrival rate exceeded capacity, waiting time increased rapidly."
* "In Phase 2, ideal RPC throughput rose with the number of server workers, but actual throughput stayed lower because dispatch delay prevented full utilization."
* "Your RPC queue remained nonempty while some workers were briefly idle, indicating a dispatcher bottleneck rather than a worker bottleneck."

### Back-of-napkin derivation

Post-run feedback should connect the player's data to the course derivation:

```
U = lambda * D
N = lambda * R
R ~= D / (1 - U)
```

Explain the assumptions: stable load, FIFO, one service center, steady state,
and Poisson arrivals. For one short stochastic run, phrase comparisons as
"reference model" or "back-of-napkin estimate" rather than exact prediction.

## Optional Theory Overlay

Toggleable explanations for:
* Arrival rate vs service rate
* Why queue length matters
* Why response time includes waiting time
* Why more workers do not automatically guarantee low latency
* Why p95/max response time can be worse than the average
* How client/RPC request-response maps to systems beyond one server
