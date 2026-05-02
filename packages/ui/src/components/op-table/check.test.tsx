import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Check } from './check'

describe('Check', () => {
  it('renders the off state with no inner content', () => {
    const { container } = render(<Check state="off" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renders a checkmark when state is on', () => {
    const { container } = render(<Check state="on" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('renders a horizontal bar when state is mixed', () => {
    render(<Check state="mixed" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed')
  })

  it('fires onClick', () => {
    const onClick = vi.fn()
    render(<Check state="off" onClick={onClick} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
