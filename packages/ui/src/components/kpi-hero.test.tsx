import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiHero } from './kpi-hero'

describe('KpiHero', () => {
  it('renders label, value and unit', () => {
    render(<KpiHero label="Plant OEE" value="78.4" unit="%" />)
    expect(screen.getByText('Plant OEE')).toBeInTheDocument()
    expect(screen.getByText('78.4')).toBeInTheDocument()
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it('uses big text size when big prop is true', () => {
    const { container } = render(<KpiHero label="X" value={42} big />)
    const value = container.querySelector('.text-6xl')
    expect(value).not.toBeNull()
  })

  it('applies the accent tone class', () => {
    const { container } = render(<KpiHero label="X" value={42} tone="accent" />)
    const valueDiv = container.querySelector('.text-accent')
    expect(valueDiv).not.toBeNull()
  })

  it('renders the up trend with green tone', () => {
    const { container } = render(
      <KpiHero label="X" value={1} trend="up" trendLabel="+4.2%" />,
    )
    expect(screen.getByText('+4.2%')).toBeInTheDocument()
    expect(container.querySelector('.text-ok-ink')).not.toBeNull()
  })

  it('omits trend block when trend is missing', () => {
    render(<KpiHero label="X" value={1} sub="just a sub" />)
    expect(screen.getByText('just a sub')).toBeInTheDocument()
    expect(screen.queryByText('+4.2%')).not.toBeInTheDocument()
  })
})
