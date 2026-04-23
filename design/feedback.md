# Feedback and Instructional Layer

Educational elements are optional and should not interrupt fast play.

## Instructional Popups

Four modal popups gate phase transitions. Each is dismissed by any keypress or outside click (card click does not dismiss).

| Popup | Trigger | Content |
|---|---|---|
| prePhase1 | Player clicks "Start Game" | What calibration simulates; how the typing mechanic works (backspace to correct, task only completes when all chars match) |
| postPhase1 | Phase 1 ends | Throughput, service time, dropped tasks explained; Little's Law reference |
| prePhase2 | Player clicks "Start Phase 2" | What scheduling simulates; idle cores = wasted capacity; FIFO vs free dispatch |
| postPhase2 | Phase 2 ends | Utilization, queueing delay (wait/service ratio), throughput ratio; how model differs from a real OS scheduler |

Popup content lives in `src/data/instructional.ts`. Component is `src/components/game/InstructionalPopup.tsx`.

## Live Feedback

Displayed during gameplay:
* Queue length indicator
* Current throughput
* Active core utilization
* Number of dropped tasks
* Latency warning when waiting time begins to spike
* (Phase 1) Error count badge — number of incorrect characters in current task

## Post-Run Summary

The game generates text explanations tied to the player's actual performance.

### Example explanations

* "Your single-core service rate was high enough to keep the queue stable early in the run, but once arrival rate exceeded capacity, waiting time increased rapidly."
* "In Phase 2, ideal throughput rose with the number of cores, but actual throughput stayed lower because dispatch delay prevented full utilization."
* "Your queue remained nonempty while some cores were briefly idle, indicating scheduler bottleneck rather than worker bottleneck."

## Optional Theory Overlay

Toggleable explanations for:
* Arrival rate vs service rate
* Why queue length matters
* Why response time includes waiting time
* Why more workers do not automatically guarantee low latency
