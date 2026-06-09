# Game Phases

## High-Level Structure

Phase 2 is locked until the player completes Phase 1 calibration.

| Phase | Role | Status |
|---|---|---|
| Phase 1 | Single-server calibration plus calibrated one-minute difficulty runs | MVP overhaul |
| Phase 2 | Multi-server dispatch: player routes queued requests to automatic workers | MVP overhaul |
| Phase 3 | Workflow mode: task completions trigger downstream tasks | Planned, out of scope |

---

## Phase 1: Single-Server Calibration

### Purpose

Introduce clients sending requests to one server, measure the player's baseline
typing capacity, and make response time intuitive:

```
response time = waiting time + service time
```

Phase 1 should show that queues form when arrivals approach service capacity,
and that sustained overload can make response time grow rapidly. In a finite
one-minute run, overload appears as rising queue length, longer response times,
and work still waiting when observation ends.

### Flow

* Before Phase 1 begins, the Educational Manual explains the client request,
  request queue, worker service, and response loop.
* The player starts with a 30-second calibration typing test.
* Calibration uses generated random-word rows: the visible five-row window
  advances one whole row at a time as the player types.
* Calibration computes a WPM baseline, a fixed WPM bin, and a service-demand
  estimate that can tune request arrivals.
* When calibration ends, a compact completion card shows WPM, accuracy, and
  display bin. The player can recalibrate or continue to the Game Menu.
* The player then sees four one-minute difficulty choices: Easy, Medium, Hard,
  and Impossible. Their displayed WPM ranges are derived from the fixed WPM bin
  table in `difficulty.md`.
* Selecting a difficulty starts a 60-second single-server request run with one
  constant Poisson arrival rate.
* After a run, the player sees recorded metrics and returns to the difficulty
  page. The player can try another difficulty or recalibrate.

### Typing Mechanic (monkeytype-style)

* Calibration text is generated from random server-performance words and split
  into display rows. As the cursor advances, earlier rows leave the window and
  later rows enter; individual words should not slide upward independently.
* Run requests are short typing tasks using server-performance vocabulary.
* The player types character by character including spaces between words.
* Incorrect characters are appended and shown in red.
* Backspace removes the last typed character.
* A task only completes when `typedContent.length === content.length` and every
  character matches.
* Run requests should stay short enough that enough arrivals fit in each
  one-minute run.

### Deadline Windows

Phase 1 has no punitive drops or expirations. Tasks may remain queued when a
run ends; those tasks are reported as still waiting when observation ended, not
as failed or dropped requests.

### Duration

Calibration lasts 30 seconds. Each calibrated difficulty run lasts 60 seconds.
The run duration is the observation window: unfinished work at the end is
reported as still waiting rather than drained or dropped.

```
calibrationDuration = 30s
runDuration = 60s
```

Target enough expected arrivals per one-minute run to show queue behavior
without overwhelming the player:

```
expectedArrivals = lambda * 60s
```

### Success Condition

Calibration completes when the 30-second timer ends. A one-minute difficulty
run completes when its timer ends. The player does not fail from drops or
leftover backlog in Phase 1; overload is framed as observable capacity pressure.

### Output

* Calibration WPM, calibrated WPM bin, and service-demand estimate `D`
* Average response time
* Average service demand
* Total throughput, as completed requests during the run
* Average typing speed
* Reaction speed
* Observed utilization percent
* Max queue length
* Still-waiting count at the end of the observation window
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

* Before Phase 2 begins, a modal popup explains that the server now has a
  pool of workers. Dismissed by any key or outside click.
* Player sees a queue of incoming requests; the first is labeled NEXT.
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
