# Typing-Based System Performance Game

## Educational Background Notes

### Purpose

This document explains the system concepts that motivate the game design. It is separate from the main design doc so that the project can remain playable and game-focused while still preserving the theory behind the mechanics.

## 1. What the Game Is Actually Modeling

The game is not trying to replicate every detail of a real operating system scheduler. Instead, it uses simplified mechanics to teach a set of real ideas from performance, queueing, and parallel execution.

### Phase 1 models

* a single worker
* a single service station
* increasing arrival pressure
* queue formation when work arrives faster than it can be completed

### Phase 2 models

* a centralized dispatcher or scheduler
* multiple workers that can process in parallel
* coordination overhead between waiting work and available workers
* the gap between ideal parallelism and actual achieved throughput

This means Phase 2 is often closer to a centralized task-dispatch or cluster-scheduling problem than to a raw CPU time-slicing scheduler.

## 2. What a Scheduler Usually Knows at Runtime

A useful design question is: what information should the player have, and what information would a real scheduler have?

### A scheduler often knows

* which tasks are waiting
* how long they have waited
* which workers or cores are idle
* which workers are busy
* what work has already been assigned
* task priority or category
* recent task history

### A scheduler usually does not know perfectly

* the exact future runtime of a new task
* all future arrivals
* the globally optimal choice in every moment

This matters because many elegant scheduling policies in theory assume knowledge that real systems do not always have. The game should preserve some uncertainty so that the player’s decisions resemble real scheduling tradeoffs rather than perfect optimization.

## 3. Why the Player Should Not See Exact True Runtime by Default

If the player always sees the exact true task size before assignment, then the game becomes less realistic and often collapses into a strongest-known-job-ordering strategy.

That can still be useful in an idealized or theory mode, but it should not be the default experience.

### Better default information

The player can instead see:

* a task category
* a rough size bucket such as small, medium, or large
* a noisy estimate
* current waiting time

This preserves decision-making without pretending the scheduler has perfect foresight.

## 4. FIFO vs Real Scheduling

A strict FIFO queue is simple and intuitive. It is a good beginner rule because it clearly ties arrival order to service order.

However, many real schedulers do not operate as pure FIFO systems. They may reorder work based on:

* fairness
* priority
* expected responsiveness
* deadlines
* worker affinity
* resource fit
* load balancing

For the game, FIFO is useful as a teaching baseline, but allowing the player to choose among visible queued tasks makes the game more strategic and more instructional.

### Recommended interpretation

* FIFO-only mode teaches a simple baseline policy.
* Free-choice scheduling mode teaches that policy decisions affect latency and utilization.
* Post-run comparison can show how player decisions differed from FIFO.

## 5. Run-to-Completion vs Preemption vs Migration

These three ideas should be kept distinct.

### Run-to-completion

Once a task is assigned to a worker, it stays there until it finishes.

This is the cleanest base model for the game because it isolates queueing and assignment decisions without introducing extra complexity.

### Preemption

A running task is interrupted so that something else can run first.

Preemption can improve responsiveness in some settings, but it adds overhead and complexity.

### Migration

A task moves from one worker or core to another.

Migration can help rebalance load, but it may have costs such as lost locality or coordination overhead.

### Recommendation for the game

The base mode should use run-to-completion. Preemption and migration should be advanced modes, not baseline behavior.

## 6. Core Performance Terms the Game Should Teach

### Throughput

How much work completes per unit time.

### Service Time

How long a task spends actually being processed.

### Waiting Time

How long a task waits before processing begins.

### Response Time

Total time from arrival to completion.

Relationship:
response time = waiting time + service time

### Utilization

How much of a worker’s time is spent doing useful work.

## 7. Why Queues Grow So Fast Under Load

A key lesson of the game should be that queues do not grow gently forever. Once arrival pressure gets close to or exceeds effective service capacity, waiting time can rise sharply.

In the single-worker phase, this happens when the player cannot complete arriving tasks fast enough.

In the multi-worker phase, this can happen for two different reasons:

* the workers are not collectively fast enough
* the scheduler cannot dispatch work fast enough to keep up

That second case is especially important. It shows that coordination itself can become the bottleneck.

## 8. Ideal Throughput vs Actual Throughput

If one worker can process a certain rate of work, then multiple identical workers suggest a higher ideal capacity.

For example:

* one worker handles X work per second
* four identical workers suggest ideal capacity near 4X

But real achieved throughput can be lower because of:

* dispatch delay
* imperfect decisions
* idle gaps between assignments
* overload in the scheduling layer
* poor task ordering

This difference between ideal and actual throughput is one of the main educational goals of the game.

## 9. Why the Phase 2 Player Is Best Understood as a Scheduler

In Phase 2, the player is not “doing the work.” The workers do the work automatically. The player’s job is to match waiting work to available capacity.

That means the player acts most like:

* a dispatcher
* a task scheduler
* a central coordinator

This framing is important because it explains why the player can become the bottleneck even when workers still exist.

## 10. What Counts as Coordination Overhead in This Game

Coordination overhead is the time and attention required to manage parallel work.

In the game, this includes:

* identifying which tasks need assignment
* deciding which worker should take a task
* clicking or otherwise dispatching the task
* reacting under time pressure as the queue changes

This is not exactly the same as every real scheduler’s internal overhead, but it represents the same high-level idea: as parallelism rises, coordination can consume a larger share of total effort.

## 11. What “Thrashing” Means, and Why the Word Must Be Used Carefully

The word “thrashing” is often used loosely, but it has a specific textbook meaning in operating systems.

### Textbook thrashing

A classic form of thrashing happens when memory is overcommitted and the system spends so much time paging data in and out that useful work collapses.

This is a resource-management failure, not just a generic slowdown.

### Thrash-like behavior in the game

The current game concept is better described as scheduler overload or coordination thrash-like behavior.

Examples:

* the scheduler is so overloaded that queues explode even though workers exist
* tasks wait too long because assignment itself becomes the bottleneck
* the system looks active, but useful work stops increasing proportionally

### Cancellation loops

If a system repeatedly cancels work because it is taking too long, starts replacement work, then cancels that too, this is not the classic memory-thrashing meaning.

It is better described as:

* retry storm
* livelock-like behavior
* cancellation churn
* coordination thrash

This distinction matters because the project should not use the word “thrashing” so broadly that the concept loses precision.

## 12. Should Textbook Thrashing Appear in the Game?

Yes, but only as a later advanced mode.

A memory-thrashing hard mode could model:

* tasks with memory footprints
* a fixed memory budget
* paging-like penalties when too many active tasks exceed memory capacity

That would be valuable educationally, but it should remain separate from the baseline Phase 2 model.

## 13. Why Preemption and Migration Should Be Separate Advanced Modes

Preemption and migration are real scheduler tools, but they solve different problems and introduce their own costs.

If the game includes them too early, it becomes harder to isolate the core lessons about queueing, latency, and coordination bottlenecks.

A stronger teaching sequence is:

1. run-to-completion dispatch
2. preemption as a later complexity
3. migration as another later complexity
4. memory thrashing as a distinct advanced concept

## 14. Why the Score Should Prioritize Latency

A common mistake in performance thinking is to assume that maximizing completions automatically means good system behavior.

That is not always true. A system can complete a lot of work while still providing terrible response time.

Because of that, the game should punish waiting time heavily. This encourages players to care about queueing delay and not just raw completions.

That makes the score more aligned with real system performance tradeoffs.

## 15. Educational Value of Post-Run Explanations

The game should not only show numbers. It should explain what happened.

Good post-run feedback can help the player connect play to theory, for example:

* whether arrival rate exceeded service capacity
* whether queue growth was caused by worker saturation or scheduler delay
* whether low throughput came from not enough workers or poor utilization
* why latency rose sharply when the queue became unstable

This makes the game useful in a classroom, not just entertaining.

## 16. Suggested Instructional Framing for the Project

A concise way to explain the project academically:

“This game uses a typing-based service model and a multi-worker dispatch model to teach core ideas from queueing and parallel system performance. It is designed to make throughput, response time, utilization, and coordination bottlenecks visible through direct interaction.”

## 17. Suggested Concepts to Reference in Classroom Discussion

* single-server vs multi-server queueing intuition
* arrival rate vs service rate
* waiting time vs service time
* response time growth near overload
* ideal vs actual parallel speedup
* scheduler bottlenecks
* overhead dominating useful work
* textbook memory thrashing vs broader overload behavior

## 18. Final Teaching Recommendation

The game should begin with the simplest model that makes the core lessons clear. That means:

* baseline single-worker queueing
* multi-worker run-to-completion scheduling
* imperfect but realistic scheduler information
* latency-sensitive scoring
* optional deeper theory modes later

That structure gives the project a strong foundation and keeps advanced concepts available without diluting the MVP.
