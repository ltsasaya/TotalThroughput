# Scoring System

## Score Formula

**Score = completed requests - waiting-time penalty - idle-worker penalty**

## Design Intent

| Term | Purpose |
|---|---|
| Completed requests | Rewards productivity |
| Waiting-time penalty | Punishes queue buildup and latency inflation |
| Idle-worker penalty | Punishes poor dispatching when work exists |

The waiting-time penalty should be the strongest term. Players should learn that blindly maximizing completions while allowing latency to explode is not good performance.

## Secondary Performance Grades

In addition to the main score:

* Latency grade
* Utilization grade
* Throughput grade
* Efficiency grade

## Open Questions

Exact formula weights for the waiting-time and idle-core penalties are not yet finalized. See [overview.md](overview.md).
