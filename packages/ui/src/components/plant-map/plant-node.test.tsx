import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PlantNode } from './plant-node'

describe('PlantNode', () => {
  it('renders code, name, kpi at the configured x/y position', () => {
    const { container } = render(
      <PlantNode x={50} y={70} code="WC-A2" name="Assembly L2" status="ok" kpi="168/240 · 70%" />,
    )
    expect(screen.getByText('WC-A2')).toBeInTheDocument()
    expect(screen.getByText('Assembly L2')).toBeInTheDocument()
    expect(screen.getByText('168/240 · 70%')).toBeInTheDocument()
    const node = container.firstElementChild as HTMLElement
    expect(node.style.left).toBe('50px')
    expect(node.style.top).toBe('70px')
    expect(node.dataset.status).toBe('ok')
  })

  it('uses thicker bad-coloured border when status is bad', () => {
    const { container } = render(
      <PlantNode x={0} y={0} code="X" name="Y" status="bad" kpi="24/80" />,
    )
    const node = container.firstElementChild as HTMLElement
    expect(node.className).toMatch(/border-bad/)
    expect(node.className).toMatch(/border-\[1\.5px\]/)
  })

  it('fires onClick on Enter when interactive', () => {
    const onClick = vi.fn()
    render(<PlantNode x={0} y={0} code="X" name="Y" onClick={onClick} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
