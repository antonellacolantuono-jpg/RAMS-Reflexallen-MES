import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ImageDisplay } from './image-display'

const tinyPngDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII='

describe('ImageDisplay', () => {
  it('renders an <img> with the given src when src is present', () => {
    render(<ImageDisplay src={tinyPngDataUrl} alt="Foto" size="medium" />)
    const img = screen.getByTestId('image-display') as HTMLImageElement
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toBe(tinyPngDataUrl)
    expect(img.getAttribute('alt')).toBe('Foto')
  })

  it('renders a Lucide icon fallback when src is null and iconCategory is set', () => {
    render(
      <ImageDisplay src={null} alt="Articolo" size="thumbnail" iconCategory="item" />,
    )
    const fallback = screen.getByTestId('image-display-icon')
    expect(fallback).toBeInTheDocument()
    // Lucide injects an SVG inside the fallback wrapper
    expect(fallback.querySelector('svg')).not.toBeNull()
  })

  it('renders the first letter of entityName when fallback="initial"', () => {
    render(
      <ImageDisplay
        src={null}
        alt="Articolo Demo"
        size="small"
        fallback="initial"
        entityName="Carbonio Roving"
      />,
    )
    const fallback = screen.getByTestId('image-display-initial')
    expect(fallback.textContent).toBe('C')
  })

  it('applies the correct size dimension classes per size variant', () => {
    const { rerender } = render(
      <ImageDisplay src={tinyPngDataUrl} alt="x" size="thumbnail" />,
    )
    expect(screen.getByTestId('image-display').className).toMatch(/h-8/)
    rerender(<ImageDisplay src={tinyPngDataUrl} alt="x" size="large" />)
    expect(screen.getByTestId('image-display').className).toMatch(/h-60/)
    rerender(<ImageDisplay src={tinyPngDataUrl} alt="x" size="reference" />)
    expect(screen.getByTestId('image-display').className).toMatch(/max-h-\[200px\]/)
  })

  it('returns null when fallback="none" and src missing', () => {
    const { container } = render(
      <ImageDisplay src={null} alt="x" size="thumbnail" fallback="none" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it.each([
    ['item' as const, 'lucide-package'],
    ['equipment' as const, 'lucide-wrench'],
    ['step' as const, 'lucide-list-checks'],
    ['phase' as const, 'lucide-layers'],
  ])('renders the correct Lucide icon for category=%s', (category, lucideClass) => {
    render(
      <ImageDisplay src={null} alt="x" size="small" iconCategory={category} />,
    )
    const fallback = screen.getByTestId('image-display-icon')
    const svg = fallback.querySelector('svg')
    expect(svg?.getAttribute('class')).toContain(lucideClass)
  })
})
