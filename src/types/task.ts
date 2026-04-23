// Task size bucket shown to the player (coarse estimate)
export type TaskSize = 'S' | 'M' | 'L'

export type TaskStatus =
  | 'waiting'    // in queue, not yet dispatched
  | 'assigned'   // dispatched to a core but not yet started (Phase 2 only)
  | 'active'     // player is actively typing this task (Phase 1 only)
  | 'running'    // core is processing (Phase 2 only)
  | 'completed'
  | 'dropped'    // manually dropped or missed
  | 'expired'    // past deadline

export type TaskEventType =
  | 'arrival'
  | 'dispatch'
  | 'serviceStart'
  | 'completion'
  | 'drop'
  | 'expiration'

export interface TaskEvent {
  type: TaskEventType
  taskId: string
  timestamp: number   // ms since game start
  coreId?: number
}

export interface Task {
  id: string
  arrivalTime: number          // ms since game start
  size: TaskSize               // coarse size shown to player
  trueServiceDemand: number    // ms — actual processing time (hidden in standard mode)
  deadline?: number            // optional expiration time, ms since game start
  status: TaskStatus

  // Phase 1 — typing fields
  content?: string             // text the player must type
  typedContent?: string        // accumulated typed characters so far

  // Timing events (set when they occur)
  dispatchTime?: number        // ms since game start — when player dispatched
  serviceStartTime?: number    // ms since game start — when processing began
  firstKeystrokeTime?: number  // ms since game start — first char typed for this task
  completionTime?: number      // ms since game start

  // Phase 2 — dispatch fields
  assignedCoreId?: number
}
