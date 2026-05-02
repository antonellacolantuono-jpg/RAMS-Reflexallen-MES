import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ParallelForm } from './ParallelForm'
import {
  defaultParallel,
  validateParallelDuration,
} from '../../../../lib/step-validation-schemas'

describe('ParallelForm', () => {
  it('rejects durationDuringDeviceCycle larger than parent.cycleTime − parent.parallelStepsBufferSec', async () => {
    // Parent step: 60s cycle, 5s buffer → max parallel duration = 55s.
    const parentCandidates = [
      {
        id: 'p1',
        label: 'Estrusione M12 (60s)',
        cycleTimeSec: 60,
        parallelStepsBufferSec: 5,
      },
    ]

    // Pure helper: 60 > 55 → error with explanatory message.
    expect(validateParallelDuration(60, parentCandidates[0]!)).toMatch(
      /Durata massima 55s/,
    )
    // 55 is exactly the limit (allowed).
    expect(validateParallelDuration(55, parentCandidates[0]!)).toBeNull()

    // Component renders the constraint error live as the operator types over
    // the limit (60 with parent cycle 60 + buffer 5).
    render(
      <ParallelForm
        value={{
          ...defaultParallel,
          parentStepId: 'p1',
          durationDuringDeviceCycleSec: 60,
          description: 'Verifica visiva mentre la macchina cicla',
        }}
        onChange={() => {}}
        parentCandidates={parentCandidates}
      />,
    )

    const durationInput = document.querySelector(
      '[data-parallel-duration-input]',
    ) as HTMLInputElement | null
    expect(durationInput).not.toBeNull()

    // Live constraint message rendered next to the duration field.
    await waitFor(() => {
      expect(
        screen.getByText(/Durata massima 55s.*ciclo padre 60s.*buffer 5s/),
      ).toBeInTheDocument()
    })
    expect(durationInput!.getAttribute('aria-invalid')).toBe('true')

    // Reduce the duration to a valid 50 → constraint message disappears.
    fireEvent.change(durationInput!, { target: { value: '50' } })
    await waitFor(() => {
      expect(screen.queryByText(/Durata massima 55s/)).toBeNull()
    })
  })
})
