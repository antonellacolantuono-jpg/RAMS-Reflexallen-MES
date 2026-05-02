import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WCCard } from './wc-card'

describe('WCCard', () => {
  it('renders code, name, WO and quantity', () => {
    render(
      <WCCard
        code="WC-A2"
        name="Assembly Line 2"
        wo="WO-2026-0142"
        q={{ current: 168, target: 240 }}
        pct={70}
        oee={81}
        status="ok"
        op="M. Conti"
      />,
    )
    expect(screen.getByText('WC-A2')).toBeInTheDocument()
    expect(screen.getByText('Assembly Line 2')).toBeInTheDocument()
    expect(screen.getByText('WO-2026-0142')).toBeInTheDocument()
    expect(screen.getByText('168 / 240')).toBeInTheDocument()
    expect(screen.getByText('OEE 81%')).toBeInTheDocument()
    expect(screen.getByText('M. Conti')).toBeInTheDocument()
  })

  it('exposes a progress bar with aria-valuenow clamped to 0-100', () => {
    render(<WCCard code="X" name="Y" pct={150} status="ok" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '100')
  })

  it('uses thicker border when status is bad', () => {
    const { container } = render(<WCCard code="X" name="Y" status="bad" />)
    const card = container.firstElementChild as HTMLElement
    expect(card.dataset.status).toBe('bad')
    expect(card.className).toMatch(/border-bad/)
    expect(card.className).toMatch(/border-\[1\.5px\]/)
  })
})
