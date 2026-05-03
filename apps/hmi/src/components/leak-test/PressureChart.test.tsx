import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PressureChart } from './PressureChart'

describe('PressureChart', () => {
  it('renders a circle per sample plus a path when multiple samples are present', () => {
    const history = [
      { t: 0, bar: 0 },
      { t: 5, bar: 5.95 },
      { t: 10, bar: 6.02 },
      { t: 15, bar: 6.0 },
    ]
    render(
      <PressureChart
        history={history}
        targetBar={6.0}
        toleranceBar={0.1}
        width={200}
        height={50}
      />,
    )
    const chart = screen.getByTestId('pressure-chart')
    expect(chart).toBeInTheDocument()
    expect(chart.querySelectorAll('[data-testid="pressure-point"]').length).toBe(
      4,
    )
    expect(chart.querySelector('[data-testid="pressure-line"]')).not.toBeNull()
  })

  it('renders only the threshold lines when history is empty', () => {
    render(
      <PressureChart
        history={[]}
        targetBar={6.0}
        toleranceBar={0.1}
        width={200}
        height={50}
      />,
    )
    const chart = screen.getByTestId('pressure-chart')
    expect(
      chart.querySelectorAll('[data-testid="pressure-point"]').length,
    ).toBe(0)
    expect(chart.querySelector('[data-testid="pressure-line"]')).toBeNull()
  })
})
