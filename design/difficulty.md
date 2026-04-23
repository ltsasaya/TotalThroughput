# Difficulty Modes

All difficulties use the same 4-bucket arrival model (A 0-5s, B 5-20s, C 20-40s, D 40-50s; no arrivals in 50-60s tail). They differ in **workload budgets** per bucket (total pressure + curve shape), reference WPM (drives size no-spawn zones for Phase 1), core count, deadline tightness, and queue/drop tolerance. Each task costs `S=1`, `M=2`, `L=3` workload units toward its bucket's budget; total task count per run therefore varies modestly while total pressure stays stable.

## Beginner Mode

* FIFO-only dispatch
* Reference WPM: **40** (generous no-spawn zones — L tasks disappear after ~30s)
* Phase 1 budgets: `[1, 2, 4, 4]`
* Phase 2 budgets: `[1, 3, 9, 8]`
* Phase 2 cores: 4
* Deadline multiplier: 1.25 (25% more time)
* Phase 1 queue size limit: 6, drop limit: 4
* Clearer task type indicators, fewer visible tasks

## Standard Mode

* Player chooses among visible queued tasks
* Reference WPM: **70**
* Phase 1 budgets: `[1, 3, 4, 6]`
* Phase 2 budgets: `[1, 6, 14, 15]`
* Phase 2 cores: 4
* Deadline multiplier: 1.0
* Phase 1 queue size limit: 6, drop limit: 5
* Coarse size estimates only

## Hard Mode

* Reference WPM: **100**
* Phase 1 budgets: `[3, 5, 5, 8]`
* Phase 2 budgets: `[3, 8, 23, 25]` — heavy main body + sustained peak
* Phase 2 cores: 6
* Deadline multiplier: 0.75 (tighter deadlines)
* Phase 1 queue size limit: 5, drop limit: 3
* Bucket A weight lands immediately (≥3 workload units in first 5s)
* Stronger penalties for drops and queue growth

## Theory Mode

* Same budgets and reference WPM as Standard
* Exact task service time is revealed (`showTrueServiceDemand = true`)
* Designed for comparison to idealized scheduling policy
* Useful for instruction rather than competition
