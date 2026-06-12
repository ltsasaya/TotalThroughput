import type { KeyboardEvent } from 'react'

export function ParamInput({
  label,
  symbol,
  value,
  onDraftChange,
  onCommit,
}: {
  label: string
  symbol: string
  value: string
  onDraftChange: (value: string) => void
  onCommit: () => void
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <label className="flex min-w-[8rem] flex-col gap-1">
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold">{symbol} =</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onBlur={onCommit}
          onChange={event => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="w-24 border-[2px] border-black bg-white px-2 py-1 font-mono text-sm font-bold focus:bg-gray-50 focus:outline-none"
        />
      </span>
    </label>
  )
}

export function AxisInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="auto"
        className="w-16 border-[2px] border-black bg-white px-2 py-0.5 font-mono text-xs placeholder:text-gray-300 focus:bg-gray-50 focus:outline-none"
      />
    </label>
  )
}
