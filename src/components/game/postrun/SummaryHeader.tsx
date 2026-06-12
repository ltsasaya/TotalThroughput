import type { DifficultyMode } from '@/types/game'

const DIFFICULTY_LABEL: Record<DifficultyMode, string> = {
  beginner: 'Beginner',
  standard: 'Standard',
  hard: 'Hard',
  theory: 'Theory',
}

interface SummaryHeaderProps {
  failed: boolean
  survivedMs: number
  phaseDuration: number
  difficulty: DifficultyMode
  coreCount: number
}

export function SummaryHeader({ failed, survivedMs, phaseDuration, difficulty, coreCount }: SummaryHeaderProps) {
  const totalSec = Math.round(phaseDuration / 1000)
  const survivedSec = Math.round(survivedMs / 1000)

  const subheader = failed
    ? `${DIFFICULTY_LABEL[difficulty]} | ${coreCount} workers | Survived: ${survivedSec}s / ${totalSec}s`
    : `${DIFFICULTY_LABEL[difficulty]} | ${coreCount} workers | ${totalSec}s`

  return (
    <div className="mb-8">
      <h1 className={`mb-1 text-3xl font-bold ${failed ? 'text-[color:var(--tt-danger)]' : 'text-[color:var(--tt-text)]'}`}>
        {failed ? 'Phase 2 Failed - Queue Overloaded' : 'Phase 2 Complete - Server Pool Dispatch'}
      </h1>
      <p className="tt-copy text-sm">{subheader}</p>
    </div>
  )
}
