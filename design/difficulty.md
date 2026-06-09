# Difficulty Modes

Difficulty for the browser-only Phase 1 overhaul is calibrated from the
player's 30-second typing baseline. The displayed WPM ranges are fixed bins;
the actual arrival rate is tuned from the player's measured service demand.

WPM uses the project-wide typing-test convention: characters divided by five
over elapsed minutes, not actual word-token counts.

## WPM Bins

| Bin | WPM range |
|---:|---|
| 0 | 30-40 |
| 1 | 40-50 |
| 2 | 50-60 |
| 3 | 60-75 |
| 4 | 75-90 |
| 5 | 90-105 |
| 6 | 105-120 |
| 7 | 120-140 |
| 8 | 140-160 |
| 9 | 160-180 |
| 10 | 180-200 |

If calibration falls below the first bin, clamp to `30-40`. If it exceeds the
last bin, clamp to `180-200` for display until BOSS approves an expanded range.

## Calibrated Choices

Let `i` be the calibrated bin index. The initial browser-only mapping is:

| Choice | Displayed WPM range | Target load | Regime |
|---|---|---:|---|
| Easy | `max(i - 1, 0)` | 0.55 | Low load |
| Medium | `i` | 0.75 | Moderate load |
| Hard | `min(i + 1, last)` | 0.92 | Near saturation |
| Impossible | `min(i + 2, last)` | 1.10 | Overload |

The range label is educational context for the player. It should not be treated
as an exact success/failure requirement. The configured arrival rate for one
server worker is:

```
lambda = targetLoad / D
```

where `D` is the player's measured service demand from calibration.

## Run Rules

* Each selected difficulty lasts 60 seconds.
* Each run uses one seeded constant-rate Poisson arrival schedule.
* Requests are handled FIFO by the player as the single worker.
* Phase 1 has no punitive drops. Unfinished requests at the end are reported as
  still waiting.
* After a run, return to the difficulty selection page so the player can try
  another difficulty or recalibrate.

## Formula Caveat

For one server worker, `rho ~= lambda * D` is the configured reference load.
The response-time curve `R ~= D / (1 - rho)` is a steady-state M/M/1-style
reference, not an exact result for one finite 60-second typing run.

## Existing Phase 2 Labels

The older `beginner`, `standard`, `hard`, and `theory` labels remain in source
until Phase 2 is reconnected to the new player workflow. Do not use those labels
for the new Phase 1 difficulty selection screen.
