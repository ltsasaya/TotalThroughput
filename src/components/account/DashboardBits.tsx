import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { AppButton, MetricItem, Panel, SectionLabel, cx } from '@/components/ui/primitives'
import type { ProfileClass, ProfileRun } from '@/types/account'

export function DashboardShell({
  label,
  title,
  headerAction,
  children,
}: {
  label?: string
  title?: string
  headerAction?: ReactNode
  children: ReactNode
}) {
  const hasHeader = Boolean(label || title || headerAction)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {label ? <SectionLabel>{label}</SectionLabel> : null}
            {title ? <h1 className="mt-2 text-3xl font-bold text-[color:var(--tt-text)]">{title}</h1> : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      ) : null}
      {children}
    </main>
  )
}

export function MetricBand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Panel className={cx('grid gap-4 p-4 md:grid-cols-3 md:items-center', className)}>
      {children}
    </Panel>
  )
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="tt-label">{label}</span>
      <input
        className="box-border w-full min-w-0 border-[3px] border-black bg-white px-3 py-2 font-mono text-sm font-bold"
        type={type}
        value={value}
        required={required}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  )
}

export function ClassCodeReveal({ code }: { code?: string | null }) {
  const [isRevealed, setIsRevealed] = useState(false)
  if (!code) return <>-</>

  return (
    <button
      type="button"
      className="inline-flex bg-transparent p-0 font-mono font-bold text-inherit underline-offset-4 hover:underline"
      aria-label={isRevealed ? 'Hide class code' : 'Reveal class code'}
      onClick={(event) => {
        event.stopPropagation()
        setIsRevealed(value => !value)
      }}
    >
      {isRevealed ? code : '****'}
    </button>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <div className="border-[2px] border-[color:var(--tt-danger)] bg-[color:var(--tt-danger-soft)] px-3 py-2 text-sm font-bold text-[color:var(--tt-danger)]">
      {children}
    </div>
  )
}

export function ClassCard({
  item,
  onClick,
  disabled = false,
}: {
  item: ProfileClass
  onClick?: () => void
  disabled?: boolean
}) {
  const content = (
    <>
      <div className="min-w-0">
        <div className="truncate text-lg font-bold">{item.className}</div>
        {item.classCode ? (
          <div className="tt-label flex flex-wrap items-center gap-1">
            <span>Code</span>
            <ClassCodeReveal code={item.classCode} />
          </div>
        ) : (
          <div className="tt-label">{item.instructorName ? `Instructor ${item.instructorName}` : 'Class'}</div>
        )}
      </div>
      <MetricItem label="Students" value={item.studentCount} />
    </>
  )

  if (!onClick) {
    return <div className="grid min-h-24 gap-3 border-[3px] border-black bg-white px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">{content}</div>
  }

  const openCard = () => {
    if (!disabled) onClick()
  }

  const keyOpenCard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={openCard}
      onKeyDown={keyOpenCard}
      className="grid min-h-24 cursor-pointer gap-3 border-[3px] border-black bg-white px-4 py-3 text-left transition-colors hover:bg-[color:var(--tt-surface-raised)] aria-disabled:cursor-default sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      {content}
    </div>
  )
}

export function RunRow({ run }: { run: ProfileRun }) {
  return (
    <div className="grid gap-4 border-[2px] border-black bg-white px-4 py-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:items-center">
      <div className="min-w-0">
        <div className="font-bold">{run.difficultyLabel}</div>
        <div className="tt-label">{new Date(run.completedAt).toLocaleString()}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricItem label="Completed" value={run.completedCount} />
        <MetricItem label="Avg R" value={`${(run.averageResponseTime / 1000).toFixed(2)}s`} />
        <MetricItem label="Avg Queue" value={run.averageQueueLength.toFixed(1)} />
      </div>
    </div>
  )
}

export { AppButton, MetricItem, Panel, SectionLabel }
