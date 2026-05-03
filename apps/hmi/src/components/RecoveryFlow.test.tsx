import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecoveryFlow } from './RecoveryFlow'
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
    recoveryStage: 'diagnosis',
    attemptCount: 0,
    data: null,
    ...overrides,
  }
}

describe('RecoveryFlow — maxAttempts dynamic read (PROMPT_7 D4)', () => {
  it('falls back to MAX_RECOVERY_ATTEMPTS=2 when step.data is null', () => {
    render(
      <RecoveryFlow
        step={makeStep({ data: null })}
        onRecover={() => {}}
        onScrap={() => {}}
      />,
    )
    expect(screen.getByText(/Tentativi: 0 \/ 2/)).toBeDefined()
    expect(screen.getByText(/Diagnosi iniziale/)).toBeDefined()
  })

  it('reads maxAttempts=1 from step.data.recoveryConfig and renders counter', () => {
    render(
      <RecoveryFlow
        step={makeStep({
          data: {
            recoveryConfig: {
              enabled: true,
              maxAttempts: 1,
              preRetryStepIds: [],
            },
          },
        })}
        onRecover={() => {}}
        onScrap={() => {}}
      />,
    )
    expect(screen.getByText(/Tentativi: 0 \/ 1/)).toBeDefined()
  })

  it('clamps maxAttempts > 2 to MAX_RECOVERY_ATTEMPTS and warns (TODO-058)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <RecoveryFlow
        step={makeStep({
          data: {
            recoveryConfig: {
              enabled: true,
              maxAttempts: 5,
              preRetryStepIds: [],
            },
          },
        })}
        onRecover={() => {}}
        onScrap={() => {}}
      />,
    )
    expect(screen.getByText(/Tentativi: 0 \/ 2/)).toBeDefined()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        '[RecoveryFlow] step.data.recoveryConfig.maxAttempts=5',
      ),
    )
    warn.mockRestore()
  })
})

describe('RecoveryFlow — pre-retry display (PROMPT_7 D4)', () => {
  it('renders no pre-retry list when preRetryNames is undefined', () => {
    render(
      <RecoveryFlow
        step={makeStep()}
        onRecover={() => {}}
        onScrap={() => {}}
      />,
    )
    expect(screen.queryByTestId('pre-retry-list')).toBeNull()
  })

  it('renders no pre-retry list when preRetryNames is empty array', () => {
    render(
      <RecoveryFlow
        step={makeStep()}
        onRecover={() => {}}
        onScrap={() => {}}
        preRetryNames={[]}
      />,
    )
    expect(screen.queryByTestId('pre-retry-list')).toBeNull()
  })

  it('renders ordered list of pre-retry step names above the recover button', () => {
    render(
      <RecoveryFlow
        step={makeStep()}
        onRecover={() => {}}
        onScrap={() => {}}
        preRetryNames={[
          { id: 'rec-check-id', name: 'Verifica integrità tubo e sede' },
          { id: 'rec-clean-id', name: 'Pulisci sede e riconnetti tubi' },
        ]}
      />,
    )
    const list = screen.getByTestId('pre-retry-list')
    expect(list).toBeDefined()
    expect(list.textContent).toContain('Verifica integrità tubo e sede')
    expect(list.textContent).toContain('Pulisci sede e riconnetti tubi')
    expect(list.textContent).toContain('Prima del prossimo tentativo')
    // Verify ordered list renders 2 items with stable id refs.
    const items = list.querySelectorAll('li[data-pre-retry-step-id]')
    expect(items.length).toBe(2)
    expect(items[0]?.getAttribute('data-pre-retry-step-id')).toBe('rec-check-id')
    expect(items[1]?.getAttribute('data-pre-retry-step-id')).toBe('rec-clean-id')
  })

  it('hides pre-retry list once status === recovered (only shown when blocked)', () => {
    render(
      <RecoveryFlow
        step={makeStep({ status: 'recovered', recoveryStage: 'recovered' })}
        onRecover={() => {}}
        onScrap={() => {}}
        preRetryNames={[{ id: 'rec-check-id', name: 'Verifica' }]}
      />,
    )
    expect(screen.queryByTestId('pre-retry-list')).toBeNull()
  })
})
