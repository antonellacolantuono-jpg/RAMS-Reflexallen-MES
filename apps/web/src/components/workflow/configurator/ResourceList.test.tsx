import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ResourceList } from './ResourceList'

interface Row {
  id: string
  code: string
  name: string
}

const ROWS: Row[] = [
  { id: 'r1', code: 'M-001', name: 'Tubo PA12 nero' },
  { id: 'r2', code: 'M-002', name: 'Tubo EVOH bianco' },
  { id: 'r3', code: 'C-100', name: 'Raccordo M12' },
]

function setup(selectedIds: string[] = []) {
  const onToggle = vi.fn()
  const onClear = vi.fn()
  const utils = render(
    <ResourceList
      testId="materials"
      items={ROWS}
      selectedIds={selectedIds}
      onToggle={onToggle}
      onClear={onClear}
      getId={(r) => r.id}
      getSearchHaystack={(r) => `${r.code} ${r.name}`}
      renderRow={(r) => (
        <span>
          <span data-row-code>{r.code}</span> — <span data-row-name>{r.name}</span>
        </span>
      )}
    />,
  )
  return { ...utils, onToggle, onClear }
}

describe('ResourceList', () => {
  it('filters rows by search query (matches code OR name) client-side', () => {
    setup()

    // All 3 rows visible initially.
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(3)

    const search = screen.getByRole('textbox')
    fireEvent.change(search, { target: { value: 'evoh' } })

    // Only the EVOH row remains.
    const visible = screen.getAllByRole('button', { pressed: false })
    expect(visible).toHaveLength(1)
    expect(visible[0]?.textContent).toMatch(/M-002/)

    // Search by code prefix matches another single row.
    fireEvent.change(search, { target: { value: 'C-' } })
    const byCode = screen.getAllByRole('button', { pressed: false })
    expect(byCode).toHaveLength(1)
    expect(byCode[0]?.textContent).toMatch(/Raccordo M12/)

    // Empty search restores all rows.
    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(3)
  })

  it('calls onToggle with the row id when a row is clicked, and reflects selection via aria-pressed', () => {
    const { onToggle, rerender } = setup([])

    // Click second row.
    const rows = screen.getAllByRole('button', { pressed: false })
    fireEvent.click(rows[1]!)
    expect(onToggle).toHaveBeenCalledWith('r2')
    expect(onToggle).toHaveBeenCalledTimes(1)

    // Re-render with r2 selected — that row's aria-pressed flips to true.
    rerender(
      <ResourceList
        testId="materials"
        items={ROWS}
        selectedIds={['r2']}
        onToggle={onToggle}
        onClear={() => {}}
        getId={(r) => r.id}
        getSearchHaystack={(r) => `${r.code} ${r.name}`}
        renderRow={(r) => <span>{r.name}</span>}
      />,
    )

    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(2)
    // Footer counter reflects selection.
    expect(screen.getByText('1 selezionato')).toBeInTheDocument()
  })

  it('renders the loading skeleton when isLoading is true (no rows shown)', () => {
    const onToggle = vi.fn()
    const { container } = render(
      <ResourceList
        testId="materials"
        items={[]}
        selectedIds={[]}
        onToggle={onToggle}
        onClear={() => {}}
        getId={(r: Row) => r.id}
        getSearchHaystack={() => ''}
        renderRow={() => null}
        isLoading
      />,
    )

    expect(container.querySelector('[data-resource-skeleton="rows"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-resource-skeleton="rows"] li')).toHaveLength(3)
    expect(screen.queryAllByRole('button', { pressed: false })).toHaveLength(0)
  })
})
