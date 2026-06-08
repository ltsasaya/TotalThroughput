import { useMemo, useState } from 'react'
import {
  createEducationalManualPages,
  resolvePlayerName,
  type ManualTextSegment,
} from '@/data/educationalManual'
import { QueueDiagram, RequestResponseDiagram } from './EducationalManualDiagrams'
import { RetroHeader } from './RetroHeader'

interface EducationalManualProps {
  onHome: () => void
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

export function EducationalManual({ onComplete, onHome, playerName }: EducationalManualProps) {
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
        <RetroHeader onHome={onHome} />

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

              {page.diagram === 'request-response' && <RequestResponseDiagram playerName={resolvedPlayerName} />}
              {page.diagram === 'queue' && <QueueDiagram />}

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
