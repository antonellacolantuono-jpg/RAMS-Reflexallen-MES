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

  it('uses default sizing (centered, max-h-[90vh], rounded-xl) when fullScreen is false', () => {
    render(
      <Modal open title="T">
        <p>x</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toHaveAttribute('data-fullscreen')
    expect(dialog.className).toContain('max-h-[90vh]')
    expect(dialog.className).toContain('rounded-xl')
  })

  it('renders edge-to-edge full-viewport sizing when fullScreen is true', () => {
    render(
      <Modal open title="T" fullScreen>
        <p>x</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('data-fullscreen', 'true')
    expect(dialog.className).toContain('h-screen')
    expect(dialog.className).toContain('w-screen')
    expect(dialog.className).toContain('rounded-none')
    expect(dialog.style.width).toBe('')
  })
})

describe('ConfirmModal', () => {
  it('renders Conferma and Annulla buttons by default', () => {
    render(<ConfirmModal open />)
    expect(screen.getByRole('button', { name: 'Conferma' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annulla' })).toBeInTheDocument()
  })
})
