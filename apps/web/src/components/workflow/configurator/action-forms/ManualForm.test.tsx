import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ManualForm } from './ManualForm'
import { defaultManual } from '../../../../lib/step-validation-schemas'

describe('ManualForm', () => {
  it('renders the required fields (instructions textarea + standard duration + max duration + IT/EN labels + Required toggle)', () => {
    const onChange = vi.fn()
    render(<ManualForm value={defaultManual} onChange={onChange} />)

    // Form is identifiable.
    expect(document.querySelector('[data-action-form="manual"]')).not.toBeNull()

    // Required textarea for instructions.
    const instructions = screen.getByPlaceholderText('Indicare istruzioni passo-passo')
    expect(instructions).toBeInTheDocument()
    expect(instructions.tagName).toBe('TEXTAREA')

    // Standard + max duration inputs (number).
    expect(screen.getByPlaceholderText('es. 45')).toHaveAttribute('type', 'number')
    expect(screen.getByPlaceholderText('es. 90')).toHaveAttribute('type', 'number')

    // IT + EN label inputs.
    expect(screen.getByPlaceholderText('(default: Nome)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('(opzionale)')).toBeInTheDocument()

    // Required toggle (default checked = true).
    const required = screen.getByRole('checkbox')
    expect(required).toBeChecked()
  })
})
