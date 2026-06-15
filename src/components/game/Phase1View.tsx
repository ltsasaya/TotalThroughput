import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MetricItem, Panel, SectionLabel } from '@/components/ui/primitives'
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
  const phase1RunConfig = useGameStore(s => s.phase1RunConfig)
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
  const visibleQueue = queue.slice(0, 5)
  const hiddenQueueCount = Math.max(0, queue.length - visibleQueue.length)

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

  function typedCharClass(char: string, idx: number): string {
    let cls = 'font-mono text-2xl font-bold'
    if (idx < typedContent.length) {
      if (typedContent[idx] === char) {
        cls += ' text-[color:var(--tt-success)]'
      } else {
        cls += ' text-[color:var(--tt-danger)] underline decoration-[color:var(--tt-danger)] decoration-[3px] underline-offset-4'
      }
    } else if (idx === typedContent.length) {
      cls += ' text-[color:var(--tt-text-subtle)]'
    } else {
      cls += ' text-[color:var(--tt-text-subtle)]'
    }
    return cls
  }

  return (
    <div className="app-shell flex h-screen flex-col">
      <TopBar
        label={phase1RunConfig
          ? `${phase1RunConfig.difficulty.label}: expected arrival ${phase1RunConfig.lambda.toFixed(2)}/s`
          : 'Phase 1 Run'}
        remaining={remaining}
      />

      <main className="grid flex-1 gap-4 overflow-y-auto p-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:overflow-hidden lg:p-4">
        <Panel className="order-2 flex flex-col gap-4 p-4 lg:order-1 lg:h-full lg:overflow-hidden">
          <div>
            <SectionLabel>Stats</SectionLabel>
          </div>
          <div className="tt-scrollbar grid grid-cols-2 gap-4 lg:grid-cols-1 lg:overflow-y-auto">
            <StatBlock
              label="Total Throughput"
              value={String(liveMetrics.completedCount)}
            />
            <StatBlock label="Served Rate X" value={`${liveMetrics.throughput.toFixed(2)}/s`} />
            <StatBlock
              label="Arrival λ"
              value={phase1RunConfig ? `${phase1RunConfig.lambda.toFixed(2)}/s` : '—'}
            />
            <StatBlock label="Avg Service D" value={`${(liveMetrics.avgServiceTime / 1000).toFixed(1)}s`} />
            <StatBlock
              label="Avg Response Time (R)"
              value={liveMetrics.avgResponseTime > 0
                ? `${(liveMetrics.avgResponseTime / 1000).toFixed(1)}s`
                : '—'}
            />
            <StatBlock
              label="Reaction"
              value={(liveMetrics.avgReactionSpeed ?? 0) > 0
                ? `${((liveMetrics.avgReactionSpeed ?? 0) / 1000).toFixed(2)}s`
                : '—'}
            />
            <StatBlock
              label="Typing Speed"
              value={(liveMetrics.avgTypingSpeed ?? 0) > 0
                ? `${Math.round(liveMetrics.avgTypingSpeed!)} WPM`
                : '—'}
            />
            <StatBlock
              label="Utilization (U)"
              value={liveMetrics.perCoreUtilization[0] !== undefined
                ? `${Math.round(liveMetrics.perCoreUtilization[0] * 100)}%`
                : '—'}
            />
            <StatBlock label="Peak Queue" value={String(phase1MaxQueueLength)} />
          </div>
        </Panel>

        <Panel className="order-1 flex min-h-[640px] flex-col p-5 lg:order-2 lg:h-full">
          <div className="mb-4">
            <SectionLabel>Worker</SectionLabel>
          </div>

          <div className="relative flex flex-1 overflow-hidden text-center">
            {!activeTask ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="tt-muted text-xl">Waiting for requests...</p>
              </div>
            ) : (
              <>
                <div
                  className="absolute top-1/2 left-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 justify-center px-4"
                  data-testid="phase1-active-task-anchor"
                >
                  <div className="flex max-w-3xl flex-wrap justify-center leading-relaxed">
                  {wordGroups.map((group, wi) => {
                    const isSpace = group.length === 1 && group[0].char === ' '
                    if (isSpace) {
                      const { idx } = group[0]
                      return <span key={wi} className={typedCharClass(' ', idx)}>{'\u00A0'}</span>
                    }
                    const wordHasError = group.some(({ char, idx }) => idx < typedContent.length && typedContent[idx] !== char)
                    return (
                      <span
                        key={wi}
                        className={`inline-flex whitespace-nowrap px-1 ${wordHasError ? 'bg-[color:var(--tt-danger-soft)]' : 'bg-transparent'}`}
                        >
                        {group.map(({ char, idx }) => {
                          return <span key={idx} className={typedCharClass(char, idx)}>{char}</span>
                        })}
                      </span>
                    )
                  })}
                  </div>
                </div>

                <div
                  className="absolute top-[calc(50%+2.25rem)] left-1/2 flex w-full max-w-3xl -translate-x-1/2 flex-col gap-1 px-4"
                  data-testid="phase1-queue-stack"
                >
                  {visibleQueue.map((id, index) => {
                    const t = tasks[id]
                    if (!t) return null
                    const waitMs = phaseElapsed - t.arrivalTime
                    return (
                      <div
                        key={id}
                        className="grid min-h-10 grid-cols-[5rem_minmax(0,1fr)_5rem] items-center justify-center gap-3 px-2"
                      >
                        <span className={`text-right font-mono text-sm font-bold whitespace-nowrap ${waitColor(waitMs)}`}>
                          {(waitMs / 1000).toFixed(1)}s
                        </span>
                        <span className="truncate text-center font-mono text-[1.35rem] font-bold leading-8 text-[color:var(--tt-text-subtle)]">
                          {t.content ?? t.id}
                        </span>
                        <span className="text-left font-mono text-xs font-bold text-[color:var(--tt-text-subtle)]">
                          {index === 0 ? `Queue ${queue.length}` : ''}
                        </span>
                      </div>
                    )
                  })}
                  {hiddenQueueCount > 0 && (
                    <div className="grid min-h-10 grid-cols-[5rem_minmax(0,1fr)_5rem] items-center justify-center gap-3 bg-[color:var(--tt-surface-muted)] px-2">
                      <span />
                      <span className="truncate text-center font-mono text-[1.35rem] font-bold leading-8 text-[color:var(--tt-text-subtle)]">
                        +{hiddenQueueCount} more waiting
                      </span>
                      <span />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Panel>
      </main>
    </div>
  )
}
