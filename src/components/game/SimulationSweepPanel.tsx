import type { ServerLabSweepResult } from '@/simulation/serverLabExperiment'

function formatNumber(value: number | null, digits = 2) {
  return value === null || !Number.isFinite(value) ? '-' : value.toFixed(digits)
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`
}

export function SimulationSweepPanel({ results }: { results: ServerLabSweepResult[] }) {
  return (
    <div className="border-t-[3px] border-black bg-white px-4 py-2 md:px-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Concurrency Sweep
        </span>
        <span className="font-mono text-[10px] font-bold text-gray-400">
          same D, λ, t, seed policy
        </span>
      </div>
      {results.length === 0 ? (
        <div className="border-[2px] border-gray-300 px-3 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Run simulation to compare worker counts.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-4">
          {results.map(result => (
            <div key={result.concurrency} className="border-[2px] border-gray-300 px-2 py-1.5 font-mono">
              <div className="mb-1 flex items-center justify-between gap-2 border-b border-gray-200 pb-1">
                <span className="text-xs font-bold">c = {result.concurrency}</span>
                <span className="text-[10px] font-bold text-gray-500">{result.loadProfile.label}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                <dt className="text-gray-500">U</dt>
                <dd className="text-right font-bold">{formatPercent(result.loadProfile.perWorkerLoad)}</dd>
                <dt className="text-gray-500">R*</dt>
                <dd className="text-right font-bold">{formatNumber(result.steadyState.responseTime)}s</dd>
                <dt className="text-gray-500">Avg R</dt>
                <dd className="text-right font-bold">{formatNumber(result.summary.averageResponseTime)}s</dd>
                <dt className="text-gray-500">Done</dt>
                <dd className="text-right font-bold">
                  {result.summary.completedWithinWindow}/{result.summary.arrivals}
                </dd>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
