import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AuditTimeline, type AuditTimelineEntry } from './audit-timeline'

const SINGLE: AuditTimelineEntry[] = [
  {
    id: 'a1',
    at: new Date('2026-05-02T14:28:47'),
    actor: 'M. Conti',
    action: 'Piece #168 marked good',
    entity: 'WO-2026-0142',
    tone: 'ok',
  },
]

const WITH_DIFF: AuditTimelineEntry[] = [
  {
    id: 'd1',
    at: new Date('2026-05-02T11:02:09'),
    actor: 'L. Verdi',
    action: 'BOM revision applied',
    tone: 'warn',
    diff: [
      { field: 'bleeder_valve', before: '1.000', after: '1.005' },
      { field: 'overage_pct', before: '0', after: '0.5' },
    ],
  },
]

describe('AuditTimeline', () => {
  it('renders the empty message when no entries are provided', () => {
    render(<AuditTimeline entries={[]} emptyMessage="Vuoto" />)
    expect(screen.getByText('Vuoto')).toBeInTheDocument()
  })

  it('renders a single entry with actor, action and time', () => {
    render(<AuditTimeline entries={SINGLE} />)
    expect(screen.getByText('M. Conti')).toBeInTheDocument()
    expect(screen.getByText('Piece #168 marked good')).toBeInTheDocument()
    expect(screen.getByText('14:28:47')).toBeInTheDocument()
    expect(screen.getByText('WO-2026-0142')).toBeInTheDocument()
  })

  it('renders multiple entries as separate list items', () => {
    const entries: AuditTimelineEntry[] = [
      ...SINGLE,
      { id: 'a2', at: new Date('2026-05-02T13:00:00'), actor: 'system', action: 'Shift handover', tone: 'neutral' },
    ]
    render(<AuditTimeline entries={entries} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Shift handover')).toBeInTheDocument()
  })

  it('renders the diff toggle and expands to show diff lines with U+2192 arrow', () => {
    const { container } = render(<AuditTimeline entries={WITH_DIFF} />)
    // Diff is collapsed by default — diff lines are not visible.
    expect(screen.queryByText('1.000')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Mostra diff/ }))

    // After expansion, before/after values appear, and the literal Unicode arrow
    // U+2192 (→) is rendered between them — verify by character code, not by
    // searching for "->" or "&rarr;".
    expect(screen.getByText('1.000')).toBeInTheDocument()
    expect(screen.getByText('1.005')).toBeInTheDocument()
    const arrows = container.querySelectorAll('span.mx-1')
    expect(arrows.length).toBeGreaterThan(0)
    expect(arrows[0]!.textContent).toBe('→')
  })

  it('toggle button switches between Mostra/Nascondi labels and aria-expanded', () => {
    render(<AuditTimeline entries={WITH_DIFF} />)
    const button = screen.getByRole('button', { name: /Mostra diff/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /Nascondi diff/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})
