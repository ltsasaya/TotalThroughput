# Metrics Definitions

These metrics support both gameplay and instruction and should be defined consistently throughout the codebase.

| Metric | Definition |
|---|---|
| **Throughput** | Completed tasks per unit time |
| **Service Time** | Time spent actively processing a task once work begins |
| **Waiting Time** | Time between task arrival and service start |
| **Response Time** | Time from task arrival to task completion (`waiting time + service time`) |
| **Core Utilization** | Fraction of time a core is actively processing work |
| **Ideal Throughput** | Expected throughput if all cores stayed fully busy with zero coordination cost |
| **Actual Throughput** | Observed completed work under the player's real dispatch decisions |

## Response Time Formula

```
response time = waiting time + service time
```

## Data Tracking Requirements

The system must record event timestamps for:
* Arrival
* Dispatch
* Start of service
* Completion
* Drop or expiration

Without these timestamps the game cannot compute instructional metrics correctly.
