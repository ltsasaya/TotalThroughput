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

Tasks arrive on a **stratified four-bucket schedule**, pre-generated when a phase starts. This replaces the earlier Poisson/exponential inter-arrival model to eliminate end-clustering and to guarantee a consistent task count per run.

### Fixed bucket boundaries (all phases are 60s)

| Bucket | Window | Role |
|---|---|---|
| A | 0-5s | intro — immediate engagement, no pressure |
| B | 5-20s | training — player proves they understand the core action |
| C | 20-40s | main body — real pressure begins |
| D | 40-50s | peak intensity |
| (tail) | 50-60s | final stretch — no new arrivals; in-flight work only |

Each difficulty declares a `BucketBudgets` tuple `[a, b, c, d]` for Phase 1 and Phase 2 (see `design/difficulty.md`). Buckets budget **workload units**, not task counts: each task contributes `S=1`, `M=2`, `L=3` units toward its bucket's budget, and the generator keeps emitting tasks until the bucket's cumulative workload meets or exceeds the budget. Within each bucket, each task's arrival time is sampled uniformly at random from that bucket's window. The full schedule is then sorted ascending.

### Per-bucket size distribution

Each bucket has its own size mix so task *difficulty* ramps in lockstep with volume — easy tasks dominate the intro, harder tasks concentrate at the peak:

| Bucket | S | M | L |
|---|---|---|---|
| A (intro) | 70% | 25% | 5% |
| B (training) | 55% | 35% | 10% |
| C (main body) | 40% | 40% | 20% |
| D (peak) | 25% | 40% | 35% |

Sizes are sampled from this mix, then filtered by the no-spawn zone below.

### Size-dependent no-spawn zones

A task of size X can only be placed at time `t` if `t < phaseDuration - noSpawnZoneMs(X, referenceWPM)`. The no-spawn zone is `(avgChars[size] / (refWPM * 5/60)) * 1.5` — expected typing time at the reference WPM, times a 1.5 safety buffer. If the sampled size is invalid for the chosen placement time, the generator resamples. S tasks are always valid within the 50s spawn window, so resampling always terminates.

### Reference WPM

| | Reference WPM |
|---|---|
| Phase 1 Beginner | 40 |
| Phase 1 Standard | 70 |
| Phase 1 Hard | 100 |
| Phase 2 (all difficulties) | 100 (fixed) |

Phase 1 scales the no-spawn zone to the expected player speed. Phase 2 uses a single universal reference so that faster typists naturally experience lower utilization (their cores drain the queue faster).

### Observable load regimes

The stratified ramp still produces three observable regimes over the course of a phase:

| Regime | Window | Behavior |
|---|---|---|
| Low | 0-20s | Queue remains short, latency is stable |
| Moderate | 20-40s | Queue begins to form, dispatch delay matters |
| High | 40-50s | Queue grows rapidly, latency spikes, failures become likely |

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
