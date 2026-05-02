import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { SortIcon } from './sort-icon'

describe('SortIcon', () => {
  it('renders without idx label when idx is null or undefined', () => {
    const { container } = render(<SortIcon dir="asc" idx={null} />)
    const span = container.querySelector('.font-mono')
    expect(span).toBeNull()
  })

  it('renders the idx label when idx > 0', () => {
    const { container } = render(<SortIcon dir="asc" idx={2} />)
    const label = container.querySelector('.font-mono')
    expect(label).not.toBeNull()
    expect(label?.textContent).toBe('2')
  })
})
