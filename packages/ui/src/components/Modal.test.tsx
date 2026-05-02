import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConfirmModal, Modal } from './Modal'

describe('Modal', () => {
  it('renders title and children when open', () => {
    render(
      <Modal open title="Conferma azione">
        <p>corpo del modale</p>
      </Modal>,
    )
    expect(screen.getByText('Conferma azione')).toBeInTheDocument()
    expect(screen.getByText('corpo del modale')).toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal open title="T" onClose={onClose}>
        <p>x</p>
      </Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('locks body scroll while open and restores on close', () => {
    const original = document.body.style.overflow
    const { rerender } = render(
      <Modal open title="T">
        <p>x</p>
      </Modal>,
    )
    expect(document.body.style.overflow).toBe('hidden')
    rerender(
      <Modal open={false} title="T">
        <p>x</p>
      </Modal>,
    )
    expect(document.body.style.overflow).toBe(original)
  })

  it('renders actions prop in footer when provided', () => {
    render(
      <Modal open title="T" actions={<button type="button">OK</button>}>
        <p>x</p>
      </Modal>,
    )
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument()
  })
})

describe('ConfirmModal', () => {
  it('renders Conferma and Annulla buttons by default', () => {
    render(<ConfirmModal open />)
    expect(screen.getByRole('button', { name: 'Conferma' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annulla' })).toBeInTheDocument()
  })
})
