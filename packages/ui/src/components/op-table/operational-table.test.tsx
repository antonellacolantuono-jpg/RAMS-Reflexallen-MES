import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OperationalTable, type OpTableColumn } from './operational-table'

interface Row {
  id: string
  code: string
  name: string
  qty: number
}

const ROWS: Row[] = [
  { id: '1', code: 'WO-001', name: 'Brake', qty: 100 },
  { id: '2', code: 'WO-002', name: 'Caliper', qty: 50 },
  { id: '3', code: 'WO-003', name: 'Master', qty: 75 },
]

const COLUMNS: OpTableColumn<Row>[] = [
  { id: 'code', label: 'Codice', sortable: true, width: 120 },
  { id: 'name', label: 'Nome', sortable: true },
  { id: 'qty', label: 'Quantità', num: true, sortable: true },
]

describe('OperationalTable', () => {
  it('renders rows and columns', () => {
    render(<OperationalTable<Row> rows={ROWS} columns={COLUMNS} />)
    expect(screen.getByText('WO-001')).toBeInTheDocument()
    expect(screen.getByText('Caliper')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Codice')).toBeInTheDocument()
  })

  it('shows empty state when rows is empty', () => {
    render(
      <OperationalTable<Row>
        rows={[]}
        columns={COLUMNS}
        emptyMessage="Nessun ordine"
      />,
    )
    expect(screen.getByText('Nessun ordine')).toBeInTheDocument()
  })

  it('select-all checkbox toggles all rows', () => {
    const onSelectionChange = vi.fn()
    render(
      <OperationalTable<Row>
        rows={ROWS}
        columns={COLUMNS}
        selection={new Set()}
        onSelectionChange={onSelectionChange}
      />,
    )
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]!)
    expect(onSelectionChange).toHaveBeenCalledTimes(1)
    const callArg = onSelectionChange.mock.calls[0]![0] as Set<string>
    expect(callArg.size).toBe(3)
    expect(callArg.has('1')).toBe(true)
  })

  it('header click on a sortable column calls onSort with toggled direction', () => {
    const onSort = vi.fn()
    const { rerender } = render(
      <OperationalTable<Row>
        rows={ROWS}
        columns={COLUMNS}
        onSort={onSort}
      />,
    )
    fireEvent.click(screen.getByText('Codice'))
    expect(onSort).toHaveBeenLastCalledWith('code', 'asc')

    rerender(
      <OperationalTable<Row>
        rows={ROWS}
        columns={COLUMNS}
        sortBy="code"
        sortDir="asc"
        onSort={onSort}
      />,
    )
    fireEvent.click(screen.getByText('Codice'))
    expect(onSort).toHaveBeenLastCalledWith('code', 'desc')
  })

  it('shows the BulkBar with action when selection > 0 and bulkActions provided', () => {
    const onDelete = vi.fn()
    render(
      <OperationalTable<Row>
        rows={ROWS}
        columns={COLUMNS}
        selection={new Set(['1', '2'])}
        onSelectionChange={() => undefined}
        bulkActions={[{ id: 'del', label: 'Elimina', tone: 'bad', onClick: onDelete }]}
      />,
    )
    expect(screen.getByText(/selezionati/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('renders saved views and emits onViewChange', () => {
    const onViewChange = vi.fn()
    render(
      <OperationalTable<Row>
        rows={ROWS}
        columns={COLUMNS}
        views={[
          { id: 'all', label: 'Tutti', count: 3 },
          { id: 'risk', label: 'A rischio', count: 1, dot: 'warn' },
        ]}
        activeView="all"
        onViewChange={onViewChange}
      />,
    )
    fireEvent.click(screen.getByRole('tab', { name: /A rischio/ }))
    expect(onViewChange).toHaveBeenCalledWith('risk')
  })

  it('filter chip removal calls onFilterRemove with index', () => {
    const onFilterRemove = vi.fn()
    render(
      <OperationalTable<Row>
        rows={ROWS}
        columns={COLUMNS}
        search=""
        onSearchChange={() => undefined}
        filters={[
          { field: 'Status', op: 'is', value: 'released' },
          { field: 'Type', op: 'is', value: 'fg' },
        ]}
        onFilterRemove={onFilterRemove}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Rimuovi filtro Type' }))
    expect(onFilterRemove).toHaveBeenCalledWith(1)
  })
})
