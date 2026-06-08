import { useState } from 'react'
import { GLOSSARY } from '../../data/glossary'
import { Panel, SectionLabel } from '@/components/ui/primitives'

export function EducationalGlossary() {
  const [open, setOpen] = useState(false)

  return (
    <Panel variant="raised" className="overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[color:var(--tt-surface-muted)]"
      >
        <SectionLabel>Metric Reference</SectionLabel>
        <span className="tt-muted text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GLOSSARY.map(entry => (
            <Panel key={entry.symbol} className="p-3">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="font-mono text-sm text-[color:var(--tt-info)]">{entry.symbol}</span>
                <span className="tt-label">{entry.name}</span>
              </div>
              {entry.formula && (
                <div className="mb-1 font-mono text-xs text-[color:var(--tt-text-muted)]">{entry.formula}</div>
              )}
              <div className="tt-label leading-relaxed">{entry.definition}</div>
            </Panel>
          ))}
        </div>
      )}
    </Panel>
  )
}
