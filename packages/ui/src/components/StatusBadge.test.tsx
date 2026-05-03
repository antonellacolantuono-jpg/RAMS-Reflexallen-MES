import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  describe('status enum API (mockup-faithful)', () => {
    it('maps in_progress to accent tone with "In Progress" label', () => {
      const { container } = render(<StatusBadge status="in_progress" />)
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-accent-soft/)
      expect(badge?.className).toMatch(/text-accent-ink/)
    })

    it('maps on_hold to warn tone with "On Hold" label', () => {
      const { container } = render(<StatusBadge status="on_hold" />)
      expect(screen.getByText('On Hold')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-warn-soft/)
    })

    it('maps completed to ok tone with "Completed" label', () => {
      const { container } = render(<StatusBadge status="completed" />)
      expect(screen.getByText('Completed')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-ok-soft/)
    })

    it('maps cancelled to bad tone with "Cancelled" label', () => {
      const { container } = render(<StatusBadge status="cancelled" />)
      expect(screen.getByText('Cancelled')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-bad-soft/)
    })

    it('maps draft to neutral tone with "Draft" label', () => {
      const { container } = render(<StatusBadge status="draft" />)
      expect(screen.getByText('Draft')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-neutral-100/)
    })

    it('maps available to ok tone (equipment lifecycle)', () => {
      const { container } = render(<StatusBadge status="available" />)
      expect(screen.getByText('Available')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-ok-soft/)
    })

    it('maps quarantine to warn tone (lot quality)', () => {
      const { container } = render(<StatusBadge status="quarantine" />)
      expect(screen.getByText('Quarantine')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-warn-soft/)
    })
  })

  describe('children override status label', () => {
    it('uses children text in place of mapped label', () => {
      render(<StatusBadge status="in_progress">In corso</StatusBadge>)
      expect(screen.getByText('In corso')).toBeInTheDocument()
      expect(screen.queryByText('In Progress')).not.toBeInTheDocument()
    })

    it('uses label prop in place of mapped label when children absent', () => {
      render(<StatusBadge status="in_progress" label="In corso" />)
      expect(screen.getByText('In corso')).toBeInTheDocument()
    })
  })

  describe('tone+label backward-compat API', () => {
    it('renders with tone + children (existing API)', () => {
      const { container } = render(<StatusBadge tone="ok">Tutto ok</StatusBadge>)
      expect(screen.getByText('Tutto ok')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-ok-soft/)
    })

    it('renders with tone + label (existing API)', () => {
      const { container } = render(<StatusBadge tone="bad" label="Errore" />)
      expect(screen.getByText('Errore')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-bad-soft/)
    })

    it('treats status="ok" as a tone shortcut (not in enum map) with label fallback', () => {
      const { container } = render(<StatusBadge status="ok" label="Tutto bene" />)
      expect(screen.getByText('Tutto bene')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-ok-soft/)
    })

    it('falls back to neutral when no status/tone provided', () => {
      const { container } = render(<StatusBadge label="Sconosciuto" />)
      expect(screen.getByText('Sconosciuto')).toBeInTheDocument()
      const badge = container.querySelector('span')
      expect(badge?.className).toMatch(/bg-neutral-100/)
    })
  })

  describe('precedence: status enum wins over tone', () => {
    it('uses status map tone even when tone prop is also provided', () => {
      const { container } = render(<StatusBadge status="in_progress" tone="bad" />)
      const badge = container.querySelector('span')
      // status="in_progress" → tone=accent (not bad)
      expect(badge?.className).toMatch(/bg-accent-soft/)
      expect(badge?.className).not.toMatch(/bg-bad-soft/)
    })

    it('uses status map label even when label prop absent', () => {
      render(<StatusBadge status="completed" />)
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })
  })

  describe('visual contract (dot + text per § 2)', () => {
    it('always renders a status dot alongside the label', () => {
      const { container } = render(<StatusBadge status="in_progress" />)
      const badge = container.querySelector('span')
      const dot = badge?.querySelector('span')
      expect(dot).not.toBeNull()
      expect(dot?.className).toMatch(/rounded-full/)
      expect(dot?.className).toMatch(/h-1\.5/)
      expect(dot?.className).toMatch(/w-1\.5/)
    })

    it('dot color tracks resolved tone (accent for in_progress)', () => {
      const { container } = render(<StatusBadge status="in_progress" />)
      const dot = container.querySelector('span > span')
      expect(dot?.className).toMatch(/bg-accent/)
    })
  })
})
