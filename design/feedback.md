# Feedback and Instructional Layer

Educational elements are optional and should not interrupt fast play.

## Live Feedback

Displayed during gameplay:
* Queue length indicator
* Current throughput
* Active core utilization
* Number of dropped tasks
* Latency warning when waiting time begins to spike

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
