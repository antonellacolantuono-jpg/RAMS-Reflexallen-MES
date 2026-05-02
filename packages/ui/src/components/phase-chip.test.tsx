import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhaseChip } from './phase-chip'

describe('PhaseChip', () => {
  it('renders pending state with neutral border', () => {
    render(<PhaseChip label="Production" phase="production" />)
    const chip = screen.getByText('Production').closest('span') as HTMLElement
    expect(chip.dataset.state).toBe('pending')
  })

  it('renders active state with phase-color text', () => {
    render(<PhaseChip label="Production" phase="production" active />)
    const chip = screen.getByText('Production').closest('span') as HTMLElement
    expect(chip.dataset.state).toBe('active')
    expect(chip.className).toMatch(/text-c-production/)
  })

  it('renders done state with check icon and reduced opacity', () => {
    const { container } = render(<PhaseChip label="Setup" phase="setup" done />)
    const chip = screen.getByText('Setup').closest('span') as HTMLElement
    expect(chip.dataset.state).toBe('done')
    expect(chip.className).toMatch(/opacity-70/)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('done overrides active when both are passed', () => {
    render(<PhaseChip label="QC" phase="qc" active done />)
    const chip = screen.getByText('QC').closest('span') as HTMLElement
    expect(chip.dataset.state).toBe('done')
  })

  it('encodes the phase via data-phase for styling hooks', () => {
    render(<PhaseChip label="Inbound" phase="inbound" active />)
    const chip = screen.getByText('Inbound').closest('span') as HTMLElement
    expect(chip.dataset.phase).toBe('inbound')
  })

  it('renders the dot in the phase color class', () => {
    const { container } = render(<PhaseChip label="Outbound" phase="outbound" />)
    const dot = container.querySelector('.bg-c-outbound')
    expect(dot).not.toBeNull()
  })
})
