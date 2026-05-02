import { describe, expect, it, vi } from 'vitest'
import { Plus, Target } from 'lucide-react'
import { fireEvent, render, screen } from '@testing-library/react'
import { CanvasGrid } from './canvas-grid'
import { ZoomControls } from './zoom-controls'
import { Minimap } from './minimap'
import { CanvasToolbar } from './canvas-toolbar'
import { CanvasStateBar } from './canvas-state-bar'
import { GenericNode } from './generic-node'
import { Edge } from './edge'
import { ArrowDefs } from './arrow-defs'

describe('canvas suite', () => {
  it('CanvasGrid renders children with custom step in backgroundSize', () => {
    const { container } = render(
      <CanvasGrid step={64} height={300}>
        <span data-testid="child" />
      </CanvasGrid>,
    )
    const grid = screen.getByTestId('canvas-grid')
    expect(grid.style.backgroundSize).toBe('64px 64px')
    expect(grid.style.height).toBe('300px')
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull()
  })

  it('ZoomControls fires the right callback for each control', () => {
    const onZoomIn = vi.fn()
    const onZoomOut = vi.fn()
    const onFit = vi.fn()
    render(
      <ZoomControls
        zoomPercent={90}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFit={onFit}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adatta' }))
    expect(onZoomIn).toHaveBeenCalledTimes(1)
    expect(onZoomOut).toHaveBeenCalledTimes(1)
    expect(onFit).toHaveBeenCalledTimes(1)
    expect(screen.getByText('90%')).toBeInTheDocument()
  })

  it('Minimap renders nodes and viewport indicator', () => {
    render(
      <Minimap
        nodes={[
          { x: 12, y: 10 },
          { x: 38, y: 22, highlighted: true },
        ]}
        viewport={{ x: 24, y: 8, width: 60, height: 36 }}
      />,
    )
    const minimap = screen.getByTestId('minimap')
    expect(minimap.querySelectorAll('.bg-ink-3').length).toBe(1)
    expect(minimap.querySelectorAll('.bg-accent').length).toBe(1)
    expect(screen.getByLabelText('Viewport')).toBeInTheDocument()
  })

  it('CanvasToolbar renders one button per tool with active toggle', () => {
    const onSelect = vi.fn()
    render(
      <CanvasToolbar
        tools={[
          { id: 'pan', icon: Target, label: 'Pan' },
          { id: 'add', icon: Plus, label: 'Add', active: true, onClick: onSelect },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Pan' })).toHaveAttribute('aria-pressed', 'false')
    const addBtn = screen.getByRole('button', { name: 'Add' })
    expect(addBtn).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(addBtn)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('CanvasStateBar renders status text, counts, and tone-coloured dot', () => {
    const { container } = render(
      <CanvasStateBar tone="warn" status="Unsaved changes" counts="12 nodes · 14 edges" />,
    )
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(screen.getByText('12 nodes · 14 edges')).toBeInTheDocument()
    expect(container.querySelector('.bg-warn')).not.toBeNull()
  })

  it('GenericNode renders title/sub at x/y with input+output ports by default', () => {
    const { container } = render(
      <GenericNode x={120} y={60} title="Operator check-in" sub="3 fields" status="ok" kicker="form" />,
    )
    const node = container.firstElementChild as HTMLElement
    expect(node.style.left).toBe('120px')
    expect(node.style.top).toBe('60px')
    expect(node.dataset.status).toBe('ok')
    expect(screen.getByText('Operator check-in')).toBeInTheDocument()
    expect(screen.getByText('3 fields')).toBeInTheDocument()
    expect(screen.getByText('form')).toBeInTheDocument()
  })

  it('Edge renders an SVG <path> with the right marker reference and tone-encoded data attr', () => {
    const { container } = render(
      <svg>
        <ArrowDefs />
        <Edge from={{ x: 0, y: 10 }} to={{ x: 100, y: 10 }} tone="accent" label="approved" />
      </svg>,
    )
    const path = container.querySelector('path[stroke="var(--accent)"]') as SVGPathElement
    expect(path).not.toBeNull()
    expect(path.getAttribute('marker-end')).toBe('url(#canvas-arrow-accent)')
    const group = container.querySelector('g[data-tone="accent"]')
    expect(group).not.toBeNull()
    // ArrowDefs renders 3 markers (ink, accent, bad)
    const markers = container.querySelectorAll('marker')
    expect(markers.length).toBe(3)
  })
})
