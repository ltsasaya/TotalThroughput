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

Use fixed seeds for introductory/comparable runs where useful. Use random but
replayable seeds for free play.

### Task size distribution

Task sizes are sampled independently of arrival times. Current Phase 1 uses
S-only two-word request prompts so enough arrivals fit in each short level. Phase 2
may use a wider S/M/L mix because automatic workers process assigned work.

Phase 1 calibrated difficulty runs use a 60-second observation window. Work
unfinished at the end is reported as still waiting rather than drained or
dropped. Arrival rate, offered load, observed throughput, and busy fraction use
the 60-second run as their denominator.

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

For a single serial server, `rho ~= lambda * D`. For `c` parallel server
workers, `perWorkerLoad = lambda * D / c`. In Phase 1, `D` is estimated from
completed served requests, so `rho` is a reference-load estimate rather than an
exact busy fraction.

## Phase 1 Service Model

The player processes requests directly by typing. Performance is measured as a
typing-based single-server service rate.

### Calibration outputs

* Calibration WPM
* Calibrated WPM bin
* Estimated typing service demand `D`
* Reaction speed from first key timing, where measurable

### Difficulty-run outputs

* Arrival count, served completions, still-waiting work, response time, service
  demand, utilization, average typing speed, reaction speed, and max queue
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

Use `D` later as the processing-time basis for each automatic server worker if
Phase 2 is reconnected to the calibrated flow.

## Phase 2 Service Model

Each server worker automatically processes assigned work at the baseline speed
derived from Phase 1.

Phase 2 MVP builds one run from the selected difficulty and the Phase 1
completed-sample service demand `D`. The configured arrival rate is:

```
lambda = targetPerWorkerLoad * workerCount / D
```

The browser pre-generates one seeded constant-rate Poisson schedule for the
full 60-second Phase 2 arrival window. Beginner uses 4 workers at target
per-worker load `0.50`, Standard uses 4 workers at `0.70`, Hard uses 6 workers
at `0.85`, and Theory uses the Standard worker/load tuning with true service
demand visible.

Once a task is assigned to a core:
* It begins service when the core becomes active on it.
* It runs to completion.
* It is not preempted.
* It is not migrated.

This produces a clean run-to-completion server-dispatch model.

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
from steady-state reference intuition. Multi-worker summaries may use the rough
capacity intuition `perWorkerLoad = lambda * D / c`, but exact M/M/c response
time should not be claimed unless the implementation uses Erlang C or
simulation-derived curves.
