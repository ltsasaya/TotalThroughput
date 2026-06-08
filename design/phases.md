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
and that sustained overload can make response time grow rapidly. In a finite
level, overload appears as backlog at the arrival-window end, long tail
responses, and possibly work still waiting when observation ends.

### Flow

* Before Phase 1 begins, a modal popup explains that clients send RPCs to a
  server and the player is the server worker. Dismissed by any key or outside
  click.
* The player enters a sequence of short levels with fixed arrival rates.
* The player completes client RPCs by typing short two-word strings.
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

Phase 1 has no punitive drops or expirations. Tasks may remain queued when a
trial ends; those tasks are reported as still waiting when observation ended,
not as failed or dropped requests. Level success is based on enough completed
samples and completed-sample response time, not clearing every arrival.

### Duration

Each level derives its arrival window from expected arrivals, then adds a drain
tail. The drain tail is a tail-observation period for work created during the
burst, not penalty time:

```
arrivalWindow = expectedArrivals / lambda
levelDuration = arrivalWindow + drainTail
```

Target 12-16 expected arrivals per Phase 1 level. Keep most levels around
35-60 seconds by using short S-only typing prompts.

### Success Condition

A Phase 1 level passes when:
* enough tasks complete to estimate service demand
* completed-sample average response time stays under the level threshold

The player does not fail from drops or leftover backlog in Phase 1. Overload
levels may be framed as demonstrations rather than required first-play gates.

### Output

* Single-worker capacity estimate `lambda_max = 1 / D`
* Completed-sample average service demand
* Per-level max queue length
* Waiting time and response time summary for served RPCs
* Backlog at arrival-window end, tail completions, and still-waiting count
* Reference-load comparison using `rho ~= lambda * D`
* Optional simple M/M/1 reference curve `R ~= D / (1 - rho)`, labeled as
  steady-state intuition rather than the finite-run response model

---

## Phase 2: Multi-Server Dispatch

### Purpose

Teach server-pool parallelism and dispatch limits using the course
back-of-napkin queueing model. More workers raise peak rate because
`lambda_max ~= c / D`. At a fixed arrival rate this lowers per-worker load,
shortens queues, and lowers response time. As per-worker load approaches 1,
queue length and response time rise sharply again.

The exact M/M/c mean response time formula is more complex than the classroom
capacity approximation. MVP Phase 2 reports `lambda_max ~= c / D`,
`perWorkerLoad = lambda * D / c`, observed utilization, and observed response
time. Any response curve is a simple single-server-style reference by
per-worker load, not an exact M/M/c prediction, unless the implementation adds
Erlang C or a simulation-derived reference.

### Default Worker Count

Recommended starting value: 4 workers.

### MVP Tuning

| Difficulty | Workers | Target per-worker load |
|---|---:|---:|
| Beginner | 4 | 0.50 |
| Standard | 4 | 0.70 |
| Hard | 6 | 0.85 |
| Theory | 4 | 0.70 |

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
