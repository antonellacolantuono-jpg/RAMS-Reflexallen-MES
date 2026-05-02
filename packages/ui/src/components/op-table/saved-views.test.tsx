import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SavedViews, type SavedView } from './saved-views'

const VIEWS: SavedView[] = [
  { id: 'all', label: 'Tutti', count: 142 },
  { id: 'risk', label: 'A rischio', count: 3, dot: 'warn' },
]

describe('SavedViews', () => {
  it('renders one tab per view with label and count', () => {
    render(<SavedViews views={VIEWS} value="all" onChange={() => undefined} />)
    expect(screen.getByRole('tab', { name: /Tutti/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /A rischio/ })).toBeInTheDocument()
    expect(screen.getByText('142')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('marks the active view via aria-selected', () => {
    render(<SavedViews views={VIEWS} value="risk" onChange={() => undefined} />)
    expect(screen.getByRole('tab', { name: /A rischio/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Tutti/ })).toHaveAttribute('aria-selected', 'false')
  })

  it('fires onChange with the clicked view id', () => {
    const onChange = vi.fn()
    render(<SavedViews views={VIEWS} value="all" onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /A rischio/ }))
    expect(onChange).toHaveBeenCalledWith('risk')
  })
})
