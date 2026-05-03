'use client'
import * as React from 'react'

export interface PhotoUploadFieldProps {
  value: string | null
  onChange: (next: string | null) => void
  label?: string
  /** Disable file picker / drop area (read-only display of preview only). */
  readOnly?: boolean
  /** Override file accept attribute. */
  accept?: string
  /** Test hook id (defaults to "photo-upload-field"). */
  testId?: string
}

/**
 * PROMPT_PNE_4_FOCUSED D1 — Photo upload mock.
 *
 * Drag-drop OR click-to-upload area. Stores the selected file as a base64
 * data-URL in component state via the `onChange` callback. No backend round-
 * trip — the parent persists the data URL in `node.data.photoBase64`
 * (session-only, lossy on reload, tracked by TODO-040).
 *
 * Renders a thumbnail (max 200x200) with a remove button on hover when a
 * value is present.
 */
export function PhotoUploadField({
  value,
  onChange,
  label = 'Foto allegata (mock)',
  readOnly = false,
  accept = 'image/*',
  testId = 'photo-upload-field',
}: PhotoUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const readFile = React.useCallback(
    (file: File) => {
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('Solo immagini supportate')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === 'string') onChange(result)
      }
      reader.onerror = () => setError('Errore durante la lettura del file')
      reader.readAsDataURL(file)
    },
    [onChange],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    // reset so selecting the same file again still triggers onChange
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (readOnly) return
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  const openPicker = () => {
    if (readOnly) return
    inputRef.current?.click()
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
          {!readOnly && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded-pill bg-paper/95 px-2 py-0.5 text-[11px] font-medium text-bad-ink shadow-sm hover:bg-bad-soft"
              data-testid={`${testId}-remove`}
              aria-label="Rimuovi foto"
            >
              ✕ Rimuovi
            </button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={readOnly ? -1 : 0}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (readOnly) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openPicker()
            }
          }}
          onDragOver={(e) => {
            if (readOnly) return
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={
            'flex flex-col items-center justify-center gap-1 rounded-2 border-2 border-dashed px-4 py-6 text-center text-xs transition-colors ' +
            (readOnly
              ? 'cursor-not-allowed border-line bg-paper-2 text-ink-3'
              : dragOver
                ? 'cursor-pointer border-accent bg-accent-soft text-ink'
                : 'cursor-pointer border-line bg-paper hover:border-accent hover:bg-paper-2 text-ink-2')
          }
          data-testid={`${testId}-drop-area`}
          aria-label="Trascina o clicca per caricare la foto"
        >
          <span className="text-lg" aria-hidden>
            📷
          </span>
          <span>Clicca o trascina un’immagine qui</span>
          <span className="text-[10px] text-ink-3">
            (mock — salvato in memoria di sessione)
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
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
