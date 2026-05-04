import * as React from 'react'
import { Layers, ListChecks, Package, Wrench, type LucideIcon } from 'lucide-react'
import { cn } from '../utils/cn'

export type ImageDisplaySize = 'thumbnail' | 'small' | 'medium' | 'large' | 'reference'
export type ImageDisplayFallback = 'icon' | 'initial' | 'none'
export type ImageDisplayCategory = 'item' | 'equipment' | 'step' | 'phase'

export interface ImageDisplayProps {
  src: string | null | undefined
  alt: string
  size: ImageDisplaySize
  /** What to render when src is null/empty. Default 'icon'. */
  fallback?: ImageDisplayFallback
  /** Used by 'icon' fallback to pick a Lucide glyph. */
  iconCategory?: ImageDisplayCategory
  /** Used by 'initial' fallback to render the first letter. */
  entityName?: string
  /** Optional override icon (overrides iconCategory). */
  icon?: React.ReactNode
  className?: string
  testId?: string
}

const SIZE_DIMENSIONS: Record<ImageDisplaySize, { box: string; img: string }> = {
  thumbnail: {
    box: 'h-8 w-8',
    img: 'h-8 w-8 object-cover',
  },
  small: {
    box: 'h-16 w-16',
    img: 'h-16 w-16 object-cover',
  },
  medium: {
    box: 'h-32 w-32',
    img: 'h-32 w-32 object-cover',
  },
  large: {
    box: 'h-60 w-60',
    img: 'h-60 w-60 object-cover',
  },
  reference: {
    box: 'max-h-[200px] max-w-xs',
    img: 'max-h-[200px] max-w-xs object-contain',
  },
}

const ICON_BY_CATEGORY: Record<ImageDisplayCategory, LucideIcon> = {
  item: Package,
  equipment: Wrench,
  step: ListChecks,
  phase: Layers,
}

/**
 * Generic image display primitive with size variants and fallback rendering.
 * Used in registry list thumbnails, detail-page heroes, workflow Tabella/Card,
 * Live Preview and HMI step references. Pairs with `<ImageUpload>` for input.
 */
export function ImageDisplay({
  src,
  alt,
  size,
  fallback = 'icon',
  iconCategory,
  entityName,
  icon,
  className,
  testId = 'image-display',
}: ImageDisplayProps) {
  const dims = SIZE_DIMENSIONS[size]

  if (src && src.length > 0) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn('rounded-2 border border-line', dims.img, className)}
        data-testid={testId}
      />
    )
  }

  if (fallback === 'none') return null

  if (fallback === 'initial') {
    const initial = (entityName ?? alt).trim().charAt(0).toUpperCase() || '?'
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-2 border border-line bg-paper-2 font-medium text-ink-2',
          dims.box,
          className,
        )}
        data-testid={`${testId}-initial`}
        aria-label={alt}
        role="img"
      >
        {initial}
      </span>
    )
  }

  // fallback === 'icon'
  const IconCmp = iconCategory ? ICON_BY_CATEGORY[iconCategory] : null
  const renderedIcon = icon ?? (IconCmp ? <IconCmp className="h-1/2 w-1/2 text-ink-3" /> : null)
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-2 border border-line bg-paper-2 text-ink-3',
        dims.box,
        className,
      )}
      data-testid={`${testId}-icon`}
      aria-label={alt}
      role="img"
    >
      {renderedIcon}
    </span>
  )
}
