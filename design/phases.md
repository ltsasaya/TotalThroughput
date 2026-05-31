# Game Phases

## High-Level Structure

Phase 2 is locked until the player completes Phase 1 calibration.

| Phase | Role | Status |
|---|---|---|
| Phase 1 | Single-server calibration: player types to complete client RPCs | MVP overhaul |
| Phase 2 | Multi-server dispatch: player routes queued RPCs to automatic workers | MVP overhaul |
| Phase 3 | Workflow mode: task completions trigger downstream tasks | Planned, out of scope |

---

## Phase 1: Single-Server Calibration

### Purpose

Introduce clients sending RPCs to one server, measure the player's baseline
server service demand, and make response time intuitive:

```
response time = waiting time + service time
```

Phase 1 should show that queues form when arrivals approach service capacity,
and that response time can grow without bound when arrivals exceed capacity.

### Flow

* Before Phase 1 begins, a modal popup explains that clients send RPCs to a
  server and the player is the server worker. Dismissed by any key or outside
  click.
* The player enters a sequence of short levels with fixed arrival rates.
* The player completes client RPCs by typing multi-word strings.
* Each level uses one constant Poisson arrival rate.
* Later levels increase arrival rate to move from low load to near saturation
  and then overload.
* The system computes baseline capacity from completed typing work.
* After Phase 1 ends, a post-phase popup explains the metrics seen and connects
  them to real system concepts before the calibration results screen is shown.

### Typing Mechanic (monkeytype-style)

* Each task is a multi-word string of server-performance vocabulary.
* The player types character by character including spaces between words.
* Incorrect characters are appended and shown in red.
* Backspace removes the last typed character.
* A task only completes when `typedContent.length === content.length` and every
  character matches.
* Phase 1 should use S-heavy prompts so enough arrivals fit in each short
  level.

### Deadline Windows

Phase 1 has no drops or expirations. Tasks may remain queued when a trial ends,
but level success is based on observed average response time and completion
count, not deadline failure.

### Duration

Each level derives duration from expected arrivals:

```
trialDuration = expectedArrivals / lambda
```

Target 12-16 expected arrivals per Phase 1 level. Keep most levels around
35-60 seconds by using short S-heavy typing prompts.

### Success Condition

A Phase 1 level passes when:
* enough tasks complete to estimate service demand
* average response time stays under the level threshold

The player does not fail from drops in Phase 1. Overload levels may be framed
as demonstrations rather than required first-play gates.

### Output

* Measured tasks per second
* Average service demand
* Queue length over time
* Waiting time and response time summary
* Reference model comparison using `U = lambda * D` and `R ~= D / (1 - U)`

---

## Phase 2: Multi-Server Dispatch

### Purpose

Teach server-pool parallelism and dispatch limits using the course
back-of-napkin queueing model. More workers raise peak rate because
`lambda_max ~= c / D`. At a fixed arrival rate this lowers per-worker load,
shortens queues, and lowers response time. As per-worker load approaches 1,
queue length and response time rise sharply again.

The exact M/M/c mean response time formula is more complex than the classroom
capacity approximation. Treat `R ~= D / (1 - lambda D / c)` as an intuition
curve unless the implementation adds an exact Erlang C or simulation-derived
reference.

### Default Worker Count

Recommended starting value: 4 workers.

### Progression

| Difficulty | Workers |
|---|---|
| Early | 4 |
| Medium | 6 |
| Hard | 8 |

### Flow

* Before Phase 2 begins, a modal popup explains that the RPC server now has a
  pool of workers. Dismissed by any key or outside click.
* Player sees a queue of incoming RPCs; the first is labeled NEXT.
* Requests are dispatched FIFO: clicking an idle worker assigns `queue[0]` to it.
* Player must react quickly to click workers as they go idle.
* Each run uses one constant Poisson arrival rate.
* Difficulty or level selection changes arrival rate between runs.
* Score prioritizes low server response time while maintaining productivity.
* Phase ends when time runs out or the player loses.
* After Phase 2 ends, a post-phase popup explains metrics and why more
  parallelism shifts the response-time curve right without making saturation
  disappear.

### Visible Queue Size

Recommended: 6-8 tasks at once. Enough decision depth without overwhelming the
player.

### Failure Conditions

Player loses if either:
* Queue exceeds a threshold.
* Too many tasks are dropped, expired, or missed.

Any task still queued, assigned, or running when the phase ends is counted as
dropped in the final summary, not toward the mid-run drop threshold.

### Metrics Output

* Total tasks completed
* Throughput over time
* Queue length over time
* Average and max waiting time
* Average and max response time
* Response time breakdown: waiting vs service
* Per-worker utilization
* Dropped or expired task count
* Ideal throughput vs actual throughput

---

## Phase 3: Workflow Mode (Planned, Out of Scope)

Completion of a request may cause one or more downstream requests to fire.
Introduces fan-out, bursty arrivals, and workflow dependencies. See
[future.md](future.md) for details.
