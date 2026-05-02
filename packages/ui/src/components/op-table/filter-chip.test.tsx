import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FilterChip } from './filter-chip'

describe('FilterChip', () => {
  it('renders field, op and value', () => {
    render(<FilterChip field="Status" op="is" value="In progress" />)
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('is')).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('calls onRemove when × is clicked', () => {
    const onRemove = vi.fn()
    render(<FilterChip field="Priority" op=">=" value="High" onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: /Rimuovi filtro Priority/ }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
