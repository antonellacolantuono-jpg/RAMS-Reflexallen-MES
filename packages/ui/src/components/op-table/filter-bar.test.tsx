import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FilterBar } from './filter-bar'

describe('FilterBar', () => {
  it('shows the search input and emits onSearchChange', () => {
    const onChange = vi.fn()
    render(<FilterBar search="" onSearchChange={onChange} searchPlaceholder="Cerca…" />)
    const input = screen.getByPlaceholderText('Cerca…')
    fireEvent.change(input, { target: { value: 'caliper' } })
    expect(onChange).toHaveBeenCalledWith('caliper')
  })

  it('renders filter chips and Reset filtri when filters present', () => {
    const onClear = vi.fn()
    render(
      <FilterBar
        search=""
        onSearchChange={() => undefined}
        filters={[
          { field: 'Status', op: 'is', value: 'released' },
          { field: 'Priority', op: '>=', value: 'high' },
        ]}
        onClearFilters={onClear}
      />,
    )
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset filtri' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
