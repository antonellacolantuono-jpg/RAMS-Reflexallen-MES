import { describe, expect, it, vi } from 'vitest'
import { Trash2 } from 'lucide-react'
import { fireEvent, render, screen } from '@testing-library/react'
import { BulkBar } from './bulk-bar'

describe('BulkBar', () => {
  it('renders the count and clears selection', () => {
    const onClear = vi.fn()
    render(
      <BulkBar
        count={3}
        onClear={onClear}
        actions={[]}
      />,
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/selezionati/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Annulla selezione/ }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('renders bulk action buttons and fires onClick', () => {
    const onDelete = vi.fn()
    render(
      <BulkBar
        count={2}
        onClear={() => undefined}
        actions={[{ id: 'delete', label: 'Elimina', icon: Trash2, tone: 'bad', onClick: onDelete }]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Elimina/ }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
