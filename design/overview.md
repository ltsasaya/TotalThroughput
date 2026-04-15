# Overview

## Summary

Total Throughput is a browser-based instructional game that teaches core ideas from system performance through direct play. The player first completes a single-core calibration phase, then transitions to a multi-core scheduling phase where they act as a centralized dispatcher.

The project is primarily a teaching tool. It should be enjoyable enough to motivate competition, but its core value is instructional.

## Primary Goals

* Teach throughput, queue growth, waiting time, service time, response time, utilization, and overload through gameplay.
* Show the difference between single-worker capacity and parallel-worker capacity.
* Demonstrate that more workers do not automatically produce proportional throughput gains when coordination becomes the bottleneck.
* Provide meaningful live metrics and post-run feedback that connect results to theory.
* Make latency control central to strong play.

## Secondary Goals

* Make the experience competitive enough for classroom use.
* Support repeated runs with different strategies and difficulty levels.
* Allow instructors or students to compare idealized theory with real play.

## Non-Goals for MVP

* Accurate modeling of every operating system scheduler detail.
* Distributed consensus, networking, or fault tolerance.
* Full preemption, migration, or memory models in the base mode.
* Phase 3 workflow execution.
* Multiplayer or networked competition.

## Product Positioning

Game-like teaching tool.

### Intended Use Cases

* Class demonstration in distributed systems or systems courses.
* Discussion section activity where students compete and then interpret results.
* Self-guided exploration of queueing and parallelism concepts.
* Simple visual aid for explaining why latency and scheduling matter.

### Design Philosophy

* The game should be fun enough to invite optimization.
* The theory should be visible without forcing heavy reading.
* Optional instructional elements should deepen understanding without slowing down players who want a pure game experience.

## Learning Objectives

After playing, a user should be able to understand:

* Throughput as completed work per unit time.
* Service time as the time spent actually doing work.
* Waiting time as the time spent in queue before service starts.
* Response time as waiting time plus service time.
* Queue growth when arrival rate exceeds effective service capacity.
* Why parallel workers can raise ideal capacity.
* Why actual throughput can fall below ideal throughput when scheduling overhead increases.
* Why a system can look busy while producing poor useful work.
* Why low latency and high throughput are related but not identical goals.

## MVP Scope

### In Scope

* Browser-based playable prototype
* Phase 1 calibration
* Phase 2 scheduling
* Variable-size tasks
* Live metrics
* Post-run graphs
* Post-run instructional explanations
* Score centered on latency-sensitive play

### Out of Scope

* Full preemption and migration in base mode
* Memory-thrashing simulation
* Workflow execution (Phase 3)
* Multiplayer
* Persistent accounts or cloud backend

## Success Criteria

* Players can understand the game quickly.
* Repeated runs produce visibly different queue and latency behavior under different strategies.
* Phase 1 produces a believable baseline.
* Phase 2 clearly shows that actual performance can fall below ideal parallel performance.
* Post-run feedback correctly explains the outcome.
* An instructor can use the tool to support discussion of system performance concepts.

## Open Design Questions

* Exact typing task content for Phase 1.
* Exact formula weights for waiting-time and idle-core penalties.
* Exact queue threshold and drop threshold for loss.
* Whether task sizes should be represented as S/M/L, task types, or noisy estimates.
* Whether difficulty should scale by arrival rate only or also by core count and information quality.
* Whether the post-run theory explanation should be fully generated from templates or chosen from authored explanations.
