import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PlantMap, type PlantMapNode } from './plant-map'

const NODES: PlantMapNode[] = [
  { id: 'a', x: 50, y: 70, code: 'WC-A2', name: 'Assembly L2', status: 'ok' },
  { id: 'b', x: 210, y: 70, code: 'WC-B1', name: 'CNC Cell 1', status: 'warn' },
]

describe('PlantMap', () => {
  it('renders all provided nodes inside the map container with the configured size', () => {
    render(<PlantMap width={800} height={400} nodes={NODES} />)
    const map = screen.getByTestId('plant-map')
    expect(map.style.width).toBe('800px')
    expect(map.style.height).toBe('400px')
    expect(screen.getByText('WC-A2')).toBeInTheDocument()
    expect(screen.getByText('WC-B1')).toBeInTheDocument()
  })

  it('renders zone overlays with a phase data attribute', () => {
    render(
      <PlantMap
        width={800}
        height={400}
        nodes={[]}
        zones={[
          { id: 'z1', x: 20, y: 20, width: 380, height: 160, label: 'Area Produzione', phase: 'production' },
        ]}
      />,
    )
    expect(screen.getByText('Area Produzione')).toBeInTheDocument()
    const map = screen.getByTestId('plant-map')
    const zone = map.querySelector('[data-zone="production"]')
    expect(zone).not.toBeNull()
  })

  it('fires onNodeClick with the clicked node payload', () => {
    const onNodeClick = vi.fn()
    render(<PlantMap width={800} height={400} nodes={NODES} onNodeClick={onNodeClick} />)
    fireEvent.click(screen.getByText('WC-B1'))
    expect(onNodeClick).toHaveBeenCalledTimes(1)
    expect(onNodeClick.mock.calls[0]![0]).toMatchObject({ id: 'b', code: 'WC-B1' })
  })
})
