# Metrics Definitions

These metrics support server-performance gameplay and the broader systems
lessons that generalize from it. They should be defined consistently
throughout the codebase.

| Metric | Definition |
|---|---|
| **Throughput** | Completed tasks per unit time |
| **Arrival Rate** | Incoming tasks per unit time, written as `lambda` |
| **Service Time** | Time spent actively processing a task once work begins |
| **Service Demand** | Mean time one request occupies a server worker or service center, written as `D` |
| **Waiting Time** | Time between task arrival and service start |
| **Response Time** | Time from task arrival to task completion (`waiting time + service time`) |
| **Worker Utilization** | Fraction of time a worker is actively processing work |
| **Load Factor** | For one server, `lambda * D`; for `c` workers, `lambda * D / c` |
| **Ideal Throughput** | Expected throughput if all workers stayed fully busy with zero coordination cost |
| **Actual Throughput** | Observed completed work under the player's real dispatch decisions |

## Response Time Formula

```
response time = waiting time + service time
```

## Reference Queueing Formula

For a stable, steady-state, single-server FIFO reference model:

```
U = lambda * D
N = lambda * R
R ~= D / (1 - U)
```

Gameplay summaries should present this as a back-of-napkin reference model. It
is not an exact guarantee for one finite stochastic run.

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

Without these timestamps the game cannot compute instructional metrics correctly.
