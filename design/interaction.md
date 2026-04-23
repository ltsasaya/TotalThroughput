# Player Interaction Model

## Core Interaction

Primary interaction:
1. Click an idle core to assign the next task from the queue (FIFO).

Task assignment is strictly FIFO across all difficulty modes. The player has no choice over which task is dispatched — only which idle core receives it. The game is a reaction-speed challenge: keep cores busy by clicking them as they go idle.

### Visual affordances

* Idle cores pulse blue to signal they are ready to receive a task
* The first queue item is labeled NEXT
* Clicking a busy core flashes it red to signal the click was rejected
* A green ring briefly highlights a core after a successful dispatch

### Why this interaction is recommended

* Fast enough to feel skill-based
* Simple enough for classroom use
* Removes drag-and-drop complexity under time pressure
* Creates visible coordination cost without abstract menus

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

All modes enforce FIFO dispatch. Clicking an idle core always assigns `queue[0]`. Difficulty varies by arrival rate, core count, deadlines, and drop limits — not by dispatch freedom.
