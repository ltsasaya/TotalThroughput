# Player Interaction Model

## Worker Interaction

Primary interaction:
1. Click an idle worker to assign the next request from the queue (FIFO).

Request assignment is strictly FIFO across all difficulty modes. The player has
no choice over which request is dispatched, only which idle worker receives it.
The game is a reaction-speed challenge: keep workers busy by clicking them as
they go idle.

### Visual affordances

* Idle workers pulse blue to signal they are ready to receive a request
* The first queue item is labeled NEXT
* Clicking a busy worker flashes it red to signal the click was rejected
* A green ring briefly highlights a worker after a successful dispatch

### Why this interaction is recommended

* Fast enough to feel skill-based
* Simple enough for classroom use
* Removes drag-and-drop complexity under time pressure
* Creates visible coordination cost without abstract menus

## What the Player Knows

### Visible information

* Current request queue
* Waiting time so far for queued requests
* Task type or coarse size estimate
* Idle or busy status of each worker
* Progress of requests currently running on each worker
* Number of dropped or expired tasks

### Hidden information

* Exact true service demand before assignment (standard mode)
* Future arrivals
* Ideal global optimal dispatch policy

### Rationale

Real dispatchers know which requests are waiting and how long they have waited,
but not the exact future runtime of every request. The game preserves that
uncertainty to make dispatch decisions meaningful.

## Queue Selection Policy

All modes enforce FIFO dispatch. Clicking an idle worker always assigns
`queue[0]`. Difficulty varies by arrival rate, worker count, deadlines, and
drop limits, not by dispatch freedom.
