import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { TopBar } from './TopBar'
import type { TaskSize } from '@/types/task'

const SIZE_BADGE: Record<TaskSize, string> = {
  S: 'bg-green-900 text-green-300 text-xs font-bold px-2 py-0.5 rounded',
  M: 'bg-yellow-900 text-yellow-300 text-xs font-bold px-2 py-0.5 rounded',
  L: 'bg-red-900 text-red-300 text-xs font-bold px-2 py-0.5 rounded',
}

function SizeBadge({ size }: { size: TaskSize }) {
  return <span className={SIZE_BADGE[size]}>{size}</span>
}

function waitColor(ms: number): string {
  if (ms < 3000) return 'text-gray-500'
  if (ms < 7000) return 'text-amber-400'
  return 'text-red-400'
}

function deadlineClasses(timeLeftMs: number): string {
  if (timeLeftMs < 5000) return 'bg-red-950 border-l-2 border-red-500'
  if (timeLeftMs < 12000) return 'bg-amber-950 border-l-2 border-amber-500'
  return 'bg-gray-800'
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl text-white font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

export function Phase1View() {
  const config = useGameStore(s => s.config)
  const phaseElapsed = useGameStore(s => s.phaseElapsed)
  const activePhase1TaskId = useGameStore(s => s.activePhase1TaskId)
  const tasks = useGameStore(s => s.tasks)
  const queue = useGameStore(s => s.queue)
  const liveMetrics = useGameStore(s => s.liveMetrics)
  const typeChar = useGameStore(s => s.typeChar)
  const handleBackspace = useGameStore(s => s.handleBackspace)
  const nextArrivalIndex = useGameStore(s => s.nextArrivalIndex)
  const arrivalScheduleLength = useGameStore(s => s.arrivalSchedule.length)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (e.key === 'Backspace') { handleBackspace(); return }
      if (e.key.length === 1) typeChar(e.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [typeChar, handleBackspace])

  const activeTask = activePhase1TaskId ? tasks[activePhase1TaskId] : null
  const content = activeTask?.content ?? ''
  const typedContent = activeTask?.typedContent ?? ''
  const remaining = config.phase1Duration - phaseElapsed
  const isFinalStretch =
    arrivalScheduleLength > 0 &&
    nextArrivalIndex >= arrivalScheduleLength &&
    remaining > 0

  // Arrival rate: total tasks spawned / elapsed seconds
  const totalArrived = Object.keys(tasks).length
  const arrivalRate = phaseElapsed > 0 ? totalArrived / (phaseElapsed / 1000) : 0

  // Count active errors for the badge
  const errorCount = [...typedContent].filter((c, i) => c !== content[i]).length

  // Group characters by word to prevent mid-word line breaks
  interface CharEntry { char: string; idx: number }
  const wordGroups: Array<CharEntry[]> = []
  let currentWord: CharEntry[] = []
  for (let i = 0; i < content.length; i++) {
    if (content[i] === ' ') {
      if (currentWord.length > 0) { wordGroups.push(currentWord); currentWord = [] }
      wordGroups.push([{ char: ' ', idx: i }])
    } else {
      currentWord.push({ char: content[i], idx: i })
    }
  }
  if (currentWord.length > 0) wordGroups.push(currentWord)

  return (
    <div className="flex flex-col h-screen bg-gray-950 relative">
      <TopBar
        label="Phase 1: Calibration"
        remaining={remaining}
        droppedCount={liveMetrics.droppedCount}
        dropLimit={config.dropLimit}
        queueLength={liveMetrics.queueLength}
        queueLimit={config.queueSizeLimit}
        isFinalStretch={isFinalStretch}
      />

      <main className="flex flex-1 gap-4 p-4 overflow-hidden">
        <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-4 min-w-[180px] max-w-[200px] h-full">
          <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Stats</div>
          <div className="flex flex-col gap-4">
            <StatBlock label="Completed" value={String(liveMetrics.completedCount)} />
            <StatBlock label="Throughput X" value={`${liveMetrics.throughput.toFixed(2)}/s`} />
            <StatBlock label="Arrival Rate λ" value={arrivalRate > 0 ? `${arrivalRate.toFixed(2)}/s` : '—'} />
            <StatBlock label="Avg Service D" value={`${(liveMetrics.avgServiceTime / 1000).toFixed(1)}s`} />
            <StatBlock
              label="Response Time R"
              value={liveMetrics.avgResponseTime > 0
                ? `${(liveMetrics.avgResponseTime / 1000).toFixed(1)}s`
                : '—'}
            />
            <StatBlock
              label="Typing Speed"
              value={(liveMetrics.avgTypingSpeed ?? 0) > 0
                ? `${Math.round(liveMetrics.avgTypingSpeed!)} WPM`
                : '—'}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center relative">
          {!activeTask ? (
            <p className="text-gray-500 text-xl">Waiting for tasks...</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-center gap-3">
                <SizeBadge size={activeTask.size} />
                {errorCount > 0 && (
                  <span className="text-xs text-red-400 font-mono">{errorCount} error{errorCount > 1 ? 's' : ''}</span>
                )}
              </div>

              <div className="flex justify-center flex-wrap leading-relaxed">
                {wordGroups.map((group, wi) => {
                  const isSpace = group.length === 1 && group[0].char === ' '
                  if (isSpace) {
                    const { idx } = group[0]
                    let cls = 'font-mono text-2xl font-bold tracking-wide'
                    if (idx < typedContent.length) {
                      cls += typedContent[idx] === ' ' ? ' text-green-400' : ' text-red-400'
                    } else if (idx === typedContent.length) {
                      cls += ' text-white underline underline-offset-4'
                    } else {
                      cls += ' text-gray-600'
                    }
                    return <span key={wi} className={cls}>{'\u00A0'}</span>
                  }
                  return (
                    <span key={wi} className="inline-flex whitespace-nowrap">
                      {group.map(({ char, idx }) => {
                        let cls = 'font-mono text-2xl font-bold tracking-wide'
                        if (idx < typedContent.length) {
                          cls += typedContent[idx] === char ? ' text-green-400' : ' text-red-400'
                        } else if (idx === typedContent.length) {
                          cls += ' text-white underline underline-offset-4'
                        } else {
                          cls += ' text-gray-600'
                        }
                        return <span key={idx} className={cls}>{char}</span>
                      })}
                    </span>
                  )
                })}
              </div>

              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-4">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: content.length > 0 ? `${(typedContent.length / content.length) * 100}%` : '0%' }}
                />
              </div>
            </>
          )}

        </div>

        <div className={`bg-gray-900 rounded-xl p-4 flex flex-col h-full min-w-[200px] max-w-[240px] ${isFinalStretch ? 'border border-red-500/60 ring-1 ring-red-500/30' : ''}`}>
          <div className="flex items-center mb-3">
            <span className={`text-sm font-semibold uppercase tracking-wider ${isFinalStretch ? 'text-red-400' : 'text-gray-400'}`}>Queue</span>
            <span className="ml-2 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full">
              {queue.length}
            </span>
          </div>
          {isFinalStretch && (
            <div className="mb-3 px-2 py-1.5 bg-red-950/60 border-l-2 border-red-500 rounded text-xs text-red-300 font-semibold">
              No more tasks incoming — clear the queue
            </div>
          )}
          {queue.length === 0 && !isFinalStretch ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-gray-600 text-sm">No tasks waiting</span>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 flex flex-col gap-1.5">
              {queue.map((id) => {
                const t = tasks[id]
                if (!t) return null
                const waitMs = phaseElapsed - t.arrivalTime
                const timeLeft = t.deadline != null ? t.deadline - phaseElapsed : Infinity
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${deadlineClasses(timeLeft)}`}
                  >
                    <SizeBadge size={t.size} />
                    <span className="text-xs text-gray-300 font-mono flex-1 truncate">
                      {t.content ?? t.id}
                    </span>
                    <span className={`text-xs whitespace-nowrap ${waitColor(waitMs)}`}>
                      {(waitMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {isFinalStretch && (
        <div className="absolute inset-0 bg-red-950/10 pointer-events-none" />
      )}
    </div>
  )
}
