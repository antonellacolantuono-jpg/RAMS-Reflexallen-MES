import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HMIShell } from './HMIShell'

describe('HMIShell', () => {
  it('renders title and body children', () => {
    render(
      <HMIShell title="Operator Sign-in">
        <p>body content</p>
      </HMIShell>,
    )
    expect(screen.getByText('Operator Sign-in')).toBeInTheDocument()
    expect(screen.getByText('body content')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(
      <HMIShell title="WO-2026-0142" sub="Brake Caliper · Piece #169">
        <p>x</p>
      </HMIShell>,
    )
    expect(screen.getByText('Brake Caliper · Piece #169')).toBeInTheDocument()
  })

  it('omits subtitle element when prop absent', () => {
    const { container } = render(
      <HMIShell title="No Sub">
        <p>x</p>
      </HMIShell>,
    )
    const header = container.querySelector('header')
    expect(header).not.toBeNull()
    // Only the title should render under the left side; the muted subtitle div should be absent.
    expect(header?.querySelectorAll('.uppercase').length).toBe(0)
  })

  it('renders headerRight content when provided', () => {
    render(
      <HMIShell title="T" headerRight={<span data-testid="hr">badge</span>}>
        <p>x</p>
      </HMIShell>,
    )
    expect(screen.getByTestId('hr')).toBeInTheDocument()
  })

  it('renders footer content when provided', () => {
    render(
      <HMIShell title="T" footer={<button type="button">Sign out</button>}>
        <p>x</p>
      </HMIShell>,
    )
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('omits footer element when prop absent', () => {
    const { container } = render(
      <HMIShell title="T">
        <p>x</p>
      </HMIShell>,
    )
    expect(container.querySelector('footer')).toBeNull()
  })

  it('flips header tokens to dark via data-theme on the header element only', () => {
    const { container } = render(
      <HMIShell title="T">
        <p>x</p>
      </HMIShell>,
    )
    const root = container.firstChild as HTMLElement
    const header = container.querySelector('header')
    expect(root.getAttribute('data-theme')).toBeNull()
    expect(header?.getAttribute('data-theme')).toBe('dark')
  })

  it('sets data-mode="hmi" on the root for density token flip', () => {
    const { container } = render(
      <HMIShell title="T">
        <p>x</p>
      </HMIShell>,
    )
    const root = container.firstChild as HTMLElement
    expect(root.getAttribute('data-mode')).toBe('hmi')
  })
})
