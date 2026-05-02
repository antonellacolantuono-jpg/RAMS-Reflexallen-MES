import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkflowPalette } from './WorkflowPalette'

describe('WorkflowPalette', () => {
  it('renders 7 step categories and 5 step kinds, all draggable, no gating', () => {
    const { container } = render(<WorkflowPalette />)

    expect(screen.getByText('Step Categories')).toBeInTheDocument()
    expect(screen.getByText('Step Kinds')).toBeInTheDocument()

    const categoryItems = container.querySelectorAll(
      '[data-palette-source="category"]',
    )
    const kindItems = container.querySelectorAll(
      '[data-palette-source="kind"]',
    )

    expect(categoryItems).toHaveLength(7)
    expect(kindItems).toHaveLength(5)

    for (const el of categoryItems) {
      expect(el.getAttribute('draggable')).toBe('true')
    }
    for (const el of kindItems) {
      expect(el.getAttribute('draggable')).toBe('true')
    }

    expect(screen.getByText('Identificazione')).toBeInTheDocument()
    expect(screen.getByText('Manuale')).toBeInTheDocument()
    expect(screen.getByText('Sotto-flusso')).toBeInTheDocument()
  })
})
