# Overview

## Summary

Total Throughput is a browser-based instructional game that teaches server
performance through direct play. The introductory model is clients sending requests
to a server: requests arrive, wait in a queue when workers are busy, receive
service, and return responses. The game then uses that server model to
introduce systems performance more generally. The player first operates a
single-server queue, then transitions to a multi-server dispatch phase where
they act as the centralized dispatcher.

The project is primarily a teaching tool. It should be enjoyable enough to motivate competition, but its core value is instructional.

## Primary Goals

* Teach server throughput, queue growth, waiting time, service time, response
  time, utilization, and overload through gameplay.
* Introduce server queues through a client request/response model before
  showing formulas.
* Show the difference between one-server capacity and multi-server capacity.
* Demonstrate that more workers do not automatically produce proportional
  throughput gains when dispatch, imbalance, or coordination becomes the
  bottleneck.
* Provide meaningful live metrics and post-run feedback that connect results to theory.
* Make latency control central to strong play.
* Use the server queue as the concrete entry point for broader systems
  performance concepts.

## Secondary Goals

* Make the experience competitive enough for classroom use.
* Support repeated runs with different strategies and difficulty levels.
* Allow instructors or students to compare idealized theory with real play.

## Non-Goals for MVP

* Accurate modeling of every operating system or runtime scheduler detail.
* Distributed consensus, networking, or fault tolerance.
* Full preemption, migration, or memory models in the base mode.
* Phase 3 workflow execution.
* Multiplayer or networked competition.

## Product Positioning

Game-like teaching tool.

### Intended Use Cases

* Class demonstration in server, distributed systems, or systems courses.
* Discussion section activity where students compete and then interpret results.
* Self-guided exploration of queueing and parallelism concepts.
* Simple visual aid for explaining why latency, utilization, and dispatch
  choices matter.

### Design Philosophy

* The game should be fun enough to invite optimization.
* The theory should be visible without forcing heavy reading.
* Optional instructional elements should deepen understanding without slowing down players who want a pure game experience.

## Learning Objectives

After playing, a user should be able to understand:

* Throughput as completed work per unit time.
* A server as clients, requests, queue, service, and response.
* Service time as the time spent actually doing work.
* Waiting time as the time spent in queue before service starts.
* Response time as waiting time plus service time.
* Queue growth when arrival rate exceeds effective service capacity.
* Why added capacity can raise ideal throughput, once a future multi-resource
  or multi-worker phase is defined.
* Why a system can look busy while producing poor useful work.
* Why low latency and high throughput are related but not identical goals.
* How the same server-performance vocabulary generalizes to CPUs, disks,
  networks, thread pools, services, and larger systems.

## MVP Scope

### In Scope

* Browser-based playable prototype
* Phase 1 calibration
* Calibrated one-minute Phase 1 request runs
* Medium-length request typing tasks
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
* Phase 1 summaries distinguish configured load from observed finite-run metrics.
* Post-run feedback correctly explains the outcome.
* An instructor can use the tool to support discussion of server performance
  and the systems concepts that generalize from it.

## Open Design Questions

* Final difficulty offsets and target load tuning.
* Final Poisson seed/data-collection strategy.
* Whether unfinished work should be shown, hidden, or relabeled in summaries.
* Future Phase 2 concept, workflow, and model assumptions.
* Whether future request variation should use named task types or noisy
  estimates; current Phase 1 should not show `S`/`M`/`L` request sizes.
* Whether difficulty should scale by arrival rate only or also by core count and information quality.
* Whether the post-run theory explanation should be fully generated from templates or chosen from authored explanations.
