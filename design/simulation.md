# Simulation Model

## Task Model

Each task represents a server request with a unit of service demand. Current
Phase 1 tasks are medium-length typing prompts and are not presented to players
as size buckets.

Each task has:
* task ID
* arrival time
* optional legacy/future estimated size bucket or request type
* true service demand
* optional deadline or expiration time
* assigned core ID
* service start time
* completion time
* dropped or expired state

## Arrival Model

Current Phase 1 runs generate tasks from a seeded constant-rate Poisson
process. Each playable trial has one fixed arrival rate `lambda`; difficulty
changes `lambda` between trials, not during a trial.

Inter-arrival times are sampled from an exponential distribution with mean
`1 / lambda`. The full schedule is pre-generated from a replayable seed before
the trial begins and sorted by arrival time.

TODO-006 keeps the arrival and seed strategy under review. Poisson arrivals are
useful because independent random arrivals approximate request traffic, but a
proof-of-concept dataset should not rely on one narrow deterministic seed path.
Collected runs should record seeds, and future data-collection work should
consider more diverse seeds and multiple-run aggregation before making claims
from the data.

### Trial sizing

Poisson schedules should be tuned by expected arrivals:

```
expectedArrivals = lambda * trialDuration
trialDuration = expectedArrivals / lambda
```

Minimum useful expected arrivals for teaching queue behavior is 12 per trial.
Use 12-16 for Phase 1 when task text is short enough. Medium-length prompts
produce a larger service-demand estimate and therefore lower arrival rates at
the same target load. Below 12, Poisson count variance makes one run too noisy
to interpret. Higher counts are better statistically but can make typing levels
too long.

Use fixed seeds for introductory/comparable runs where useful. Use random but
replayable seeds, or another BOSS-approved diverse seed strategy, when the goal
is data collection rather than a single comparable lesson.

### Task size distribution

Current Phase 1 uses deterministic medium-length request prompts. The medium
prompt length drives the calibration-derived service-demand estimate `D`, so
the configured arrival rate recalculates through `lambda = targetLoad / D`.
Do not present those requests to the player as `S`/`M`/`L` sizes. Any future
request size or type model depends on a BOSS-approved plan.

Phase 1 calibrated difficulty runs use a 60-second observation window. Work
unfinished at the end is tracked for diagnostics but excluded from completed
throughput and completed-request averages. Arrival rate, offered load, observed
throughput, and busy fraction use the 60-second run as their denominator.

### Calibration WPM bins

Phase 1 calibration produces a WPM baseline and assigns it to one fixed bin:

| Bin | WPM range |
|---:|---|
| 0 | 30-40 |
| 1 | 40-50 |
| 2 | 50-60 |
| 3 | 60-75 |
| 4 | 75-90 |
| 5 | 90-105 |
| 6 | 105-120 |
| 7 | 120-140 |
| 8 | 140-160 |
| 9 | 160-180 |
| 10 | 180-200 |

The WPM bin drives displayed difficulty ranges. Actual player typing determines
observed service demand `D`, which tunes the request arrival rate for a
selected run.

### Observable load regimes

Levels should teach these load regimes:

| Regime | Target load factor | Behavior |
|---|---|---|
| Low | 0.35-0.55 | Queue remains short, latency is stable |
| Moderate | 0.70-0.85 | Queue forms but often recovers |
| Near saturation | 0.90-0.98 | Response time becomes sensitive to small bursts |
| Overload | > 1.0 | Backlog at window end demonstrates capacity pressure |

For a single serial server, `rho ~= lambda * D`. In Phase 1, `D` is estimated
from completed served requests, so `rho` is a reference-load estimate rather
than an exact busy fraction.

## Phase 1 Service Model

The player processes requests directly by typing. Performance is measured as a
typing-based single-server service rate.

### Calibration outputs

* Calibration WPM
* Calibrated WPM bin
* Estimated typing service demand `D`
* Reaction speed from first key timing, where measurable

### Difficulty-run outputs

* Arrival count, served completions, unfinished work, response time, service
  demand, utilization, average typing speed, reaction speed, and average queue
* Single-worker reference capacity estimate `lambda_max = 1 / D`
* Configured reference load `rho ~= lambda * D`
* Observed finite-run metrics, kept separate from the reference response-time
  curve

### Recommended baseline

Convert the player's measured calibration performance into mean service demand
`D`. For a one-worker Phase 1 run, tune the selected difficulty as:

```
lambda = targetLoad / D
```

Do not use this `D` as a Phase 2 contract until BOSS defines the future Phase 2
concept.

## Future Phase 2 Service Model

The original Phase 2 server-pool service model is out of current scope. Treat
existing Phase 2 implementation and notes as historical context only unless
BOSS explicitly reuses them in a future Phase 2 plan.

When Phase 2 resumes, define its arrival model, service model, metrics, and
data-collection requirements from the new BOSS-approved concept.

## Reference Theory

The instructional reference model is intentionally back-of-napkin:

```
rho ~= lambda * D
N = lambda * R
R ~= D / (1 - rho)
```

The response curve above is simple stable M/M/1 intuition. Phase 1 itself is a
finite-run approximation to an M/G/1 single-server queue with FCFS service:
arrivals are Poisson, but player typing gives general, player-dependent service
times. Gameplay summaries should present finite-window observations separately
from steady-state reference intuition. Future multi-worker or multi-resource
summaries must define their own assumptions before using capacity or response
time formulas.
