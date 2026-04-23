# UI Layout

## Recommended Layout

### Top Bar
* Score
* Timer
* Current phase
* Dropped task count
* Warning state

### Left Panel
* Queue of waiting tasks
* Each task shows waiting time and size/type estimate

### Center Panel
* Cores shown as cards or lanes
* Idle or busy status
* Currently running task
* Progress bar

### Right Panel
* Live stats
* Throughput
* Queue length
* Utilization
* Average latency

### Bottom Panel or Modal
* Optional instructional hints
* Post-run explanation
* Graph summary

## Start Screen Layout

Two-box grid layout (side by side):

| Box | State | Contents |
|---|---|---|
| Phase 1 | Interactive | Title, description, difficulty selector (4 options), "Start Game" button |
| Phase 2 | Locked (opacity-40, pointer-events-none) | Title, description, placeholder difficulty rows, "Unlocks after Phase 1" label |

Difficulty options are stacked vertically inside the Phase 1 box. Selecting a difficulty applies a color-coded ring. Clicking "Start Game" shows the prePhase1 instructional popup before the game begins.

## Phase 1 Typing Display

* Characters rendered individually in a flex-wrap container.
* Font: `text-2xl font-mono font-bold tracking-wide`.
* Color states: green (correct), red (incorrect), white underline (cursor), gray (untyped).
* Spaces render as non-breaking space (`\u00A0`) to preserve visible gaps.
* Error count badge shown above the text when errors > 0.
* Progress bar below the text: `typedContent.length / content.length`.
