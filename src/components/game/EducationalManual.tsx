import { useMemo, useState } from 'react'
import {
  createEducationalManualPages,
  resolvePlayerName,
  type ManualTextSegment,
} from '@/data/educationalManual'
import { RetroHeader } from './RetroHeader'

interface EducationalManualProps {
  onComplete: () => void
  playerName?: string
}

function ManualParagraph({ segments }: { segments: ManualTextSegment[] }) {
  return (
    <p>
      {segments.map((segment, index) => {
        if (segment.danger) {
          return <strong key={index} className="retro-manual-danger">{segment.text}</strong>
        }
        if (segment.strong) {
          return <strong key={index}>{segment.text}</strong>
        }
        return <span key={index}>{segment.text}</span>
      })}
    </p>
  )
}

function RpcDiagram({ playerName }: { playerName: string }) {
  return (
    <figure className="retro-manual-diagram" aria-label="RPC request and response diagram">
      <svg viewBox="0 0 620 360" role="img" aria-labelledby="rpc-diagram-title rpc-diagram-desc">
        <title id="rpc-diagram-title">
          Client computer sends an RPC request to the server and waits for a response
        </title>
        <desc id="rpc-diagram-desc">
          {playerName} is the client. You are the server. The client calls a remote
          procedure, waits while the server executes it, and resumes after the response.
        </desc>
        <defs>
          <marker id="manual-arrow" markerWidth="6" markerHeight="6" refX="5.2" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" />
          </marker>
        </defs>

        <text className="diagram-label" x="170" y="37" textAnchor="middle">
          Client (<tspan fontWeight="700">{playerName}</tspan>)
        </text>

        <g aria-hidden="true">
          <rect className="diagram-device" x="130" y="60" width="80" height="54" rx="4" />
          <rect className="diagram-device-screen" x="138" y="68" width="64" height="36" rx="2" />
          <path className="diagram-device" d="M 157 114 L 183 114 L 190 132 L 150 132 Z" />
          <rect className="diagram-device" x="132" y="138" width="76" height="8" rx="3" />
        </g>

        <text className="diagram-label" x="478" y="37" textAnchor="middle">
          Server (<tspan fontWeight="700">You</tspan>)
        </text>

        <g aria-hidden="true">
          <path className="diagram-device" d="M 440 68 L 478 49 L 516 68 L 478 88 Z" />
          <path className="diagram-server-face" d="M 440 68 L 478 88 L 478 150 L 440 130 Z" />
          <path className="diagram-server-side" d="M 478 88 L 516 68 L 516 130 L 478 150 Z" />
          <path className="diagram-server-line" d="M 452 88 L 466 96" />
          <path className="diagram-server-line" d="M 452 107 L 466 115" />
          <circle className="diagram-server-dot" cx="456" cy="126" r="3.5" />
          <path className="diagram-server-line" d="M 492 96 L 506 89" />
          <path className="diagram-server-line" d="M 492 115 L 506 108" />
        </g>

        <line className="diagram-lifeline" x1="170" y1="158" x2="170" y2="344" />
        <line className="diagram-lifeline" x1="478" y1="158" x2="478" y2="344" />

        <line className="diagram-arrow" x1="170" y1="158" x2="170" y2="198" markerEnd="url(#manual-arrow)" />
        <text className="diagram-side-label" x="34" y="172">Call remote</text>
        <text className="diagram-side-label" x="34" y="190">procedure</text>

        <line className="diagram-arrow" x1="170" y1="198" x2="478" y2="236" markerEnd="url(#manual-arrow)" />
        <rect className="diagram-label-backdrop" x="257" y="176" width="126" height="24" rx="7" />
        <text className="diagram-path-label" x="320" y="199" textAnchor="middle">Request message</text>

        <text className="diagram-side-label" x="34" y="250">Client waiting</text>
        <text className="diagram-side-label" x="34" y="268">(suspended)</text>
        <text className="diagram-danger-star" x="126" y="268">*</text>

        <text className="diagram-side-label diagram-side-label-right" x="506" y="178">
          Waiting for
        </text>
        <text className="diagram-side-label diagram-side-label-right" x="506" y="196">
          request
        </text>

        <line className="diagram-arrow" x1="478" y1="236" x2="478" y2="276" markerEnd="url(#manual-arrow)" />
        <text className="diagram-side-label diagram-side-label-right" x="506" y="252">
          Procedure
        </text>
        <text className="diagram-side-label diagram-side-label-right" x="506" y="270">
          executes
        </text>

        <line className="diagram-arrow" x1="478" y1="276" x2="170" y2="315" markerEnd="url(#manual-arrow)" />
        <text className="diagram-path-label" x="320" y="319" textAnchor="middle">Response</text>

        <line className="diagram-arrow" x1="170" y1="315" x2="170" y2="344" markerEnd="url(#manual-arrow)" />
        <text className="diagram-side-label" x="34" y="328">Client resumes</text>
        <text className="diagram-side-label" x="34" y="346">execution</text>

        <text className="diagram-side-label diagram-side-label-right" x="506" y="318">
          Waiting for
        </text>
        <text className="diagram-side-label diagram-side-label-right" x="506" y="336">
          next request
        </text>
      </svg>
    </figure>
  )
}

export function EducationalManual({ onComplete, playerName }: EducationalManualProps) {
  const resolvedPlayerName = resolvePlayerName(playerName)
  const pages = useMemo(
    () => createEducationalManualPages(resolvedPlayerName),
    [resolvedPlayerName]
  )
  const [pageIndex, setPageIndex] = useState(0)
  const page = pages[pageIndex]
  const isFirstPage = pageIndex === 0
  const isLastPage = pageIndex === pages.length - 1

  return (
    <div className="app-shell">
      <section className="retro-manual-screen" aria-label="Educational manual">
        <RetroHeader />

        <div className="retro-manual-shell">
          <article className="retro-manual-page">
            <header className="retro-manual-header">
              <h1>Educational Manual</h1>
            </header>

            <div className="retro-manual-content">
              <div className="retro-manual-copy">
                {page.paragraphs.map((paragraph, index) => (
                  <ManualParagraph key={`${page.id}-${index}`} segments={paragraph} />
                ))}
              </div>

              {page.diagram === 'rpc' && <RpcDiagram playerName={resolvedPlayerName} />}

              {page.afterDiagramParagraphs && (
                <div className="retro-manual-copy retro-manual-copy-after-diagram">
                  {page.afterDiagramParagraphs.map((paragraph, index) => (
                    <ManualParagraph key={`${page.id}-after-${index}`} segments={paragraph} />
                  ))}
                </div>
              )}
            </div>

            <footer className="retro-manual-footer">
              <div>
                {!isFirstPage && (
                  <button
                    type="button"
                    className="retro-manual-button retro-manual-button-secondary"
                    onClick={() => setPageIndex(pageIndex - 1)}
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="retro-manual-page-count" aria-label="Manual page progress">
                {pageIndex + 1} / {pages.length}
              </div>

              <button
                type="button"
                className="retro-manual-button retro-manual-button-primary"
                onClick={() => {
                  if (isLastPage) {
                    onComplete()
                    return
                  }
                  setPageIndex(pageIndex + 1)
                }}
              >
                {isLastPage ? 'Close' : 'Next'}
              </button>
            </footer>
          </article>
        </div>
      </section>
    </div>
  )
}
