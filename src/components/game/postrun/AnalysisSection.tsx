import { SectionLabel } from '@/components/ui/primitives'

interface AnalysisProps {
  failed: boolean
  completedTasks: number
  tpRatio: number
  avgUtil: number
  waitRatio: number
  idleWasteMs: number
  coreCount: number
  arrivalRate: number
  targetPerWorkerLoad: number
  avgServiceTime: number
  avgResponseTime: number
}

function generateProse(p: AnalysisProps): string {
  const sentences: string[] = []

  if (p.failed) {
    sentences.push('The run failed because the request queue exceeded the server-pool tolerance.')
  }

  if (p.tpRatio >= 0.85) {
    sentences.push('Workers were kept consistently busy, so throughput tracked close to the ideal server-pool rate.')
  } else if (p.tpRatio >= 0.65) {
    sentences.push(`Throughput reached ${(p.tpRatio * 100).toFixed(0)}% of the ideal rate because moderate idle gaps reduced efficiency.`)
  } else {
    sentences.push(`Throughput fell to ${(p.tpRatio * 100).toFixed(0)}% of ideal because workers spent significant time idle while requests were available.`)
  }

  if (p.completedTasks === 0) {
    sentences.push('No requests completed, so served response-time metrics are unavailable.')
  } else if (p.waitRatio < 0.5) {
    sentences.push('Queue delays were minimal: tasks waited less than half their service time on average.')
  } else if (p.waitRatio < 2.0) {
    sentences.push(`Requests spent a noticeable portion of response time waiting, so response time was ${(p.waitRatio + 1).toFixed(1)}x service time.`)
  } else {
    sentences.push(`Queue delay dominated: average waiting time was ${p.waitRatio.toFixed(1)}x the service time, indicating sustained overload.`)
  }

  if (p.avgUtil > 0.85) {
    sentences.push('Worker utilization was high. That is efficient, but it risks queue buildup under burst load.')
  } else if (p.avgUtil > 0.50) {
    sentences.push('Worker utilization was moderate.')
  } else {
    sentences.push(`Workers were substantially idle, leaving ${((1 - p.avgUtil) * 100).toFixed(0)}% of capacity unused.`)
  }

  sentences.push(`This run was configured at ${p.arrivalRate.toFixed(2)} req/s, or about ${(p.targetPerWorkerLoad * 100).toFixed(0)}% reference load per worker.`)

  return sentences.join(' ')
}

function showBottleneckWarning(p: AnalysisProps): boolean {
  if (p.avgServiceTime <= 0 || p.coreCount <= 0) return false
  const wastedFraction = p.idleWasteMs / (p.avgServiceTime * p.coreCount)
  return wastedFraction > 0.05 && p.waitRatio > 0.5
}

export function AnalysisSection(props: AnalysisProps) {
  const { avgServiceTime, avgResponseTime, avgUtil, coreCount, targetPerWorkerLoad, completedTasks } = props
  const rdExpansion = avgServiceTime > 0 ? avgResponseTime / avgServiceTime : 1
  const perWorkerLoad = coreCount > 0 ? avgUtil : 0

  return (
    <div className="mb-6">
      <SectionLabel className="mb-2">Analysis</SectionLabel>
      <div className="tt-divider mb-3" />

      <p className="tt-copy mb-3 text-sm">{generateProse(props)}</p>

      {avgServiceTime > 0 && (
        <div className="mb-3 font-mono text-sm text-[color:var(--tt-info)]">
          {completedTasks > 0 ? `Observed R/D: ${rdExpansion.toFixed(2)}x` : 'Observed R/D: unavailable'}{'   '}
          (target lambda D/c = {(targetPerWorkerLoad * 100).toFixed(1)}%, observed utilization = {(perWorkerLoad * 100).toFixed(1)}%)
        </div>
      )}

      {showBottleneckWarning(props) && (
        <div className="rounded-lg border border-[color:var(--tt-warning)] bg-[color:var(--tt-warning-soft)] px-4 py-3 text-sm text-[color:var(--tt-warning)]">
          ! Dispatcher bottleneck detected: workers were available while requests waited. Earlier dispatch to idle workers would have reduced response time.
        </div>
      )}
    </div>
  )
}
