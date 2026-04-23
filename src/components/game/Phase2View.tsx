import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { TopBar } from './TopBar'
import { QueuePanel } from './QueuePanel'
import { CoreCard } from './CoreCard'
import { StatsPanel } from './StatsPanel'

export function Phase2View() {
  const config = useGameStore(s => s.config)
  const phaseElapsed = useGameStore(s => s.phaseElapsed)
  const tasks = useGameStore(s => s.tasks)
  const cores = useGameStore(s => s.cores)
  const liveMetrics = useGameStore(s => s.liveMetrics)
  const idleWasteMs = useGameStore(s => s.idleWasteMs)
  const dispatchTask = useGameStore(s => s.dispatchTask)
  const queue = useGameStore(s => s.queue)
  const nextArrivalIndex = useGameStore(s => s.nextArrivalIndex)
  const arrivalScheduleLength = useGameStore(s => s.arrivalSchedule.length)

  const [flashingCoreId, setFlashingCoreId] = useState<number | null>(null)

  const remaining = config.phase2Duration - phaseElapsed
  const isFinalStretch =
    arrivalScheduleLength > 0 &&
    nextArrivalIndex >= arrivalScheduleLength &&
    remaining > 0

  const score = Math.max(
    0,
    Math.round(
      liveMetrics.completedCount * 10
      - (liveMetrics.avgWaitingTime / 1000) * liveMetrics.completedCount * 0.5
      - idleWasteMs / 10_000
    )
  )

  const latencyWarning =
    liveMetrics.avgWaitingTime > 0 &&
    liveMetrics.avgServiceTime > 0 &&
    liveMetrics.avgWaitingTime / liveMetrics.avgServiceTime > 2.0

  const gridClass = config.phase2CoreCount <= 4 ? 'grid-cols-2' : 'grid-cols-3'

  function handleCoreClick(coreId: number, isBusy: boolean) {
    if (isBusy) {
      if (queue.length > 0) {
        setFlashingCoreId(coreId)
        setTimeout(() => setFlashingCoreId(null), 300)
      }
      return
    }
    dispatchTask(coreId)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 relative">
      <TopBar
        label="Phase 2: Scheduling"
        remaining={remaining}
        droppedCount={liveMetrics.droppedCount}
        dropLimit={config.dropLimit}
        queueLength={liveMetrics.queueLength}
        queueLimit={config.queueSizeLimit}
        score={score}
        latencyWarning={latencyWarning}
        isFinalStretch={isFinalStretch}
      />

      <main className="flex flex-1 gap-4 p-4 overflow-hidden">
        <StatsPanel />

        <div className="flex-1 flex flex-col gap-4">
          <div className={`grid ${gridClass} gap-4 flex-1`}>
            {cores.map(core => {
              const task = core.currentTaskId ? (tasks[core.currentTaskId] ?? null) : null
              return (
                <CoreCard
                  key={core.id}
                  core={core}
                  task={task}
                  isFlashing={flashingCoreId === core.id}
                  isFinalStretch={isFinalStretch}
                  onDispatch={() => handleCoreClick(core.id, core.status === 'busy')}
                />
              )
            })}
          </div>
        </div>

        <QueuePanel isFinalStretch={isFinalStretch} />
      </main>

      {isFinalStretch && (
        <div className="absolute inset-0 bg-red-950/10 pointer-events-none" />
      )}
    </div>
  )
}
