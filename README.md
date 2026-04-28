# TotalThroughput
Lucas Sasaya (lts28)
Total Throughput: Learning System Performance by Typing
(https://github.com/ltsasaya/TotalThroughput)
Total Throughput is a typing-based browser game that teaches core ideas from system performance: throughput, latency, queueing, and scheduling. The idea being that students understand concepts before learning formulas and give students a way to build intuition for why queues form and why a busy system may have longer response times. 

Phase 1: Single-Core Calibration
Phase 1 simulates tasks for a single-core worker. Tasks arrive on a bucket-based schedule, and the player completes each one by typing its words exactly. The typing speed becomes the system's service rate, how fast one worker processes one unit of work.

As arrivals rate increases, a queue forms. Tasks wait before the player gets to them. This influences response time. If the arrivals outpace the player’s service speed, time grows unbounded. 

Phase 2: Multi-Core Scheduling
Phase 2 gives the player the role of a scheduler. The player focuses on routing tasks from a shared queue to multiple auto-workers (cores). The cores process at the service rate Phase 1 measured.

Through phase 2, the player learns about M/M/c queueing. With `c` cores at utilization `U`, mean response time follows `R = D / (1 − U/c)`. The same load that overwhelmed one core is more balanced at four, until utilization gets close to `c`. Then the expansion factor increases again and latency goes up. 

How It Maps to Real Systems
The game’s cores can represent threads, processes, servers, and other concurrently running systems. The scheduler represents real-world schedulers. The queue is a request backlog. 

What's Simplified
The game trades realism for clarity. The game does not currently implement preemption, migration, context-switch costs, caches, out of order queues, and other real-world optimizations. Dispatch is FIFO only. Real schedulers use priority, shortest-job-first, or work-stealing. Service rate is deterministic, while real workloads are stochastic. Arrivals use a fixed four-bucket schedule rather than a Poisson process, so every run is comparable. There is no memory, cache, I/O, or network. The model is pure CPU service with one queue and one dispatcher.

Future Considerations
Planned modes add back the missing physics: preemption with switch overhead, migration penalties, and a memory-thrashing mode where too many active tasks collapse throughput. Phase 3 could introduce workflow that spawn extra tasks on the completion of a first task. Future considerations also include storing player data to create more sophisticated real-data graphs that model back-of-napkin approximations.

## Installation

### Prerequisites
- Node.js 18 or newer
- npm 9 or newer (bundled with Node.js)
- Git

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/ltsasaya/TotalThroughput.git
   cd TotalThroughput
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at the local URL printed by Vite (typically http://localhost:5173).

### Other Commands
- `npm run build` — type-check and build the production bundle
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm test` — run the unit and integration test suite

## What Is a System?

In Total Throughput, a "system" is any setup that takes in work, processes it, and produces results. Every system has three core parts: arrivals (work coming in), one or more workers (the things doing the processing), and a queue (where work waits when workers are busy). The behavior of a system emerges from how these parts interact under load.

Real-world systems take many forms. A web server is a system: requests arrive, threads handle them, and a backlog forms when traffic spikes. A coffee shop is a system: customers arrive, baristas serve, and a line builds during the morning rush. A CPU is a system: instructions arrive, cores execute, and the run queue holds the rest. The game abstracts these into a single mental model so the same intuition applies everywhere.

What makes a system interesting is that its performance is not determined by any single component. Throughput depends on service rate, but response time depends on utilization, which depends on the relationship between arrival rate and total service capacity. Doubling the work does not double the wait — past a certain point, queues grow nonlinearly. Understanding a system means understanding these relationships, not just the parts.
