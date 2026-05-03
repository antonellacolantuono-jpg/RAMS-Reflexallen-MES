import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  describe('variants', () => {
    it('renders primary variant by default (accent background)', () => {
      render(<Button>Salva</Button>)
      const btn = screen.getByRole('button', { name: 'Salva' })
      expect(btn.className).toContain('bg-accent')
      expect(btn.className).toContain('text-white')
    })

    it('renders default variant with paper bg + line border (mockup baseline)', () => {
      render(<Button variant="default">Annulla</Button>)
      const btn = screen.getByRole('button', { name: 'Annulla' })
      expect(btn.className).toContain('bg-paper')
      expect(btn.className).toContain('border-line')
      expect(btn.className).toContain('text-ink')
    })

    it('renders soft variant with paper-2 bg + line border', () => {
      render(<Button variant="soft">Filter</Button>)
      const btn = screen.getByRole('button', { name: 'Filter' })
      expect(btn.className).toContain('bg-paper-2')
      expect(btn.className).toContain('border-line')
    })

    it('renders ghost variant transparent', () => {
      render(<Button variant="ghost">More</Button>)
      const btn = screen.getByRole('button', { name: 'More' })
      expect(btn.className).toContain('bg-transparent')
    })

    it('renders danger variant with bad bg', () => {
      render(<Button variant="danger">Delete</Button>)
      const btn = screen.getByRole('button', { name: 'Delete' })
      expect(btn.className).toContain('bg-bad')
    })

    it('aliases secondary to default styling for backward compat (deprecated)', () => {
      render(<Button variant="secondary">Old</Button>)
      const btn = screen.getByRole('button', { name: 'Old' })
      expect(btn.className).toContain('bg-paper')
      expect(btn.className).toContain('border-line')
      expect(btn.className).toContain('text-ink')
    })
  })

  describe('sizes', () => {
    it('renders md size by default (h-8)', () => {
      render(<Button>Default size</Button>)
      const btn = screen.getByRole('button', { name: 'Default size' })
      expect(btn.className).toContain('h-8')
      expect(btn.className).toContain('px-3')
    })

    it('renders sm size with h-7 px-2', () => {
      render(<Button size="sm">Small</Button>)
      const btn = screen.getByRole('button', { name: 'Small' })
      expect(btn.className).toContain('h-7')
      expect(btn.className).toContain('px-2')
    })

    it('renders lg size with h-10 px-4', () => {
      render(<Button size="lg">Large</Button>)
      const btn = screen.getByRole('button', { name: 'Large' })
      expect(btn.className).toContain('h-10')
      expect(btn.className).toContain('px-4')
    })

    it('renders hmi size with h-14 + min-w-[56px] for touch targets', () => {
      render(<Button size="hmi">Touch</Button>)
      const btn = screen.getByRole('button', { name: 'Touch' })
      expect(btn.className).toContain('h-14')
      expect(btn.className).toContain('min-w-[56px]')
    })
  })

  describe('behavior', () => {
    it('renders icon and iconR when not loading', () => {
      render(
        <Button icon={<span data-testid="icon-l" />} iconR={<span data-testid="icon-r" />}>
          With icons
        </Button>,
      )
      expect(screen.getByTestId('icon-l')).toBeInTheDocument()
      expect(screen.getByTestId('icon-r')).toBeInTheDocument()
    })

    it('replaces icon with spinner when loading and disables button', () => {
      render(
        <Button loading icon={<span data-testid="icon-l" />}>
          Saving
        </Button>,
      )
      expect(screen.queryByTestId('icon-l')).not.toBeInTheDocument()
      const btn = screen.getByRole('button', { name: /Saving/ })
      expect(btn).toBeDisabled()
    })

    it('hides iconR while loading', () => {
      render(
        <Button loading iconR={<span data-testid="icon-r" />}>
          Saving
        </Button>,
      )
      expect(screen.queryByTestId('icon-r')).not.toBeInTheDocument()
    })

    it('forwards click handler', () => {
      const onClick = vi.fn()
      render(<Button onClick={onClick}>Click</Button>)
      fireEvent.click(screen.getByRole('button', { name: 'Click' }))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('respects explicit disabled prop independent of loading', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
    })
  })
})
