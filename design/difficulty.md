# Difficulty Modes

All difficulties use seeded constant-rate Poisson arrivals. They differ in
reference WPM, reference load factors, expected arrivals, worker count,
task-size mix, and queue/drop tolerance.

For Phase 1, reference load factor is relative to a single-server reference
capacity. It is a tuning value, not measured utilization:

```
referenceLoad = lambda * D_ref
```

For Phase 2, target load is per server worker:

```
targetPerWorkerLoad = lambda * D_player / workerCount
```

Phase 1 MVP levels use fixed seeds. Stable gated levels must pass before Phase
2 unlocks by collecting enough completed samples with acceptable served-client
response time; near-saturation or overload demo levels advance after the timer
and teach backlog growth without blocking.

## Beginner Mode

* FIFO-only dispatch
* Reference WPM: **40**
* Phase 1 reference loads: `0.55`, `0.75`, `0.90`
* Phase 1 expected arrivals per level: 10-12
* Phase 2 target per-worker load: `0.50`
* Phase 2 workers: 4
* Deadline multiplier: 1.25 (25% more time)
* Phase 1 has no punitive drops; unfinished work is reported as still waiting
* Clearer task type indicators, fewer visible tasks

## Standard Mode

* FIFO dispatch to idle workers
* Reference WPM: **70**
* Phase 1 reference loads: `0.40`, `0.55`, `0.75`, `0.90`, `1.05`
* Phase 1 expected arrivals per level: 12-16
* Phase 2 target per-worker load: `0.70`
* Phase 2 workers: 4
* Deadline multiplier: 1.0
* Phase 1 has no punitive drops; unfinished work is reported as still waiting
* Coarse size estimates only

## Hard Mode

* Reference WPM: **100**
* Phase 1 reference loads: `0.55`, `0.75`, `0.90`, `1.05`, `1.20`
* Phase 1 expected arrivals per level: 16
* Phase 2 target per-worker load: `0.85`
* Phase 2 workers: 6
* Deadline multiplier: 0.75 (tighter deadlines)
* Phase 1 has no punitive drops; unfinished work is reported as still waiting
* Stronger penalties for Phase 2 drops and queue growth

## Theory Mode

* Same reference WPM and reference loads as Standard
* Exact task service time is revealed (`showTrueServiceDemand = true`)
* Uses fixed seeds for repeatable comparison
* Useful for instruction rather than competition
