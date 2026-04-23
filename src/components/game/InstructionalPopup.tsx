import { useEffect } from 'react'
import { POPUP_CONTENT, type PopupId } from '../../data/instructional'

interface InstructionalPopupProps {
  id: PopupId
  onDismiss: () => void
}

export default function InstructionalPopup({ id, onDismiss }: InstructionalPopupProps) {
  const content = POPUP_CONTENT[id]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Enter') onDismiss() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onDismiss])

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
      onClick={onDismiss}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-10 max-w-lg w-full mx-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-6">{content.title}</h2>
        <div className="space-y-4">
          {content.entries.map((entry, i) =>
            entry.type === 'formula' ? (
              <div key={i} className="bg-gray-800 rounded-lg px-4 py-3">
                <div className="font-mono text-blue-300 text-sm">{entry.formula}</div>
                <div className="text-xs text-gray-400 mt-1">{entry.caption}</div>
              </div>
            ) : (
              <p key={i} className="text-sm text-gray-300 leading-relaxed">
                {entry.text}
              </p>
            )
          )}
        </div>
        <p className="mt-8 text-xs text-gray-600 text-center">
          Press Enter or click to continue
        </p>
      </div>
    </div>
  )
}
