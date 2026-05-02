import { describe, expect, it, vi } from 'vitest'
import { Trash2 } from 'lucide-react'
import { fireEvent, render, screen } from '@testing-library/react'
import { RowMenu } from './row-menu'

describe('RowMenu', () => {
  it('opens the menu when the trigger is clicked and shows menu items', () => {
    render(
      <RowMenu
        items={[
          { id: 'open', label: 'Apri dettaglio', onClick: () => undefined },
          { id: 'delete', label: 'Elimina', tone: 'bad', icon: Trash2, onClick: () => undefined },
        ]}
      />,
    )
    expect(screen.queryByText('Apri dettaglio')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Azioni riga' }))
    expect(screen.getByText('Apri dettaglio')).toBeInTheDocument()
    expect(screen.getByText('Elimina')).toBeInTheDocument()
  })

  it('calls the item onClick and closes the menu', () => {
    const onOpen = vi.fn()
    render(
      <RowMenu
        items={[{ id: 'open', label: 'Apri', onClick: onOpen }]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Azioni riga' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Apri' }))
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Apri')).not.toBeInTheDocument()
  })
})
