import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { HMIBigBtn } from './HMIBigBtn'

describe('HMIBigBtn', () => {
  describe('variants', () => {
    it('renders default variant (paper bg + line border)', () => {
      render(<HMIBigBtn>Annulla</HMIBigBtn>)
      const btn = screen.getByRole('button', { name: 'Annulla' })
      expect(btn.className).toContain('bg-paper')
      expect(btn.className).toContain('border-line')
      expect(btn.className).toContain('text-ink')
    })

    it('renders primary variant with amber bg + ink text', () => {
      render(<HMIBigBtn variant="primary">Sign in</HMIBigBtn>)
      const btn = screen.getByRole('button', { name: 'Sign in' })
      expect(btn.className).toContain('bg-amber-500')
      expect(btn.className).toContain('text-ink')
      expect(btn.className).toContain('shadow-md')
    })

    it('renders success variant with ok bg + paper text', () => {
      render(<HMIBigBtn variant="success">Confirm</HMIBigBtn>)
      const btn = screen.getByRole('button', { name: 'Confirm' })
      expect(btn.className).toContain('bg-ok')
      expect(btn.className).toContain('text-paper')
    })

    it('renders danger variant with bad bg + paper text', () => {
      render(<HMIBigBtn variant="danger">Mark Scrap</HMIBigBtn>)
      const btn = screen.getByRole('button', { name: 'Mark Scrap' })
      expect(btn.className).toContain('bg-bad')
      expect(btn.className).toContain('text-paper')
    })
  })

  describe('sizes', () => {
    it('renders default size (h-12) meeting touch-target floor', () => {
      render(<HMIBigBtn>Default</HMIBigBtn>)
      const btn = screen.getByRole('button', { name: 'Default' })
      expect(btn.className).toContain('h-12')
      expect(btn.className).toContain('px-5')
      expect(btn.className).toContain('rounded-2')
    })

    it('renders big size (h-16) for primary footer CTAs', () => {
      render(<HMIBigBtn size="big">Confirm OK · Next →</HMIBigBtn>)
      const btn = screen.getByRole('button', { name: 'Confirm OK · Next →' })
      expect(btn.className).toContain('h-16')
      expect(btn.className).toContain('px-6')
      expect(btn.className).toContain('rounded-3')
    })
  })

  describe('behavior', () => {
    it('renders icon before children', () => {
      render(
        <HMIBigBtn icon={<span data-testid="icon">i</span>}>label</HMIBigBtn>,
      )
      const btn = screen.getByRole('button', { name: /label/ })
      const icon = screen.getByTestId('icon')
      expect(btn).toContainElement(icon)
      // Icon should come before text node
      const children = Array.from(btn.childNodes)
      const iconIdx = children.findIndex((n) => n === icon)
      const textIdx = children.findIndex(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.includes('label'),
      )
      expect(iconIdx).toBeGreaterThanOrEqual(0)
      expect(textIdx).toBeGreaterThan(iconIdx)
    })

    it('forwards click handler', () => {
      const onClick = vi.fn()
      render(<HMIBigBtn onClick={onClick}>Click</HMIBigBtn>)
      fireEvent.click(screen.getByRole('button', { name: 'Click' }))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('respects disabled prop', () => {
      render(<HMIBigBtn disabled>Disabled</HMIBigBtn>)
      expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
    })

    it('forwards custom className', () => {
      render(<HMIBigBtn className="w-full">Wide</HMIBigBtn>)
      expect(screen.getByRole('button', { name: 'Wide' }).className).toContain(
        'w-full',
      )
    })
  })
})
