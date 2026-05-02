import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Drawer } from './Drawer'

describe('Drawer', () => {
  it('renders title and children when open', () => {
    render(
      <Drawer open title="Dettagli">
        <p>contenuto del drawer</p>
      </Drawer>,
    )
    expect(screen.getByText('Dettagli')).toBeInTheDocument()
    expect(screen.getByText('contenuto del drawer')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(
      <Drawer open title="WO" subtitle="WO-20260501-001">
        <p>x</p>
      </Drawer>,
    )
    expect(screen.getByText('WO-20260501-001')).toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <Drawer open title="T" onClose={onClose}>
        <p>x</p>
      </Drawer>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <Drawer open title="T" onClose={onClose}>
        <p>x</p>
      </Drawer>,
    )
    const backdrop = document.body.querySelector('[aria-hidden]') as HTMLElement
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders actions prop in footer when provided', () => {
    render(
      <Drawer open title="T" actions={<button type="button">Salva</button>}>
        <p>x</p>
      </Drawer>,
    )
    expect(screen.getByRole('button', { name: 'Salva' })).toBeInTheDocument()
  })

  it('renders footer prop (backward-compat) when actions absent', () => {
    render(
      <Drawer open title="T" footer={<button type="button">Annulla</button>}>
        <p>x</p>
      </Drawer>,
    )
    expect(screen.getByRole('button', { name: 'Annulla' })).toBeInTheDocument()
  })
})
