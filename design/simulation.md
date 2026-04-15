# Simulation Model

## Task Model

Each task represents a unit of service demand. Tasks have variable size to produce realistic scheduling tradeoffs.

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

Tasks arrive over time according to a load curve.

### Recommended MVP approach

* Begin at a manageable rate.
* Increase arrival pressure over time.
* Use staged ramps or waves rather than purely random spikes.
* Add some variability so the system does not feel fully deterministic.

### Three observable load regimes

| Regime | Behavior |
|---|---|
| Low | Queue remains short, latency is stable |
| Moderate | Queue begins to form, dispatch delay matters |
| High | Queue grows rapidly, latency spikes, failures become likely |

## Phase 1 Service Model

The player processes tasks directly by typing. Performance is measured as a typing-based service rate.

### Possible calibration outputs

* Tasks completed per second
* Average effective service time per task type
* Accuracy-adjusted throughput

### Recommended baseline

Convert the player's measured performance into a per-task service rate. Use this rate as the processing speed of each automatic core in Phase 2.

## Phase 2 Service Model

Each core automatically processes assigned work at the baseline speed derived from Phase 1.

Once a task is assigned to a core:
* It begins service when the core becomes active on it.
* It runs to completion.
* It is not preempted.
* It is not migrated.

This produces a clean run-to-completion dispatch model.
