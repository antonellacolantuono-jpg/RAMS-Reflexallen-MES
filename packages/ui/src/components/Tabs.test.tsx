import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Tabs, type Tab } from './Tabs'

describe('Tabs (PROMPT_DS_LIFT D5 extensions)', () => {
  it('legacy callsite without count/dot/kbd renders unchanged', () => {
    const tabs: Tab[] = [
      { id: 'a', label: 'Components' },
      { id: 'b', label: 'Colors' },
      { id: 'c', label: 'Typography' },
    ]
    render(<Tabs tabs={tabs} value="a" onChange={() => undefined} />)
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Components')
    // No mono count badge visible when count is absent
    expect(screen.queryByText(/^\d+$/, { selector: '.font-mono' })).not.toBeInTheDocument()
  })

  it('renders count badge when count is provided', () => {
    const tabs: Tab[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'progress', label: 'Progress', count: 240 },
    ]
    render(<Tabs tabs={tabs} value="overview" onChange={() => undefined} />)
    expect(screen.getByText('240')).toBeInTheDocument()
  })

  it('renders status dot when dot prop is provided', () => {
    const tabs: Tab[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'NCRs', count: 1, dot: 'warn' },
    ]
    const { container } = render(<Tabs tabs={tabs} value="a" onChange={() => undefined} />)
    expect(container.querySelector('.bg-warn')).not.toBeNull()
  })

  it('renders kbd hint when kbd prop is provided', () => {
    const tabs: Tab[] = [
      { id: 'open', label: 'Open', kbd: 'Ctrl+O' },
    ]
    render(<Tabs tabs={tabs} value="open" onChange={() => undefined} />)
    expect(screen.getByText('Ctrl+O')).toBeInTheDocument()
  })

  it('clicking a tab fires onChange with the tab id', () => {
    const onChange = vi.fn()
    const tabs: Tab[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', count: 3 },
    ]
    render(<Tabs tabs={tabs} value="a" onChange={onChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /B/ }))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
