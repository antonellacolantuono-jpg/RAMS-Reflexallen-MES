import { describe, expect, it, vi } from 'vitest'
import { Factory } from 'lucide-react'
import { fireEvent, render, screen } from '@testing-library/react'
import { TreeNode } from './tree-node'

describe('TreeNode', () => {
  it('renders the label', () => {
    render(<TreeNode label="Stabilimento Bologna" />)
    expect(screen.getByText('Stabilimento Bologna')).toBeInTheDocument()
  })

  it('applies indent based on depth (16px per level)', () => {
    render(<TreeNode label="Magazzino" depth={2} />)
    const node = screen.getByRole('treeitem')
    expect(node.style.paddingLeft).toBe('40px') // 8 + 2*16
  })

  it('exposes aria-expanded only when hasChildren is true', () => {
    const { rerender } = render(<TreeNode label="A" hasChildren expanded />)
    expect(screen.getByRole('treeitem')).toHaveAttribute('aria-expanded', 'true')
    rerender(<TreeNode label="A" hasChildren expanded={false} />)
    expect(screen.getByRole('treeitem')).toHaveAttribute('aria-expanded', 'false')
    rerender(<TreeNode label="A" />)
    expect(screen.getByRole('treeitem')).not.toHaveAttribute('aria-expanded')
  })

  it('highlights matching substring with a <mark>', () => {
    render(<TreeNode label="Work Center Test Funzionale" match="Test" />)
    const mark = screen.getByText('Test', { selector: 'mark' })
    expect(mark).toBeInTheDocument()
    expect(mark.className).toMatch(/bg-warn-soft/)
  })

  it('applies selected styling and aria-selected', () => {
    render(<TreeNode label="Selected" selected />)
    const node = screen.getByRole('treeitem')
    expect(node).toHaveAttribute('aria-selected', 'true')
    expect(node.className).toMatch(/bg-accent-soft/)
  })

  it('calls onToggle when caret is clicked without firing onClick', () => {
    const onClick = vi.fn()
    const onToggle = vi.fn()
    const { container } = render(
      <TreeNode
        label="Folder"
        icon={Factory}
        hasChildren
        onClick={onClick}
        onToggle={onToggle}
      />,
    )
    const caret = container.querySelector('span[aria-hidden]') as HTMLElement
    fireEvent.click(caret)
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })
})
