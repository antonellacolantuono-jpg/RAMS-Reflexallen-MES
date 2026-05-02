import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastProvider } from '@mes/ui'
import { AddPhaseDrawer } from './AddPhaseDrawer'

describe('AddPhaseDrawer', () => {
  it('renders both Annulla and Aggiungi Fase footer buttons when open, primary uses bg-accent token', () => {
    render(
      <ToastProvider>
        <AddPhaseDrawer open onClose={() => {}} />
      </ToastProvider>,
    )

    const cancel = screen.getByRole('button', { name: 'Annulla' })
    const submit = screen.getByRole('button', { name: 'Aggiungi Fase' })

    expect(cancel).toBeInTheDocument()
    expect(submit).toBeInTheDocument()
    // Submit must use the defined design token (bg-accent), NOT the
    // unmapped Tailwind alias `bg-primary-600` that produces no styling
    // and renders the button invisible (white-on-white).
    expect(submit.className).toMatch(/bg-accent\b/)
    expect(submit.className).not.toMatch(/bg-primary-600/)
    expect(submit).not.toBeDisabled()
  })
})
