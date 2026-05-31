# Simulation Model

## Task Model

Each task represents a server request with a unit of service demand. Tasks have
variable size to produce realistic dispatch tradeoffs.

Each task has:
* task ID
* arrival time
* estimated size bucket or type
* true service demand
* optional deadline or expiration time
* assigned core ID
* service start time
* completion time
* dropped or expired state

## Arrival Model

Tasks arrive from a **seeded constant-rate Poisson process**. Each playable
trial has one fixed arrival rate `lambda`; difficulty and level progression
change `lambda` between trials, not during a trial.

Inter-arrival times are sampled from an exponential distribution with mean
`1 / lambda`. The full schedule is pre-generated from a replayable seed before
the trial begins, sorted by arrival time, and stored with the run once
persistence exists.

### Trial sizing

Poisson schedules should be tuned by expected arrivals:

```
expectedArrivals = lambda * trialDuration
trialDuration = expectedArrivals / lambda
```

Minimum useful expected arrivals for teaching queue behavior is 12 per trial.
Use 12-16 for Phase 1 and 16-24 for Phase 2 when task text is short enough.
Below 12, Poisson count variance makes one run too noisy to interpret. Higher
counts are better statistically but can make typing levels too long.

Use fixed seeds for introductory/gated levels so students see comparable
scenarios. Use random but replayable seeds for free play.

### Task size distribution

Task sizes are sampled independently of arrival times. Phase 1 should be
S-heavy so the player sees enough arrivals in a short trial. Phase 2 may use a
wider S/M/L mix because automatic workers process assigned work.

The generator should avoid spawning work so late that the expected task cannot
finish before the trial ends unless the level deliberately includes a clear
queue-drain tail.

### Reference WPM

| Surface | Reference WPM |
|---|---|
| Phase 1 Beginner | 40 |
| Phase 1 Standard | 70 |
| Phase 1 Hard | 100 |
| Phase 2 (all difficulties) | 100 (fixed) |

Reference WPM converts typing text length into expected service demand for
tuning. Actual player typing determines observed service demand.

### Observable load regimes

Levels should teach these load regimes:

| Regime | Target load factor | Behavior |
|---|---|---|
| Low | 0.35-0.55 | Queue remains short, latency is stable |
| Moderate | 0.70-0.85 | Queue forms but often recovers |
| Near saturation | 0.90-0.98 | Response time becomes sensitive to small bursts |
| Overload | > 1.0 | Queue growth demonstrates instability |

For a single serial server, `loadFactor = lambda * D`. For `c` parallel server
workers, `perWorkerLoad = lambda * D / c`.

## Phase 1 Service Model

The player processes requests directly by typing. Performance is measured as a
typing-based single-server service rate.

### Possible calibration outputs

* Tasks completed per second
* Average effective service time per task type
* Accuracy-adjusted throughput

### Recommended baseline

Convert the player's measured performance into mean service demand `D`. Use
`D` as the processing time basis for each automatic server worker in Phase 2.

## Phase 2 Service Model

Each server worker automatically processes assigned work at the baseline speed
derived from Phase 1.

Once a task is assigned to a core:
* It begins service when the core becomes active on it.
* It runs to completion.
* It is not preempted.
* It is not migrated.

This produces a clean run-to-completion server-dispatch model.

## Reference Theory

The instructional reference model is intentionally back-of-napkin:

```
U = lambda * D
N = lambda * R
R ~= D / (1 - U)
```

This assumes a stable, steady-state, FIFO, single-server queue with independent
Poisson arrivals. It is a teaching reference, not an exact prediction for one
finite gameplay run. Multi-worker summaries may use the rough capacity
intuition `perWorkerLoad = lambda * D / c`, but exact M/M/c response time
should not be claimed unless the implementation uses Erlang C or
simulation-derived curves.
