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
    ? `${DIFFICULTY_LABEL[difficulty]} | ${coreCount} cores | Survived: ${survivedSec}s / ${totalSec}s`
    : `${DIFFICULTY_LABEL[difficulty]} | ${coreCount} cores | ${totalSec}s`

  return (
    <div className="mb-8">
      <h1 className={`text-3xl font-bold mb-1 ${failed ? 'text-red-400' : 'text-white'}`}>
        {failed ? 'Phase 2 Failed — Queue Overloaded' : 'Phase 2 Complete — Multi-Core Scheduling'}
      </h1>
      <p className="text-sm text-gray-400">{subheader}</p>
    </div>
  )
}
