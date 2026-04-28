'use client'
import * as React from 'react'
import { cn } from '@mes/ui'

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '✓'],
] as const

type Key = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'C' | '✓'

interface PinKeypadProps {
  value: string
  onChange: (val: string) => void
  onConfirm: () => void
  maxLength?: number
}

export function PinKeypad({ value, onChange, onConfirm, maxLength = 4 }: PinKeypadProps) {
  function handleKey(k: Key) {
    if (k === 'C') {
      onChange('')
    } else if (k === '✓') {
      onConfirm()
    } else if (value.length < maxLength) {
      onChange(value + k)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-center gap-3 mb-2" aria-label="PIN inserito">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 w-4 rounded-full border-2 transition-colors',
              i < value.length ? 'bg-accent border-accent' : 'border-ink-3',
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(KEYS.flat() as Key[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleKey(k)}
            className={cn(
              'min-h-[56px] min-w-[56px] rounded-2 text-xl font-semibold transition-colors',
              'flex items-center justify-center select-none',
              k === '✓'
                ? 'bg-accent text-white hover:bg-accent/90'
                : k === 'C'
                  ? 'bg-paper-3 text-bad hover:bg-bad-soft'
                  : 'bg-paper-2 text-ink hover:bg-paper-3',
            )}
            aria-label={k === 'C' ? 'Cancella' : k === '✓' ? 'Conferma' : k}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
