import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HMIScrapForm, derivePhaseFromStep } from './HMIScrapForm'
import type { WorkOrderStep } from '../lib/queries'

function makeStep(overrides: Partial<WorkOrderStep> = {}): WorkOrderStep {
  return {
    stepExecutionId: 'se-1',
    workOrderId: 'wo-1',
    stepId: 'step-1',
    status: 'blocked',
    result: null,
    durationSec: null,
    startedAt: null,
    completedAt: null,
    stepName: 'Run leak test cycle',
    stepCategory: 'production',
    stepOrder: 3,
    actionType: 'device_run',
    instructions: null,
    deviceCategory: 'device_main',
    deviceSerialNumber: 'DEV-LEAK-001',
    groupId: 'g-leak',
    groupName: 'Leak test',
    groupCategory: 'device_execution',
    groupSupportsParallel: true,
    recoveryStage: null,
    attemptCount: 0,
    ...overrides,
  }
}

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('derivePhaseFromStep', () => {
  it('maps DEV-LEAK-001 → leak and DEV-CAMERA-001 → camera', () => {
    expect(derivePhaseFromStep(makeStep({ deviceSerialNumber: 'DEV-LEAK-001' }))).toBe(
      'leak',
    )
    expect(
      derivePhaseFromStep(makeStep({ deviceSerialNumber: 'DEV-CAMERA-001' })),
    ).toBe('camera')
    expect(derivePhaseFromStep(makeStep({ deviceSerialNumber: null }))).toBeNull()
    expect(derivePhaseFromStep(null)).toBeNull()
  })
})

describe('HMIScrapForm', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'cc-1',
                code: 'LK-HOSE-LOOSE',
                description: 'Raccordo allentato',
                category: 'recovery_fault',
                phase: 'leak',
              },
              {
                id: 'cc-2',
                code: 'CM-LIGHTING',
                description: 'Illuminazione insufficiente',
                category: 'recovery_fault',
                phase: 'camera',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('filters cause codes to leak phase and disables Conferma until cause+photo are set', async () => {
    const onConfirm = vi.fn()
    renderWithClient(
      <HMIScrapForm
        open
        step={makeStep()}
        phase="leak"
        onClose={() => {}}
        onConfirm={onConfirm}
      />,
    )

    // Wait for the cause code list to load and verify leak option is present
    // while camera-only option is filtered out by code prefix.
    await waitFor(() => {
      const select = screen.getByTestId(
        'hmi-scrap-cause-code',
      ) as HTMLSelectElement
      const optionTexts = Array.from(select.options).map((o) => o.text)
      expect(optionTexts.some((t) => t.includes('LK-HOSE-LOOSE'))).toBe(true)
      expect(optionTexts.some((t) => t.includes('CM-LIGHTING'))).toBe(false)
    })

    const confirm = screen.getByTestId('hmi-scrap-confirm')
    expect(confirm).toBeDisabled()

    // Selecting a cause is not enough — photo is also required.
    const select = screen.getByTestId(
      'hmi-scrap-cause-code',
    ) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'cc-1' } })
    expect(confirm).toBeDisabled()

    // Onclick the confirm callback should not have fired yet.
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('confirms with the assembled payload once cause + photo are set', async () => {
    const onConfirm = vi.fn()
    renderWithClient(
      <HMIScrapForm
        open
        step={makeStep()}
        phase="leak"
        onClose={() => {}}
        onConfirm={onConfirm}
      />,
    )

    // Wait for the cause-code options to actually populate (the fetch is
    // async). Picking a value before the option exists silently no-ops.
    const select = await waitFor(() => {
      const s = screen.getByTestId('hmi-scrap-cause-code') as HTMLSelectElement
      const hasOption = Array.from(s.options).some((o) => o.value === 'cc-1')
      if (!hasOption) throw new Error('options not loaded yet')
      return s
    })
    fireEvent.change(select, { target: { value: 'cc-1' } })

    // Trigger the photo upload (FileReader is async — wait for the value
    // to land via the confirm button enabling).
    const input = screen.getByTestId(
      'hmi-photo-upload-input',
    ) as HTMLInputElement
    const file = new File(['fake'], 'defect.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    const confirm = screen.getByTestId('hmi-scrap-confirm') as HTMLButtonElement
    await waitFor(() => expect(confirm).not.toBeDisabled(), { timeout: 2000 })
    fireEvent.click(confirm)

    expect(onConfirm).toHaveBeenCalledTimes(1)
    const arg = onConfirm.mock.calls[0]![0]
    expect(arg.causeCode).toBe('LK-HOSE-LOOSE')
    expect(arg.photoBase64).toMatch(/^data:image\/png;base64,/)
    expect(arg.notes).toBeNull()
  })
})
