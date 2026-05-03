import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PhotoUploadField } from './PhotoUploadField'

describe('PhotoUploadField', () => {
  it('renders the drop area when no value, switches to thumbnail on upload, and removes on click', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <PhotoUploadField value={null} onChange={onChange} />,
    )

    // 1. Drop area visible, no preview yet.
    expect(
      screen.getByTestId('photo-upload-field-drop-area'),
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId('photo-upload-field-preview'),
    ).not.toBeInTheDocument()

    // 2. Simulate file selection through the hidden <input type="file">.
    const file = new File(['fake-image-bytes'], 'sample.png', {
      type: 'image/png',
    })
    const input = screen.getByTestId(
      'photo-upload-field-input',
    ) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.stringMatching(/^data:image\/png;base64,/),
      )
    })

    // 3. Re-render with the data-URL value to simulate the parent committing it.
    const dataUrl = onChange.mock.calls[0]![0] as string
    rerender(<PhotoUploadField value={dataUrl} onChange={onChange} />)

    const preview = screen.getByTestId('photo-upload-field-preview')
    expect(preview).toBeInTheDocument()
    expect(preview.querySelector('img')?.getAttribute('src')).toBe(dataUrl)

    // 4. Remove button clears the value back to null.
    fireEvent.click(screen.getByTestId('photo-upload-field-remove'))
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('rejects non-image files with an inline error', async () => {
    const onChange = vi.fn()
    render(<PhotoUploadField value={null} onChange={onChange} />)
    const input = screen.getByTestId(
      'photo-upload-field-input',
    ) as HTMLInputElement
    const file = new File(['oops'], 'broken.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solo immagini supportate',
    )
    expect(onChange).not.toHaveBeenCalled()
  })
})
