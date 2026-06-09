import { useEffect } from 'react'
import { POPUP_CONTENT, type PopupId } from '../../data/instructional'
import { FormulaCallout, Panel } from '@/components/ui/primitives'

interface InstructionalPopupProps {
  id: PopupId
  onDismiss: () => void
}

export default function InstructionalPopup({ id, onDismiss }: InstructionalPopupProps) {
  const content = POPUP_CONTENT[id]

  useEffect(() => {
    const handler = () => onDismiss()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onDismiss])

  return (
    <div className="retro-modal-backdrop fixed inset-0 z-50 flex items-center justify-center" onClick={onDismiss}>
      <Panel variant="modal" className="mx-6 w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-bold text-[color:var(--tt-text)]">{content.title}</h2>
        <div className="space-y-4">
          {content.entries.map((entry, i) =>
            entry.type === 'formula' ? (
              <FormulaCallout key={i} formula={entry.formula} caption={entry.caption} />
            ) : (
              <p key={i} className="tt-copy text-sm">
                {entry.text}
              </p>
            )
          )}
        </div>
        <p className="tt-muted mt-8 text-center text-xs">
          Press Enter or click to continue
        </p>
      </Panel>
    </div>
  )
}
