import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('renders title and body', () => {
    render(
      <EmptyState
        kind="select"
        title="Seleziona un equipment"
        body="oppure clicca un nodo"
      />,
    )
    expect(screen.getByText('Seleziona un equipment')).toBeInTheDocument()
    expect(screen.getByText('oppure clicca un nodo')).toBeInTheDocument()
  })

  it('renders the CTA button when provided and triggers onClick', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        kind="no-results"
        title="Nessun risultato"
        cta={{ label: 'Reset filtri', onClick }}
      />,
    )
    const button = screen.getByRole('button', { name: 'Reset filtri' })
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders a disabled CTA when cta.disabled is true', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        kind="error"
        title="Errore"
        cta={{ label: 'Riprova', onClick, disabled: true }}
      />,
    )
    const button = screen.getByRole('button', { name: 'Riprova' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('uses compact padding when compact is true', () => {
    const { container } = render(<EmptyState kind="no-data" title="Vuoto" compact />)
    expect(container.firstChild).toHaveClass('p-6')
    expect(container.firstChild).not.toHaveClass('p-12')
  })

  it('renders the success illustration when kind="success"', () => {
    const { container } = render(
      <EmptyState
        kind="success"
        title="Workflow valido"
        body="Pronto per la pubblicazione"
      />,
    )
    const illust = container.querySelector('[data-empty-state-illust="success"]')
    expect(illust).not.toBeNull()
    expect(screen.getByText('Workflow valido')).toBeInTheDocument()
    expect(screen.getByText('Pronto per la pubblicazione')).toBeInTheDocument()
  })

  it('paints the success illustration with the ok tone (var(--ok))', () => {
    const { container } = render(<EmptyState kind="success" title="OK" />)
    const illust = container.querySelector('[data-empty-state-illust="success"]')
    const stroked = illust?.querySelectorAll('[stroke="var(--ok)"]')
    expect(stroked && stroked.length).toBeGreaterThanOrEqual(2)
  })
})
