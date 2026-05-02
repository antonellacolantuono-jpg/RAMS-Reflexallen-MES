import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RegistryTile } from './registry-tile'

describe('RegistryTile', () => {
  it('renders code, title and optional sub', () => {
    render(
      <RegistryTile code="EQ-001" title="Linea 2 Estrusore" sub="Asse Pneumatico" photo="placeholder" />,
    )
    expect(screen.getByText('EQ-001')).toBeInTheDocument()
    expect(screen.getByText('Linea 2 Estrusore')).toBeInTheDocument()
    expect(screen.getByText('Asse Pneumatico')).toBeInTheDocument()
  })

  it('renders KPI value with label', () => {
    render(<RegistryTile code="EQ-001" title="Test" kpi={87} kpiLabel="OEE %" />)
    expect(screen.getByText('87')).toBeInTheDocument()
    expect(screen.getByText('OEE %')).toBeInTheDocument()
  })

  it('is keyboard-activatable when onClick is provided', () => {
    const onClick = vi.fn()
    render(<RegistryTile code="X" title="Y" onClick={onClick} />)
    const tile = screen.getByRole('button')
    fireEvent.keyDown(tile, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
