import { useState } from 'react'
import { GLOSSARY } from '../../data/glossary'

export function EducationalGlossary() {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-gray-700 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Metric Reference
        </span>
        <span className="text-gray-500 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GLOSSARY.map(entry => (
            <div key={entry.symbol} className="bg-gray-900 rounded-lg p-3">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-blue-300 text-sm">{entry.symbol}</span>
                <span className="text-xs text-gray-500">{entry.name}</span>
              </div>
              {entry.formula && (
                <div className="font-mono text-xs text-gray-400 mb-1">{entry.formula}</div>
              )}
              <div className="text-xs text-gray-500 leading-relaxed">{entry.definition}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
