import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ViewSwitcher, type ViewMode } from './view-switcher'

const ALL_VIEWS: ViewMode[] = ['list', 'card', 'flow', 'gantt', 'calendar']

describe('ViewSwitcher', () => {
  it('renders one button per requested view', () => {
    render(<ViewSwitcher value="list" onChange={() => undefined} views={ALL_VIEWS} />)
    expect(screen.getAllByRole('button')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Lista' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Schede' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Flusso' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gantt' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calendario' })).toBeInTheDocument()
  })

  it('marks the active view via aria-pressed', () => {
    render(<ViewSwitcher value="card" onChange={() => undefined} views={ALL_VIEWS} />)
    expect(screen.getByRole('button', { name: 'Schede' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Lista' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange when a different view is clicked', () => {
    const onChange = vi.fn()
    render(<ViewSwitcher value="list" onChange={onChange} views={ALL_VIEWS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Calendario' }))
    expect(onChange).toHaveBeenCalledWith('calendar')
  })
})
