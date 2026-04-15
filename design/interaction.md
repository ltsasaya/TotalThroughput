# Player Interaction Model

## Core Interaction

Primary interaction:
1. Click a queued task.
2. Click an idle core to dispatch it.

### Optional skill-enhancing features

* Number-key shortcuts for fast core selection
* Queue hotkeys for faster dispatching
* Pulsing highlight for idle cores
* Compact visual task categories for fast scanning

### Why this interaction is recommended

* Fast enough to feel skill-based
* Simple enough for classroom use
* Easier to learn than drag-and-drop under stress
* Creates visible coordination cost without requiring abstract menus

## What the Player Knows

### Visible information

* Current queue
* Waiting time so far for queued tasks
* Task type or coarse size estimate
* Idle or busy status of each core
* Progress of tasks currently running on each core
* Number of dropped or expired tasks

### Hidden information

* Exact true total runtime before assignment (standard mode)
* Future arrivals
* Ideal global optimal scheduling policy

### Rationale

Real schedulers know which tasks are waiting and how long they have waited, but not the exact future runtime of every task. The game preserves that uncertainty to make scheduling decisions meaningful.

## Queue Selection Policy

| Mode | Policy |
|---|---|
| Beginner | FIFO-only dispatch |
| Main | Player chooses among visible queued tasks |
| Post-run | Compare player outcome to FIFO baseline |

Main mode gives the player real decision-making power rather than acting as a simple clerk.
