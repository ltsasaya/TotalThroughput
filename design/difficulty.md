# Difficulty Modes

All difficulties use seeded constant-rate Poisson arrivals. They differ in
reference WPM, target load factors, expected arrivals, worker count, task-size
mix, and queue/drop tolerance.

For Phase 1, target load factor is relative to a single-server reference
capacity:

```
targetLoad = lambda * D_ref
```

For Phase 2, target load is per server worker:

```
targetPerWorkerLoad = lambda * D_player / workerCount
```

Initial candidate Phase 1 level loads are `0.35`, `0.55`, `0.75`, `0.90`, and
`1.05`. Introductory levels should use fixed seeds. Free play can use random
but replayable seeds.

## Beginner Mode

* FIFO-only dispatch
* Reference WPM: **40**
* Phase 1 target loads: `0.35`, `0.55`, `0.75`
* Phase 1 expected arrivals per level: 12
* Phase 2 target per-worker loads: `0.50`, `0.70`
* Phase 2 workers: 4
* Deadline multiplier: 1.25 (25% more time)
* Phase 1 has no drops
* Clearer task type indicators, fewer visible tasks

## Standard Mode

* FIFO dispatch to idle workers
* Reference WPM: **70**
* Phase 1 target loads: `0.35`, `0.55`, `0.75`, `0.90`, `1.05`
* Phase 1 expected arrivals per level: 12-16
* Phase 2 target per-worker loads: `0.50`, `0.70`, `0.85`
* Phase 2 workers: 4
* Deadline multiplier: 1.0
* Phase 1 has no drops
* Coarse size estimates only

## Hard Mode

* Reference WPM: **100**
* Phase 1 target loads: `0.55`, `0.75`, `0.90`, `1.05`, `1.20`
* Phase 1 expected arrivals per level: 16
* Phase 2 target per-worker loads: `0.70`, `0.85`, `0.95`
* Phase 2 workers: 6
* Deadline multiplier: 0.75 (tighter deadlines)
* Phase 1 has no drops
* Stronger penalties for drops and queue growth

## Theory Mode

* Same reference WPM and target loads as Standard
* Exact task service time is revealed (`showTrueServiceDemand = true`)
* Uses fixed seeds for repeatable comparison
* Useful for instruction rather than competition
