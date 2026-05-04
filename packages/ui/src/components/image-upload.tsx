'use client'
import * as React from 'react'
import { cn } from '../utils/cn'

export interface ImageUploadProps {
  value: string | null
  onChange: (next: string | null) => void
  label?: string
  /** Disable file picker / drop area (read-only display of preview only). */
  readOnly?: boolean
  /** Max raw file size in KB (validated before resize). Default 500. */
  maxSizeKB?: number
  /** Allowed MIME types for upload. Default jpeg/png/webp. */
  allowedTypes?: ReadonlyArray<string>
  /** Override file accept attribute. Defaults from allowedTypes. */
  accept?: string
  /** Test hook id (defaults to "image-upload"). */
  testId?: string
  className?: string
}

const DEFAULT_ALLOWED: ReadonlyArray<string> = ['image/jpeg', 'image/png', 'image/webp']
const RESIZE_MAX_EDGE = 1024
const RESIZE_QUALITY = 0.85

/**
 * Generic image upload primitive: drag-drop OR click-to-browse, with client-
 * side resize (max 1024px longest edge, JPEG q0.85) and base64 data-URL output
 * via `onChange`. Intended for embedding in any registry/configurator form.
 *
 * Storage strategy is base64 in the hosting field; switch to S3-backed via
 * TODO-066 post-deployment.
 */
export function ImageUpload({
  value,
  onChange,
  label = 'Immagine',
  readOnly = false,
  maxSizeKB = 500,
  allowedTypes = DEFAULT_ALLOWED,
  accept,
  testId = 'image-upload',
  className,
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const acceptAttr = accept ?? allowedTypes.join(',')

  const readFile = React.useCallback(
    async (file: File) => {
      setError(null)
      if (!allowedTypes.includes(file.type)) {
        setError(`Formato non supportato (${allowedTypes.join(', ')})`)
        return
      }
      if (file.size > maxSizeKB * 1024) {
        setError(`File troppo grande (max ${maxSizeKB} KB)`)
        return
      }
      setBusy(true)
      try {
        const dataUrl = await resizeToDataUrl(file)
        onChange(dataUrl)
      } catch {
        setError('Errore durante la lettura del file')
      } finally {
        setBusy(false)
      }
    },
    [allowedTypes, maxSizeKB, onChange],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void readFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (readOnly) return
    const file = e.dataTransfer.files?.[0]
    if (file) void readFile(file)
  }

  const openPicker = () => {
    if (readOnly || busy) return
    inputRef.current?.click()
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)} data-testid={testId}>
      <span className="text-xs font-medium text-ink-2">{label}</span>
      {value ? (
        <div className="relative inline-flex" data-testid={`${testId}-preview`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Anteprima immagine"
            className="rounded-2 border border-line object-cover"
            style={{ maxWidth: 200, maxHeight: 200 }}
          />
          {!readOnly && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded-pill bg-paper/95 px-2 py-0.5 text-[11px] font-medium text-bad-ink shadow-sm hover:bg-bad-soft"
              data-testid={`${testId}-remove`}
              aria-label="Rimuovi immagine"
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
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-2 border-2 border-dashed px-4 py-6 text-center text-xs transition-colors',
            readOnly
              ? 'cursor-not-allowed border-line bg-paper-2 text-ink-3'
              : dragOver
                ? 'cursor-pointer border-accent bg-accent-soft text-ink'
                : 'cursor-pointer border-line bg-paper hover:border-accent hover:bg-paper-2 text-ink-2',
          )}
          data-testid={`${testId}-drop-area`}
          aria-label="Trascina o clicca per caricare un'immagine"
          aria-disabled={readOnly || busy}
        >
          <span className="text-lg" aria-hidden>
            📷
          </span>
          <span>{busy ? 'Caricamento…' : 'Clicca o trascina un’immagine qui'}</span>
          <span className="text-[10px] text-ink-3">
            (max {maxSizeKB} KB · ridimensionata a {RESIZE_MAX_EDGE}px)
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleFileChange}
        className="hidden"
        data-testid={`${testId}-input`}
      />
      {error && (
        <span className="text-[11px] text-bad-ink" role="alert" data-testid={`${testId}-error`}>
          {error}
        </span>
      )}
    </div>
  )
}

async function resizeToDataUrl(file: File): Promise<string> {
  const reader = new FileReader()
  const rawDataUrl: string = await new Promise((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('FileReader returned non-string'))
    }
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsDataURL(file)
  })
  // Skip canvas resize in non-DOM envs.
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    return rawDataUrl
  }
  // Race the resize against a short timeout. In jsdom (test env) Image.onload
  // never fires for data: URLs and the resize would hang forever; falling
  // back to the raw data-URL keeps the upload flow testable and responsive.
  try {
    return await Promise.race([resizeViaCanvas(rawDataUrl), timeoutFallback(rawDataUrl, 800)])
  } catch {
    return rawDataUrl
  }
}

function timeoutFallback(fallback: string, ms: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fallback), ms)
  })
}

function resizeViaCanvas(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const { width, height } = scaleToFit(img.naturalWidth, img.naturalHeight, RESIZE_MAX_EDGE)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      try {
        const out = canvas.toDataURL('image/jpeg', RESIZE_QUALITY)
        resolve(out || dataUrl)
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => reject(new Error('Image decode failed'))
    img.src = dataUrl
  })
}

function scaleToFit(w: number, h: number, maxEdge: number): { width: number; height: number } {
  if (w <= maxEdge && h <= maxEdge) return { width: w, height: h }
  const ratio = w >= h ? maxEdge / w : maxEdge / h
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}
