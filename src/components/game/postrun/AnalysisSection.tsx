interface AnalysisProps {
  failed: boolean
  tpRatio: number
  avgUtil: number
  waitRatio: number
  idleWasteMs: number
  coreCount: number
  avgServiceTime: number
  avgResponseTime: number
}

function generateProse(p: AnalysisProps): string {
  const sentences: string[] = []

  if (p.failed) {
    sentences.push('The run ended early — the queue exceeded capacity before the time limit.')
  }

  if (p.tpRatio >= 0.85) {
    sentences.push('Cores were kept consistently busy — throughput tracked close to the ideal rate.')
  } else if (p.tpRatio >= 0.65) {
    sentences.push(`Throughput reached ${(p.tpRatio * 100).toFixed(0)}% of the ideal rate — moderate idle gaps reduced efficiency.`)
  } else {
    sentences.push(`Throughput fell to ${(p.tpRatio * 100).toFixed(0)}% of ideal — cores spent significant time idle while tasks were available.`)
  }

  if (p.waitRatio < 0.5) {
    sentences.push('Queue delays were minimal: tasks waited less than half their service time on average.')
  } else if (p.waitRatio < 2.0) {
    sentences.push(`Tasks spent a noticeable portion of response time waiting — response time was ${(p.waitRatio + 1).toFixed(1)}x service time.`)
  } else {
    sentences.push(`Queue delay dominated: average waiting time was ${p.waitRatio.toFixed(1)}x the service time, indicating sustained overload.`)
  }

  if (p.avgUtil > 0.85) {
    sentences.push('Core utilization was high — efficient, but risks queue buildup under burst load.')
  } else if (p.avgUtil > 0.50) {
    sentences.push('Core utilization was moderate.')
  } else {
    sentences.push(`Cores were substantially idle — ${((1 - p.avgUtil) * 100).toFixed(0)}% of capacity was unused.`)
  }

  return sentences.join(' ')
}

function showBottleneckWarning(p: AnalysisProps): boolean {
  if (p.avgServiceTime <= 0 || p.coreCount <= 0) return false
  const wastedFraction = p.idleWasteMs / (p.avgServiceTime * p.coreCount)
  return wastedFraction > 0.05 && p.waitRatio > 0.5
}

export function AnalysisSection(props: AnalysisProps) {
  const { avgServiceTime, avgResponseTime, avgUtil, coreCount } = props
  const rdExpansion = avgServiceTime > 0 ? avgResponseTime / avgServiceTime : 1
  const perCoreLoad = coreCount > 0 ? avgUtil / coreCount : 0

  return (
    <div className="mb-6">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Analysis</div>
      <div className="border-t border-gray-800 mb-3" />

      <p className="text-sm text-gray-300 leading-relaxed mb-3">{generateProse(props)}</p>

      {avgServiceTime > 0 && (
        <div className="font-mono text-sm text-blue-400 mb-3">
          M/M/c expansion factor: {rdExpansion.toFixed(2)}×{'   '}
          (U/c = {(perCoreLoad * 100).toFixed(1)}%)
        </div>
      )}

      {showBottleneckWarning(props) && (
        <div className="bg-amber-950 border border-amber-700 rounded-lg px-4 py-3 text-sm text-amber-300">
          ! Scheduler bottleneck detected — workers were available while tasks waited. Earlier dispatch to idle cores would have reduced response time.
        </div>
      )}
    </div>
  )
}
