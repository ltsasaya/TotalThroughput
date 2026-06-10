# Game Phases

## High-Level Structure

Phase 2 is out of current scope. The previous server-pool dispatch design is
historical only; BOSS will supply a new Phase 2 concept later.

| Phase | Role | Status |
|---|---|---|
| Phase 1 | Single-server calibration plus calibrated one-minute difficulty runs | MVP overhaul |
| Phase 2 | Future BOSS-directed concept | Deferred, out of current scope |
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
and unfinished work when observation ends. Unfinished work is not counted as
completed throughput or completed-request latency.

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
* Selecting a difficulty starts a 60-second single-server request run. The
  current implementation uses one seeded constant-rate Poisson arrival
  schedule; TODO-006 keeps the data-collection seed strategy under review.
* After a run, the player sees recorded metrics and returns to the difficulty
  page. The player can try another difficulty or recalibrate.

### Typing Mechanic (monkeytype-style)

* Calibration text is generated from random server-performance words and split
  into display rows. As the cursor advances, earlier rows leave the window and
  later rows enter; individual words should not slide upward independently.
* Run requests are medium-length typing tasks using server-performance
  vocabulary.
* The player types character by character including spaces between words.
* Incorrect characters are appended and shown in red.
* Backspace removes the last typed character.
* A task only completes when `typedContent.length === content.length` and every
  character matches.
* Run request length drives the calibration-derived service-demand estimate
  `D`; configured arrival rates should recalculate from `lambda = targetLoad / D`
  whenever the request length changes.

### Deadline Windows

Phase 1 has no punitive drops or expirations. Tasks may remain queued when a
run ends; those tasks are excluded from completed-request metrics. The exact UI
wording for unfinished work remains under TODO-006 review.

### Duration

Calibration lasts 30 seconds. Each calibrated difficulty run lasts 60 seconds.
The run duration is the observation window: unfinished work at the end is
not drained, dropped, or counted as completed throughput.

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
* Average queue length, with peak queue length retained only as diagnostic context
* Optional unfinished-work count at the end of the observation window, excluded
  from completed metrics
* Reference-load comparison using `rho ~= lambda * D`
* Optional simple M/M/1 reference curve `R ~= D / (1 - rho)`, labeled as
  steady-state intuition rather than the finite-run response model

---

## Phase 2: Future Redesign

The previous server-pool dispatch design is no longer active product scope.
BOSS intends to provide a new Phase 2 idea later. Until that happens, do not
add Phase 2 features, tune old Phase 2 behavior, or treat the original Phase 2
model as a backend or data-collection requirement.

When Phase 2 resumes, start with a question-first plan that defines the new
workflow, model assumptions, metrics, UI, and validation path before editing
source code.

---

## Phase 3: Workflow Mode (Planned, Out of Scope)

Completion of a request may cause one or more downstream requests to fire.
Introduces fan-out, bursty arrivals, and workflow dependencies. See
[future.md](future.md) for details.
