# Planned Advanced Features

These are not MVP requirements but should be preserved in the product direction.

## Preemption Mode

The player may interrupt a running request and reassign attention, but pays a
cost (lost progress, delay, or context-switch overhead).

Use case: teach responsiveness vs overhead.

## Migration Mode

A request may move from one worker to another with a penalty.

Use case: teach rebalance cost and coordination tradeoffs.

## Memory-Thrashing Hard Mode

Requests carry memory footprints. If too many active requests exceed memory
capacity, the system spends time on paging-like penalties instead of useful
work.

Use case: teach textbook memory thrashing as distinct from dispatcher overload.

## Final-Stretch UI (shipped 2026-04-21)

In the stretch after arrivals are exhausted (typically ~45-50s into a 60s
phase, once `nextArrivalIndex >= arrivalSchedule.length`), the UI shifts into
a high-urgency state: red-tinted backdrop, pulsing red timer, red accents on
the queue panel and idle workers, and a "No more requests incoming - clear the
queue" banner in the queue sidebar. Reinforces the queueing-theory intuition
that the backlog at the end determines final throughput.

## Phase 3: Workflow Mode

Some requests create downstream requests when completed.

Potential features:
* Fan-out on completion
* Dependency chains
* Bursts caused by completions
* Workflow-level latency measurement

Status: planned seriously for future work, out of MVP scope.
