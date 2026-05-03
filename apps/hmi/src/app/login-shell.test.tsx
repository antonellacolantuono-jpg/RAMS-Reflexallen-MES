import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock('../lib/queries', () => ({
  useMe: () => ({ isLoading: false, data: null, error: null }),
  useLogin: () => ({ mutateAsync: vi.fn(async () => {}), isPending: false }),
}))

vi.mock('../components/PinKeypad', () => ({
  PinKeypad: () => <div data-testid="pin-keypad" />,
}))

import HMILoginPage from './page'

describe('HMI Login inside HMIShell', () => {
  it('renders the shell with title "Accesso Operatore"', () => {
    render(<HMILoginPage />)
    expect(screen.getByText('Accesso Operatore')).toBeInTheDocument()
  })

  it('renders Continua HMIBigBtn primary CTA on the badge step', () => {
    render(<HMILoginPage />)
    const btn = screen.getByRole('button', { name: 'Continua' })
    expect(btn).toBeInTheDocument()
    // HMIBigBtn primary uses amber-500 background
    expect(btn.className).toContain('bg-amber-500')
  })

  it('shows the brand logo on the right side of the dark header', () => {
    render(<HMILoginPage />)
    const logo = screen.getByAltText('Reflexallen')
    expect(logo).toBeInTheDocument()
  })
})
