import { describe, expect, it, beforeEach, vi } from 'vitest'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useRegistryView } from './use-registry-view'

describe('useRegistryView', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('throws when availableViews is empty', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      renderHook(() => useRegistryView({ registryId: 'r', availableViews: [] })),
    ).toThrow(/availableViews must contain at least one view/)
    spy.mockRestore()
  })

  it('returns the first availableView as the default on initial render', () => {
    const { result } = renderHook(() =>
      useRegistryView({ registryId: 'items', availableViews: ['list', 'card'] }),
    )
    expect(result.current.view).toBe('list')
  })

  it('honors an explicit defaultView when it is included in availableViews', () => {
    const { result } = renderHook(() =>
      useRegistryView({
        registryId: 'items',
        availableViews: ['list', 'card', 'flow'],
        defaultView: 'card',
      }),
    )
    expect(result.current.view).toBe('card')
  })

  it('falls back to availableViews[0] when defaultView is not in availableViews', () => {
    const { result } = renderHook(() =>
      useRegistryView({
        registryId: 'items',
        availableViews: ['list', 'card'],
        defaultView: 'flow',
      }),
    )
    expect(result.current.view).toBe('list')
  })

  it('uses the rams.view.<registryId> storage key', async () => {
    const { result } = renderHook(() =>
      useRegistryView({ registryId: 'items', availableViews: ['list', 'card'] }),
    )
    act(() => result.current.setView('card'))
    expect(window.localStorage.getItem('rams.view.items')).toBe('card')
  })

  it('hydrates view from localStorage when a stored value is present', async () => {
    window.localStorage.setItem('rams.view.items', 'card')
    const { result } = renderHook(() =>
      useRegistryView({ registryId: 'items', availableViews: ['list', 'card'] }),
    )
    await act(async () => {})
    expect(result.current.view).toBe('card')
  })

  it('ignores stored values not in availableViews', async () => {
    window.localStorage.setItem('rams.view.items', 'flow')
    const { result } = renderHook(() =>
      useRegistryView({ registryId: 'items', availableViews: ['list', 'card'] }),
    )
    await act(async () => {})
    expect(result.current.view).toBe('list')
  })

  it('namespaces storage by registryId so two registries do not collide', async () => {
    window.localStorage.setItem('rams.view.items', 'card')
    window.localStorage.setItem('rams.view.bom', 'list')

    const itemsHook = renderHook(() =>
      useRegistryView({ registryId: 'items', availableViews: ['list', 'card'] }),
    )
    const bomHook = renderHook(() =>
      useRegistryView({ registryId: 'bom', availableViews: ['list', 'card'] }),
    )
    await act(async () => {})

    expect(itemsHook.result.current.view).toBe('card')
    expect(bomHook.result.current.view).toBe('list')
  })

  it('fires onChange when setView is called', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useRegistryView({
        registryId: 'items',
        availableViews: ['list', 'card'],
        onChange,
      }),
    )
    act(() => result.current.setView('card'))
    expect(onChange).toHaveBeenCalledWith('card')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('returns a null switcher when only one view is available', () => {
    const { result } = renderHook(() =>
      useRegistryView({ registryId: 'minimal', availableViews: ['list'] }),
    )
    expect(result.current.switcher).toBeNull()
    expect(result.current.view).toBe('list')
  })

  it('switcher renders one button per available view and toggles state on click', async () => {
    function Harness() {
      const { view, switcher } = useRegistryView({
        registryId: 'recipes',
        availableViews: ['list', 'card'],
      })
      return (
        <div>
          {switcher}
          <span data-testid="current">{view}</span>
        </div>
      )
    }
    render(<Harness />)
    expect(screen.getByTestId('current').textContent).toBe('list')

    const cardButton = screen.getByRole('button', { name: 'Schede' })
    await act(async () => {
      fireEvent.click(cardButton)
    })
    expect(screen.getByTestId('current').textContent).toBe('card')
    expect(window.localStorage.getItem('rams.view.recipes')).toBe('card')
  })

  it('reads initial view from urlSync.read() with priority over localStorage', async () => {
    window.localStorage.setItem('rams.view.workflows', 'card')
    const read = vi.fn(() => 'list' as const)
    const write = vi.fn()
    const { result } = renderHook(() =>
      useRegistryView({
        registryId: 'workflows',
        availableViews: ['flow', 'list', 'card'],
        defaultView: 'flow',
        urlSync: { read, write },
      }),
    )
    await act(async () => {})
    expect(read).toHaveBeenCalledTimes(1)
    expect(result.current.view).toBe('list')
  })

  it('falls back to localStorage when urlSync.read() returns null and writes URL on setView', () => {
    window.localStorage.setItem('rams.view.workflows', 'card')
    const read = vi.fn(() => null)
    const write = vi.fn()
    const { result } = renderHook(() =>
      useRegistryView({
        registryId: 'workflows',
        availableViews: ['flow', 'list', 'card'],
        defaultView: 'flow',
        urlSync: { read, write },
      }),
    )
    expect(result.current.view).toBe('card')
    expect(write).not.toHaveBeenCalled()
    act(() => result.current.setView('flow'))
    expect(write).toHaveBeenCalledWith('flow')
    expect(window.localStorage.getItem('rams.view.workflows')).toBe('flow')
  })

  it('survives a localStorage write failure (private mode / quota) without throwing', () => {
    const setItem = window.localStorage.setItem
    window.localStorage.setItem = () => {
      throw new Error('QuotaExceeded')
    }
    const { result } = renderHook(() =>
      useRegistryView({ registryId: 'items', availableViews: ['list', 'card'] }),
    )
    expect(() => act(() => result.current.setView('card'))).not.toThrow()
    expect(result.current.view).toBe('card')
    window.localStorage.setItem = setItem
  })
})
