import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DecisionForm } from './DecisionForm'
import { defaultDecision } from '../../../../lib/step-validation-schemas'

describe('DecisionForm', () => {
  it('surfaces required-field validation on branchLabel when blurred empty', async () => {
    render(
      <DecisionForm
        value={defaultDecision}
        onChange={() => {}}
        targetCandidates={[
          { id: 's1', label: 'Step 1' },
          { id: 's2', label: 'Step 2' },
        ]}
      />,
    )

    const branchInput = document.querySelector(
      '[data-decision-branch-label]',
    ) as HTMLInputElement | null
    expect(branchInput).not.toBeNull()

    // Trigger onChange validation: type a value then clear it. The cleared
    // state must surface the "Etichetta ramo obbligatoria" zod message.
    fireEvent.change(branchInput!, { target: { value: 'PASS' } })
    fireEvent.change(branchInput!, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.getByText('Etichetta ramo obbligatoria')).toBeInTheDocument()
    })
  })
})
