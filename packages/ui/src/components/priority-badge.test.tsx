import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityBadge } from './priority-badge'

describe('PriorityBadge', () => {
  it('renders Bassa label for low priority', () => {
    render(<PriorityBadge priority="low" />)
    expect(screen.getByText('Bassa')).toBeInTheDocument()
  })

  it('renders Normale label for normal priority', () => {
    render(<PriorityBadge priority="normal" />)
    expect(screen.getByText('Normale')).toBeInTheDocument()
  })

  it('renders Alta label for high priority', () => {
    render(<PriorityBadge priority="high" />)
    expect(screen.getByText('Alta')).toBeInTheDocument()
  })

  it('renders Urgente label for urgent priority', () => {
    render(<PriorityBadge priority="urgent" />)
    expect(screen.getByText('Urgente')).toBeInTheDocument()
  })

  it('applies bad tone class for urgent priority', () => {
    const { container } = render(<PriorityBadge priority="urgent" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toMatch(/bg-bad-soft/)
  })
})
