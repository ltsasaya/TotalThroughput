import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { DifficultyMode } from '@/types/game'
import InstructionalPopup from './InstructionalPopup'
import { LearnSection } from './LearnSection'

const DIFFICULTIES: {
  key: DifficultyMode
  label: string
  selected: string
  phase1Desc: string
  phase2Desc: string
  step: number
}[] = [
  {
    key: 'beginner',
    step: 1,
    label: 'Beginner',
    selected: 'ring-2 ring-green-500 bg-green-950 text-green-300',
    phase1Desc: 'Fixed RPC rates - low and moderate gates',
    phase2Desc: '4 workers - 50% target load - FIFO dispatch',
  },
  {
    key: 'standard',
    step: 2,
    label: 'Standard',
    selected: 'ring-2 ring-blue-500 bg-blue-950 text-blue-300',
    phase1Desc: 'Fixed RPC rates - stable gates plus demos',
    phase2Desc: '4 workers - 70% target load - FIFO dispatch',
  },
  {
    key: 'hard',
    step: 3,
    label: 'Hard',
    selected: 'ring-2 ring-red-500 bg-red-950 text-red-300',
    phase1Desc: 'Fixed RPC rates - higher gate pressure',
    phase2Desc: '6 workers - 85% target load - fast dispatch',
  },
]

export function StartScreen() {
  const startGame = useGameStore(s => s.startGame)
  const startPhase2 = useGameStore(s => s.startPhase2)
  const phase1Result = useGameStore(s => s.phase1Result)
  const [difficulty, setDifficulty] = useState<DifficultyMode>('standard')
  const [phase2Difficulty, setPhase2Difficulty] = useState<DifficultyMode>('standard')
  const [showPrePhase1Popup, setShowPrePhase1Popup] = useState(false)
  const [showPrePhase2Popup, setShowPrePhase2Popup] = useState(false)

  const current = DIFFICULTIES.find(d => d.key === difficulty)
  const currentP2 = DIFFICULTIES.find(d => d.key === phase2Difficulty)

  return (
    <div className="bg-gray-950">
      <section className="relative min-h-screen flex items-center justify-center px-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white">Total Throughput</h1>
          <p className="text-gray-400 mt-2">Learn server performance through client RPC queues</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Phase 1 Box */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-7">
            <div className="mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Phase 1</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Calibration</h2>
            <p className="text-sm text-gray-400 mb-6">
              Type queued RPCs to measure one server worker's service demand.
            </p>

            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Difficulty</p>
            <div className="flex flex-col gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.key}
                  onClick={() => setDifficulty(d.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
                    difficulty === d.key ? d.selected : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xs opacity-50 mr-1">{d.step}.</span>
                  {d.label}
                </button>
              ))}
            </div>

            <p className="text-gray-500 text-xs mt-3 h-4">{current?.phase1Desc}</p>

            <button
              onClick={() => setShowPrePhase1Popup(true)}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Start Game
            </button>
          </div>

          {/* Phase 2 Box */}
          {phase1Result === null || !phase1Result.passed ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-7 opacity-40 pointer-events-none select-none">
              <div className="mb-1">
                <span className="text-xs text-gray-500 uppercase tracking-widest">Phase 2</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Server Pool</h2>
              <p className="text-sm text-gray-400 mb-6">
                Dispatch queued RPCs to server workers. Minimize wait time and idle waste.
              </p>
              <div className="flex flex-col gap-3 mt-auto">
                <div className="h-8 bg-gray-800 rounded-lg" />
                <div className="h-8 bg-gray-800 rounded-lg" />
                <div className="h-8 bg-gray-800 rounded-lg" />
                <div className="h-8 bg-gray-800 rounded-lg" />
              </div>
              <p className="text-xs text-gray-500 mt-6 text-center">
                {phase1Result === null ? 'Complete Phase 1 calibration first' : 'Retry Phase 1 calibration to unlock'}
              </p>
            </div>
          ) : phase1Result.completedCount === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-7">
              <div className="mb-1">
                <span className="text-xs text-gray-500 uppercase tracking-widest">Phase 2</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Server Pool</h2>
              <p className="text-sm text-gray-400 mb-6">
                Dispatch queued RPCs to server workers. Minimize wait time and idle waste.
              </p>
              <div className="bg-amber-950 border border-amber-700 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-amber-300 mb-1">Calibration insufficient</p>
                <p className="text-xs text-amber-400">
                  No requests were completed in Phase 1. Play Phase 1 again to establish a valid service demand.
                </p>
              </div>
              <button
                disabled
                className="w-full py-3 bg-gray-700 text-gray-500 font-semibold rounded-xl cursor-not-allowed"
              >
                Play Phase 2
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-7">
              <div className="mb-1">
                <span className="text-xs text-gray-500 uppercase tracking-widest">Phase 2</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">Server Pool</h2>
              <p className="text-sm text-gray-400 mb-3">
                Dispatch queued RPCs to server workers. Minimize wait time and idle waste.
              </p>

              <div className="bg-gray-800 rounded-lg px-3 py-2 mb-4 flex items-center gap-3">
                <div>
                  <p className="text-xs text-gray-500">Worker cap.</p>
                  <p className="text-sm font-bold text-white">
                    {phase1Result.measuredTasksPerSecond.toFixed(2)} req/s
                  </p>
                </div>
                <div className="border-l border-gray-700 pl-3">
                  <p className="text-xs text-gray-500">Avg service</p>
                  <p className="text-sm font-bold text-white">
                    {(phase1Result.avgServiceTime / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>

              <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Difficulty</p>
              <div className="flex flex-col gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.key}
                    onClick={() => setPhase2Difficulty(d.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
                      phase2Difficulty === d.key ? d.selected : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xs opacity-50 mr-1">{d.step}.</span>
                    {d.label}
                  </button>
                ))}
              </div>

              <p className="text-gray-500 text-xs mt-3 h-4">{currentP2?.phase2Desc}</p>

              <button
                onClick={() => setShowPrePhase2Popup(true)}
                className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Play Phase 2
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-600 animate-bounce pointer-events-none select-none">
        <span className="text-xs uppercase tracking-widest">scroll to learn</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      </section>

      <LearnSection />

      {showPrePhase1Popup && (
        <InstructionalPopup
          id="prePhase1"
          onDismiss={() => { setShowPrePhase1Popup(false); startGame(difficulty) }}
        />
      )}

      {showPrePhase2Popup && (
        <InstructionalPopup
          id="prePhase2"
          onDismiss={() => { setShowPrePhase2Popup(false); startPhase2(phase2Difficulty) }}
        />
      )}
    </div>
  )
}
