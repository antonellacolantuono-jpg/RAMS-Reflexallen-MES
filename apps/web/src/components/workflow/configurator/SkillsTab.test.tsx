import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SkillsTab } from './SkillsTab'

const skillsList = vi.fn()

vi.mock('../../../lib/sdk', () => ({
  sdk: {
    skills: { list: (...args: unknown[]) => skillsList(...args) },
  },
}))

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('SkillsTab', () => {
  it('renders fetched skills and toggles selection on row click', async () => {
    skillsList.mockResolvedValue({
      data: [
        { id: 's1', code: 'QC', name: 'Quality Control', category: 'quality', plantId: 'p1' },
        { id: 's2', code: 'MGR', name: 'Plant Manager', category: 'leadership', plantId: 'p1' },
      ],
      total: 2,
      page: 1,
      limit: 200,
      totalPages: 1,
    })

    const onToggle = vi.fn()
    renderWithQuery(
      <SkillsTab selectedIds={[]} onToggle={onToggle} onClear={() => {}} />,
    )

    await waitFor(() => {
      expect(screen.getByText('Quality Control')).toBeInTheDocument()
    })

    const rows = screen.getAllByRole('button', { pressed: false })
    // 2 skill rows + 1 Pulisci button (disabled but still a button).
    expect(rows.length).toBeGreaterThanOrEqual(2)
    const qcRow = rows.find((r) => r.textContent?.includes('QC'))
    expect(qcRow).toBeDefined()
    fireEvent.click(qcRow!)
    expect(onToggle).toHaveBeenCalledWith('s1')
  })
})
