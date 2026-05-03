'use client'
import * as React from 'react'

export interface PhotoUploadHmiProps {
  value: string | null
  onChange: (next: string | null) => void
  label?: string
  testId?: string
}

/**
 * PNE_4_FOCUSED D4.2 — HMI photo upload mock (mirrors apps/web's
 * PhotoUploadField; kept separate to avoid pulling apps/web into apps/hmi).
 * Click-to-upload only (touchscreen-friendly), base64 in-memory, max 200x200
 * thumbnail. Session-only (TODO-040 extended).
 */
export function PhotoUploadHmi({
  value,
  onChange,
  label = 'Foto del difetto',
  testId = 'hmi-photo-upload',
}: PhotoUploadHmiProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState<string | null>(null)

  const readFile = (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Solo immagini supportate')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
    }
    reader.onerror = () => setError('Errore durante la lettura del file')
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-1.5" data-testid={testId}>
      <span className="text-xs font-medium text-ink-2">{label}</span>
      {value ? (
        <div className="relative inline-flex" data-testid={`${testId}-preview`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Anteprima foto"
            className="rounded-2 border border-line object-cover"
            style={{ maxWidth: 200, maxHeight: 200 }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 rounded-pill bg-paper/95 px-2 py-0.5 text-[11px] font-medium text-bad-ink shadow-sm hover:bg-bad-soft"
            data-testid={`${testId}-remove`}
            aria-label="Rimuovi foto"
          >
            ✕ Rimuovi
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-2 border-2 border-dashed border-line bg-paper p-4 text-center text-sm text-ink-2 hover:border-accent hover:bg-paper-2"
          data-testid={`${testId}-button`}
        >
          📷 Carica foto (mock)
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) readFile(file)
          e.target.value = ''
        }}
        className="hidden"
        data-testid={`${testId}-input`}
      />
      {error && (
        <span className="text-[11px] text-bad-ink" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
