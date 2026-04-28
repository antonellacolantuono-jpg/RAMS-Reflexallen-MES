'use client'

import * as React from 'react'
import { cn } from '../utils/cn'

export interface FilterChip {
  key: string
  label: string
  value: string
}

export interface SearchBarProps {
  value?: string | undefined
  onChange?: ((value: string) => void) | undefined
  placeholder?: string | undefined
  chips?: FilterChip[] | undefined
  onRemoveChip?: ((key: string) => void) | undefined
  actions?: React.ReactNode | undefined
  className?: string | undefined
}

export function SearchBar({
  value = '',
  onChange,
  placeholder = 'Cerca…',
  chips = [],
  onRemoveChip,
  actions,
  className,
}: SearchBarProps) {
  const [local, setLocal] = React.useState(value)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setLocal(value)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setLocal(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange?.(v), 300)
  }

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={local}
            onChange={handleChange}
            placeholder={placeholder}
            className="h-9 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 border border-primary-200"
            >
              {chip.label}: {chip.value}
              {onRemoveChip && (
                <button
                  type="button"
                  onClick={() => onRemoveChip(chip.key)}
                  className="ml-0.5 rounded-full hover:bg-primary-200 p-0.5 leading-none"
                  aria-label={`Rimuovi filtro ${chip.label}`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
