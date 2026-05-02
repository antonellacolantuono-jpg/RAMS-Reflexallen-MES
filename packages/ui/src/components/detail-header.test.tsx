import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DetailHeader } from './detail-header'

describe('DetailHeader', () => {
  it('renders title, breadcrumb and subtitle', () => {
    render(
      <DetailHeader
        breadcrumb={<span>Production / Work Orders</span>}
        title="WO-2026-0142"
        subtitle="Brake Caliper Assembly · 240 pcs"
      />,
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('WO-2026-0142')
    expect(screen.getByText(/Production/)).toBeInTheDocument()
    expect(screen.getByText(/Brake Caliper Assembly/)).toBeInTheDocument()
  })

  it('renders status and priority badges', () => {
    render(
      <DetailHeader
        title="WO-1"
        statusBadge={<span data-testid="status">In progress</span>}
        priorityBadge={<span data-testid="priority">High</span>}
      />,
    )
    expect(screen.getByTestId('status')).toBeInTheDocument()
    expect(screen.getByTestId('priority')).toBeInTheDocument()
  })

  it('applies sticky classes when sticky prop is true', () => {
    const { container } = render(
      <DetailHeader title="X" sticky />,
    )
    const header = container.querySelector('header')!
    expect(header.className).toMatch(/sticky/)
    expect(header.className).toMatch(/top-0/)
  })
})
