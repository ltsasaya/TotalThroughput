import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MetricItem, Panel, SectionLabel, SizeBadge, StatusBadge } from '@/components/ui/primitives'
import { TopBar } from './TopBar'

function waitColor(ms: number): string {
  if (ms < 3000) return 'text-[color:var(--tt-text-subtle)]'
  if (ms < 7000) return 'text-[color:var(--tt-warning)]'
  return 'text-[color:var(--tt-danger)]'
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return <MetricItem label={label} value={value} valueClass="text-xl lg:text-2xl" />
}

export function Phase1View() {
  const config = useGameStore(s => s.config)
  const phaseElapsed = useGameStore(s => s.phaseElapsed)
  const phase1Levels = useGameStore(s => s.phase1Levels)
  const currentPhase1LevelIndex = useGameStore(s => s.currentPhase1LevelIndex)
  const activePhase1TaskId = useGameStore(s => s.activePhase1TaskId)
  const tasks = useGameStore(s => s.tasks)
  const queue = useGameStore(s => s.queue)
  const liveMetrics = useGameStore(s => s.liveMetrics)
  const typeChar = useGameStore(s => s.typeChar)
  const handleBackspace = useGameStore(s => s.handleBackspace)
  const phase1MaxQueueLength = useGameStore(s => s.phase1MaxQueueLength)

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
  const currentLevel = phase1Levels[currentPhase1LevelIndex]
  const completionTarget = currentLevel?.minCompletedSamples ?? 0

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
    <div className="app-shell flex h-screen flex-col">
      <TopBar
        label={`Phase 1: RPC Level ${currentPhase1LevelIndex + 1}/${phase1Levels.length}`}
        remaining={remaining}
        queueLength={liveMetrics.queueLength}
      />

      <main className="grid flex-1 gap-4 overflow-y-auto p-3 lg:grid-cols-[220px_minmax(0,1fr)_260px] lg:overflow-hidden lg:p-4">
        <Panel className="order-2 flex flex-col gap-4 p-4 lg:order-1 lg:h-full lg:overflow-hidden">
          <div>
            <SectionLabel>Stats</SectionLabel>
            {currentLevel && (
              <div className="mt-2 font-mono text-xs text-[color:var(--tt-info)]">
                {currentLevel.label} - {currentLevel.isDemo ? 'demo' : 'gate'}
              </div>
            )}
          </div>
          <div className="tt-scrollbar grid grid-cols-2 gap-4 lg:grid-cols-1 lg:overflow-y-auto">
            <StatBlock
              label="Completed Samples"
              value={`${liveMetrics.completedCount}/${completionTarget || '—'}`}
            />
            <StatBlock label="Served Rate X" value={`${liveMetrics.throughput.toFixed(2)}/s`} />
            <StatBlock
              label="Burst λ"
              value={currentLevel ? `${currentLevel.lambda.toFixed(2)}/s` : '—'}
            />
            <StatBlock
              label="Ref Load ρ"
              value={currentLevel ? `${Math.round(currentLevel.referenceLoad * 100)}%` : '—'}
            />
            <StatBlock label="Avg Service D" value={`${(liveMetrics.avgServiceTime / 1000).toFixed(1)}s`} />
            <StatBlock
              label="Served Avg R"
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
            <StatBlock label="Max Queue" value={String(phase1MaxQueueLength)} />
          </div>
        </Panel>

        <Panel className="order-1 flex min-h-[360px] flex-col p-5 lg:order-2 lg:h-full">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <SectionLabel>Workbench</SectionLabel>
              <div className="mt-1 text-sm font-semibold text-[color:var(--tt-text)]">
                {activeTask ? 'Service current RPC' : 'Awaiting next RPC'}
              </div>
            </div>
            <StatusBadge tone={activeTask ? 'success' : 'neutral'}>
              {activeTask ? 'busy' : 'idle'}
            </StatusBadge>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            {!activeTask ? (
              <p className="tt-muted text-xl">Waiting for requests...</p>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-center gap-3">
                  <SizeBadge size={activeTask.size} />
                  {errorCount > 0 && (
                    <StatusBadge tone="danger">{errorCount} error{errorCount > 1 ? 's' : ''}</StatusBadge>
                  )}
                </div>

                <div className="flex max-w-3xl flex-wrap justify-center leading-relaxed">
                  {wordGroups.map((group, wi) => {
                    const isSpace = group.length === 1 && group[0].char === ' '
                    if (isSpace) {
                      const { idx } = group[0]
                      let cls = 'font-mono text-2xl font-bold'
                      if (idx < typedContent.length) {
                        cls += typedContent[idx] === ' ' ? ' text-[color:var(--tt-success)]' : ' text-[color:var(--tt-danger)]'
                      } else if (idx === typedContent.length) {
                        cls += ' text-[color:var(--tt-text)] underline underline-offset-4'
                      } else {
                        cls += ' text-[color:var(--tt-text-subtle)]'
                      }
                      return <span key={wi} className={cls}>{'\u00A0'}</span>
                    }
                    return (
                      <span key={wi} className="inline-flex whitespace-nowrap">
                        {group.map(({ char, idx }) => {
                          let cls = 'font-mono text-2xl font-bold'
                          if (idx < typedContent.length) {
                            cls += typedContent[idx] === char ? ' text-[color:var(--tt-success)]' : ' text-[color:var(--tt-danger)]'
                          } else if (idx === typedContent.length) {
                            cls += ' text-[color:var(--tt-text)] underline underline-offset-4'
                          } else {
                            cls += ' text-[color:var(--tt-text-subtle)]'
                          }
                          return <span key={idx} className={cls}>{char}</span>
                        })}
                      </span>
                    )
                  })}
                </div>

                <div className="mt-5 h-1.5 w-full rounded-full bg-[color:var(--tt-surface-raised)]">
                  <div
                    className="h-1.5 rounded-full bg-[color:var(--tt-success)] transition-all"
                    style={{ width: content.length > 0 ? `${(typedContent.length / content.length) * 100}%` : '0%' }}
                  />
                </div>
              </>
            )}
          </div>
        </Panel>

        <Panel className="order-3 flex flex-col p-4 lg:h-full lg:overflow-hidden">
          <div className="flex items-center mb-3">
            <SectionLabel>Queue</SectionLabel>
            <StatusBadge className="ml-2">{queue.length}</StatusBadge>
          </div>
          {queue.length === 0 ? (
            <div className="flex min-h-24 flex-1 items-center justify-center">
              <span className="tt-muted text-sm">No requests waiting</span>
            </div>
          ) : (
            <div className="tt-scrollbar flex max-h-56 flex-1 flex-col gap-1.5 overflow-y-auto lg:max-h-none">
              {queue.map((id) => {
                const t = tasks[id]
                if (!t) return null
                const waitMs = phaseElapsed - t.arrivalTime
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded-lg bg-[color:var(--tt-surface-raised)] p-2"
                  >
                    <SizeBadge size={t.size} />
                    <span className="flex-1 truncate font-mono text-xs text-[color:var(--tt-text-muted)]">
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
        </Panel>
      </main>
    </div>
  )
}
