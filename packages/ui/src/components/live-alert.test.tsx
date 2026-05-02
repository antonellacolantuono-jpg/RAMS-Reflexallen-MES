import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiveAlert } from './live-alert'

describe('LiveAlert', () => {
  it('renders message, time and tone-coloured dot', () => {
    const { container } = render(
      <LiveAlert tone="bad" message="Leak test failed · WO-0141" time="2m ago" />,
    )
    expect(screen.getByText('Leak test failed · WO-0141')).toBeInTheDocument()
    expect(screen.getByText('2m ago')).toBeInTheDocument()
    const dot = container.querySelector('.bg-bad')
    expect(dot).not.toBeNull()
  })

  it('adds animate-pulse only when isNew is true', () => {
    const { container, rerender } = render(
      <LiveAlert tone="warn" message="x" time="now" />,
    )
    expect(container.querySelector('.motion-safe\\:animate-pulse')).toBeNull()
    rerender(<LiveAlert tone="warn" message="x" time="now" isNew />)
    expect(container.querySelector('.motion-safe\\:animate-pulse')).not.toBeNull()
  })
})
