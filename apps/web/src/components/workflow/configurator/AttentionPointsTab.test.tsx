import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AttentionPointsTab } from './AttentionPointsTab'

const attentionPointsList = vi.fn()

vi.mock('../../../lib/sdk', () => ({
  sdk: {
    attentionPoints: { list: (...args: unknown[]) => attentionPointsList(...args) },
  },
}))

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('AttentionPointsTab', () => {
  it('renders attention points sorted critical → warning → info, with severity dot tokens (bad/warn/info)', async () => {
    attentionPointsList.mockResolvedValue({
      data: [
        { id: 'a1', entityType: 'tool', entityId: 't1', severity: 'info', message: 'Stato OK', createdAt: '2026-05-01' },
        { id: 'a2', entityType: 'device', entityId: 'd1', severity: 'critical', message: 'Manutenzione urgente', createdAt: '2026-05-01' },
        { id: 'a3', entityType: 'recipe', entityId: 'r1', severity: 'warning', message: 'Verifica parametri', createdAt: '2026-05-01' },
      ],
      total: 3,
      page: 1,
      limit: 200,
      totalPages: 1,
    })

    renderWithQuery(
      <AttentionPointsTab
        selectedIds={[]}
        onToggle={() => {}}
        onClear={() => {}}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('Manutenzione urgente')).toBeInTheDocument()
    })

    // Severity dots use design tokens (bg-bad, bg-warn, bg-info), not hardcoded
    // tailwind palette colors.
    const dots = document.querySelectorAll('[data-severity]')
    expect(dots).toHaveLength(3)
    // Sort order: critical (bg-bad) first, then warning (bg-warn), then info (bg-info).
    expect(dots[0]?.getAttribute('data-severity')).toBe('critical')
    expect(dots[0]?.className).toMatch(/bg-bad\b/)
    expect(dots[1]?.getAttribute('data-severity')).toBe('warning')
    expect(dots[1]?.className).toMatch(/bg-warn\b/)
    expect(dots[2]?.getAttribute('data-severity')).toBe('info')
    expect(dots[2]?.className).toMatch(/bg-info\b/)
  })
})
