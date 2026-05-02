import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AlertBanner } from './alert-banner'

describe('AlertBanner', () => {
  it('renders kicker, title and body for the bad tone', () => {
    render(
      <AlertBanner
        tone="bad"
        kicker="Critical · 2 minutes ago"
        title="Leak test failed"
        body="Operator action required"
      />,
    )
    expect(screen.getByText('Critical · 2 minutes ago')).toBeInTheDocument()
    expect(screen.getByText('Leak test failed')).toBeInTheDocument()
    expect(screen.getByText('Operator action required')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('exposes role="status" for non-blocking tones (ok, info)', () => {
    const { rerender } = render(<AlertBanner tone="ok" title="Done" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    rerender(<AlertBanner tone="info" title="Info" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('exposes role="alert" for warn tone', () => {
    render(<AlertBanner tone="warn" title="Watch out" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders the CTA button and fires onClick', () => {
    const onClick = vi.fn()
    render(
      <AlertBanner
        tone="bad"
        title="Issue"
        cta={{ label: 'Riprova', onClick }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Riprova' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
