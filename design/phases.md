# Game Phases

## High-Level Structure

Phase 2 is locked until the player completes Phase 1 calibration.

| Phase | Role | Status |
|---|---|---|
| Phase 1 | Single-core calibration — player types to complete tasks | MVP |
| Phase 2 | Multi-core scheduling — player dispatches tasks to automatic workers | MVP |
| Phase 3 | Workflow mode — task completions trigger downstream tasks | Planned, out of scope |

---

## Phase 1: Single-Core Calibration

### Purpose

Measure the player's baseline service rate and introduce queueing.

### Flow

* Tasks arrive at a moderate pace.
* The player completes them by typing.
* Arrival rate gradually increases.
* The player continues for a fixed duration.
* The system computes baseline capacity.

### Duration

Recommended: 45–60 seconds.

### Failure Condition

The player may fail if:
* Too many tasks expire or are missed.
* Queue exceeds a hard threshold.

Even on failure, the game should record a baseline from completed portions if enough data exists.

### Output

* Measured tasks per second
* Average service time
* Queue length over time
* Waiting time and response time summary

---

## Phase 2: Multi-Core Scheduling

### Purpose

Teach parallelism and coordination limits.

### Default Core Count

Recommended starting value: 4 cores.

### Progression

| Difficulty | Cores |
|---|---|
| Early | 4 |
| Medium | 6 |
| Hard | 8 |

### Flow

* Player sees a queue of incoming tasks.
* Idle cores become available over time.
* Player must assign tasks to cores quickly.
* Arrival rate increases during the level.
* Score prioritizes low latency while maintaining productivity.
* Phase ends when time runs out or the player loses.

### Visible Queue Size

Recommended: 6–8 tasks at once. Enough decision depth without overwhelming the player.

### Failure Conditions

Player loses if either:
* Queue exceeds a threshold.
* Too many tasks are dropped, expired, or missed.

### Metrics Output

* Total tasks completed
* Throughput over time
* Queue length over time
* Average and max waiting time
* Average and max response time
* Response time breakdown (waiting vs service)
* Per-core utilization
* Dropped or expired task count
* Ideal throughput vs actual throughput

---

## Phase 3: Workflow Mode (Planned, Out of Scope)

Completion of a task may cause one or more downstream tasks to fire. Introduces fan-out, bursty arrivals, and workflow dependencies. See [future.md](future.md) for details.
