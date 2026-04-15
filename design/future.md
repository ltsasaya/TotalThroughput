# Planned Advanced Features

These are not MVP requirements but should be preserved in the product direction.

## Preemption Mode

The player may interrupt a running task and reassign attention, but pays a cost (lost progress, delay, or context-switch overhead).

Use case: teach responsiveness vs overhead.

## Migration Mode

A task may move from one core to another with a penalty.

Use case: teach rebalance cost and coordination tradeoffs.

## Memory-Thrashing Hard Mode

Tasks carry memory footprints. If too many active tasks exceed memory capacity, the system spends time on paging-like penalties instead of useful work.

Use case: teach textbook memory thrashing as distinct from scheduler overload.

## Phase 3: Workflow Mode

Some tasks create downstream tasks when completed.

Potential features:
* Fan-out on completion
* Dependency chains
* Bursts caused by completions
* Workflow-level latency measurement

Status: planned seriously for future work, out of MVP scope.
