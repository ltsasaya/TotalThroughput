import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import type { TaskSize } from '@/types/task'

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function Panel({
  children,
  className,
  variant = 'base',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  variant?: 'base' | 'raised' | 'muted' | 'modal'
}) {
  const variantClass = {
    base: 'tt-panel',
    raised: 'tt-panel-raised',
    muted: 'tt-panel-muted',
    modal: 'tt-modal',
  }[variant]

  return (
    <div className={cx(variantClass, className)} {...props}>
      {children}
    </div>
  )
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('tt-section-label', className)}>{children}</div>
}

export function MetricItem({
  label,
  value,
  valueClass,
  className,
}: {
  label: ReactNode
  value: ReactNode
  valueClass?: string
  className?: string
}) {
  return (
    <div className={className}>
      <div className="tt-label">{label}</div>
      <div className={cx('tt-value', valueClass)}>{value}</div>
    </div>
  )
}

export function AppButton({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}) {
  return (
    <button
      className={cx(
        'tt-button',
        variant === 'primary' ? 'tt-button-primary' : 'tt-button-secondary',
        props.disabled && 'tt-button-disabled',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function StatusBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return <span className={cx('tt-chip', `tt-chip-${tone}`, className)}>{children}</span>
}

const SIZE_TONE: Record<TaskSize, Tone> = {
  S: 'success',
  M: 'warning',
  L: 'danger',
}

export function SizeBadge({ size }: { size: TaskSize }) {
  return <StatusBadge tone={SIZE_TONE[size]}>{size}</StatusBadge>
}

export function FormulaCallout({
  formula,
  caption,
  className,
}: {
  formula: ReactNode
  caption?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('tt-formula px-4 py-3', className)}>
      <div className="font-mono text-sm" style={{ color: 'var(--tt-info)' }}>{formula}</div>
      {caption && <div className="tt-label mt-1">{caption}</div>}
    </div>
  )
}
