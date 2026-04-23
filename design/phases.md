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

* Before Phase 1 begins, a modal popup explains what calibration simulates and how the typing mechanic works. Dismissed by any key or outside click.
* Tasks arrive at a moderate pace.
* The player completes them by typing multi-word strings.
* Arrival rate gradually increases.
* The player continues for a fixed duration.
* The system computes baseline capacity.
* After Phase 1 ends, a post-phase popup explains the metrics seen and connects them to real system concepts before the calibration results screen is shown.

### Typing Mechanic (monkeytype-style)

* Each task is a multi-word string (2–8 words of system-performance vocabulary, depending on size).
* The player types character by character including spaces between words.
* Incorrect characters are appended and shown in red.
* Backspace removes the last typed character.
* A task only completes when `typedContent.length === content.length` and every character matches.
* Task size determines word count: S = 2–3 words, M = 3–5 words, L = 5–8 words.

### Deadline Windows

All task sizes share a flat **20-second** deadline window (base), scaled by the difficulty's `deadlineMultiplier` (Beginner 1.25×, Standard 1.0×, Hard 0.75×). Queue pressure is driven by arrival tempo rather than task length.

### Duration

60 seconds.

### Failure Condition

The player may fail if:
* Too many tasks expire or are missed.
* Queue exceeds a hard threshold.

Any task that is still waiting or in-progress when the phase ends is counted as dropped in the final summary (it does not retroactively trip the mid-run failure threshold).

Even on failure, the game records a baseline from completed portions if enough data exists.

### Output

* Measured tasks per second
* Average service time
* Queue length over time
* Waiting time and response time summary

---

## Phase 2: Multi-Core Scheduling

### Purpose

Teach parallelism and coordination limits via M/M/c queueing theory. At a given utilization (load factor), more parallel cores lower mean response time R. But as cores saturate, queue length and response time grow unboundedly — the M/M/c expansion factor R/D = 1/(1-(U/c)), where c is core count and U is utilization. The player experiences this directly: the same arrival rate that overwhelms c=1 becomes manageable at c=4, and the same load at c=4 becomes critical at high utilization.

### Default Core Count

Recommended starting value: 4 cores.

### Progression

| Difficulty | Cores |
|---|---|
| Early | 4 |
| Medium | 6 |
| Hard | 8 |

### Flow

* Before Phase 2 begins, a modal popup explains what the scheduling challenge simulates. Dismissed by any key or outside click.
* Player sees a queue of incoming tasks; the first is labeled NEXT.
* Tasks are dispatched FIFO — clicking an idle core assigns queue[0] to it.
* Player must react quickly to click cores as they go idle.
* Arrival rate increases during the level.
* Score prioritizes low latency while maintaining productivity.
* Phase ends when time runs out or the player loses.
* After Phase 2 ends, a post-phase popup explains metrics, the M/M/c model (R = D/(1-(U/c))), and why more parallelism flattens the response-time curve at moderate utilization but still blows up near saturation — before the PostRunSummary is shown.

### Visible Queue Size

Recommended: 6–8 tasks at once. Enough decision depth without overwhelming the player.

### Failure Conditions

Player loses if either:
* Queue exceeds a threshold.
* Too many tasks are dropped, expired, or missed.

Any task still queued, assigned, or running when the phase ends is counted as dropped in the final summary (not toward the mid-run drop threshold).

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
