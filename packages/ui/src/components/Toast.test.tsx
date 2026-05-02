import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act, render, screen } from '@testing-library/react'
import { ToastProvider, type ToastContextValue, useToast } from './Toast'

let captured: ToastContextValue | null = null

function Capture() {
  const value = useToast()
  React.useEffect(() => {
    captured = value
  }, [value])
  return null
}

beforeEach(() => {
  captured = null
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ToastProvider', () => {
  it('renders a pushed toast message', () => {
    render(
      <ToastProvider>
        <Capture />
      </ToastProvider>,
    )
    act(() => {
      captured!.show('Salvataggio riuscito', 'ok')
    })
    expect(screen.getByText('Salvataggio riuscito')).toBeInTheDocument()
  })

  it('auto-dismisses after the default duration', () => {
    render(
      <ToastProvider>
        <Capture />
      </ToastProvider>,
    )
    act(() => {
      captured!.show('In coda')
    })
    expect(screen.getByText('In coda')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.queryByText('In coda')).not.toBeInTheDocument()
  })

  it('keeps at most 3 visible toasts (oldest dropped)', () => {
    render(
      <ToastProvider>
        <Capture />
      </ToastProvider>,
    )
    act(() => {
      captured!.show('msg-1')
      captured!.show('msg-2')
      captured!.show('msg-3')
      captured!.show('msg-4')
    })
    expect(screen.queryByText('msg-1')).not.toBeInTheDocument()
    expect(screen.getByText('msg-2')).toBeInTheDocument()
    expect(screen.getByText('msg-3')).toBeInTheDocument()
    expect(screen.getByText('msg-4')).toBeInTheDocument()
  })

  it('dismisses a specific toast via dismiss(id)', () => {
    render(
      <ToastProvider>
        <Capture />
      </ToastProvider>,
    )
    let id = ''
    act(() => {
      id = captured!.show('da-rimuovere')
    })
    expect(screen.getByText('da-rimuovere')).toBeInTheDocument()
    act(() => {
      captured!.dismiss(id)
    })
    expect(screen.queryByText('da-rimuovere')).not.toBeInTheDocument()
  })
})
