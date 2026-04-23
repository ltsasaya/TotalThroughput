export type CoreStatus = 'idle' | 'busy'

export interface Core {
  id: number
  status: CoreStatus
  currentTaskId: string | null
  progress: number             // 0–1, fraction of current task completed
  busySince?: number           // ms since game start when it became busy
  completedTaskCount: number
}
