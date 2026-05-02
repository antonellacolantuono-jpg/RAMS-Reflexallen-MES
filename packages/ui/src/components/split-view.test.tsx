import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, render, screen } from '@testing-library/react'
import { SplitView, useSplitViewSelection } from './split-view'

describe('SplitView', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    })
  })

  it('renders both tree and detail panes', () => {
    render(
      <SplitView
        tree={<div>tree-content</div>}
        detail={<div>detail-content</div>}
      />,
    )
    expect(screen.getByText('tree-content')).toBeInTheDocument()
    expect(screen.getByText('detail-content')).toBeInTheDocument()
  })

  it('clamps the initial tree width to the configured min/max', () => {
    render(
      <SplitView
        tree={<div>t</div>}
        detail={<div>d</div>}
        treeWidth={9999}
        maxTreeWidth={300}
        minTreeWidth={200}
      />,
    )
    const treePane = screen.getByTestId('split-view-tree')
    expect(treePane.style.width).toBe('300px')
  })

  it('switches to mobile fallback below the breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    })
    render(
      <SplitView
        tree={<div>tree-content</div>}
        detail={<div>detail-content</div>}
      />,
    )
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(screen.getByRole('button', { name: /Mostra dettaglio/ })).toBeInTheDocument()
  })
})

describe('useSplitViewSelection', () => {
  afterEach(() => {
    window.history.replaceState(null, '', window.location.pathname)
  })

  it('returns null when the hash does not match the key prefix', () => {
    window.history.replaceState(null, '', window.location.pathname)
    const { result } = renderHook(() => useSplitViewSelection('equipment'))
    expect(result.current[0]).toBe(null)
  })

  it('reads the selected id from the URL hash on mount', () => {
    window.location.hash = 'equipment-wc-assembly'
    const { result } = renderHook(() => useSplitViewSelection('equipment'))
    expect(result.current[0]).toBe('wc-assembly')
  })

  it('updates the URL hash via the setter', () => {
    window.history.replaceState(null, '', window.location.pathname)
    const { result } = renderHook(() => useSplitViewSelection('eq'))
    act(() => {
      result.current[1]('wc-test')
    })
    expect(result.current[0]).toBe('wc-test')
    expect(window.location.hash).toBe('#eq-wc-test')
  })
})
