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
| **Unfinished Work** | Admitted work that remains incomplete when the observation window ends; excluded from completed throughput and completed-request averages |

## WPM Convention

WPM always means standard typing-test WPM, matching tools such as Monkeytype:

```
WPM = (characters / 5) / minutes
```

For calibration, use correct characters divided by five over the 30-second
window. For completed request typing speed, use the completed prompt character
count divided by five over active typing minutes. Do not calculate WPM by
counting actual space-delimited words.

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

## Browser-Only Phase 1 Run Record

Until API/database work resumes, each one-minute Phase 1 difficulty run should
produce a frontend-owned record with these fields:

| Field | Meaning |
|---|---|
| **Average response time** | Mean `completionTime - arrivalTime` for completed requests |
| **Average service demand** | Mean active typing service time for completed requests, written as `D` |
| **Total Throughput** | Count of completed requests during the 60-second run |
| **Average typing speed** | Mean WPM while actively typing completed requests |
| **Reaction speed** | Mean time from request activation to first keystroke |
| **Utilization %** | Observed busy typing time divided by the 60-second run window |
| **Average queue length** | Time-average waiting queue length over the 60-second run window |
| **Max queue length** | Highest waiting queue length reached during the run; retained as a diagnostic, not the primary teaching metric |

The browser record should also keep the calibrated WPM/bin, selected difficulty
range, configured `lambda`, target load, arrival count, still-waiting count,
seed, and any reference response-time value shown to the player. The
still-waiting or unfinished count is diagnostic only and must not be added to
completed throughput, response time, service demand, typing speed, or reaction
speed. These fields are not persistence work yet; they keep the frontend record
shape ready for the later server-owned model.

Persisted playerbase dataset work is deferred. The browser record shape should
be stable enough to migrate later, but no API or database call is part of the
browser-only slice.

## Browser-Only Simulation Lab Metrics

The Learn More / Simulation lab reports finite-run observations from a seeded
local M/M/c-style simulation:

| Metric | Meaning |
|---|---|
| **Requests in system (N)** | Jobs that have arrived and have not completed at the sampled time |
| **Waiting queue length** | Jobs that have arrived but have not started service at the sampled time |
| **Response time (R)** | Cumulative average completion time minus arrival time for jobs completed so far |
| **Utilization (U)** | Cumulative busy worker time divided by `c * elapsedTime` |
| **Arrival rate (lambda)** | Cumulative arrivals divided by elapsed time |
| **Throughput (X)** | Cumulative completions within the observation window divided by elapsed time |

The lab also computes a steady-state M/M/c reference using Erlang C when
`lambda * D / c < 1`. Treat that reference as the expected stable-system
comparison, not as the exact result of a finite seeded run.
