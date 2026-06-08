# Metrics Definitions

These metrics support server-performance gameplay and the broader systems
lessons that generalize from it. They should be defined consistently
throughout the codebase.

| Metric | Definition |
|---|---|
| **Throughput** | Completed tasks per unit time |
| **Arrival Rate** | Incoming tasks per unit time during the arrival window, written as `lambda` |
| **Service Time** | Time spent actively processing a task once work begins |
| **Service Demand** | Mean time one request occupies a server worker or service center, written as `D` |
| **Waiting Time** | Time between task arrival and service start |
| **Response Time** | Time from task arrival to task completion (`waiting time + service time`) |
| **Worker Utilization** | Fraction of time a worker is actively processing work |
| **Offered Load / Load Factor** | For one server, `rho ~= lambda * D`; for `c` workers, `lambda * D / c` |
| **Ideal Throughput** | Expected throughput if all workers stayed fully busy with zero coordination cost |
| **Actual Throughput** | Observed completed work under the player's real dispatch decisions |
| **Still Waiting** | Admitted work that remains unfinished when the observation window ends |

## Response Time Formula

```
response time = waiting time + service time
```

## Reference Queueing Formula

For a stable, steady-state, single-server reference model:

```
rho ~= lambda * D
N = lambda * R
R ~= D / (1 - rho)
```

The response curve is simple M/M/1 intuition. Gameplay summaries should present
it as a back-of-napkin reference model, not an exact guarantee for one finite
stochastic run or for Phase 1's player-dependent M/G/1-style service.

For a server pool, report average per-worker load as `lambda * D / c` or
observed average worker utilization. Do not label that value as aggregate
single-server `U = XD`.

## Data Tracking Requirements

The system must record event timestamps for:
* Arrival
* Dispatch
* Start of service
* Completion
* Drop or expiration
* Arrival-window end and observation-window end

Without these timestamps the game cannot compute instructional metrics correctly.
