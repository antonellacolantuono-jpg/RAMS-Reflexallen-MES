import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageUpload } from './image-upload'

const tinyPngDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII='

function makeFile(name: string, type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type })
  return new File([blob], name, { type })
}

describe('ImageUpload', () => {
  it('renders empty drop area with default label', () => {
    render(<ImageUpload value={null} onChange={() => {}} />)
    expect(screen.getByTestId('image-upload-drop-area')).toBeInTheDocument()
    expect(screen.queryByTestId('image-upload-preview')).not.toBeInTheDocument()
    expect(screen.getByText('Immagine')).toBeInTheDocument()
  })

  it('accepts a valid image file and emits a data-URL via onChange', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ImageUpload value={null} onChange={onChange} />)
    const input = screen.getByTestId('image-upload-input') as HTMLInputElement
    const file = makeFile('a.png', 'image/png', 32)
    await user.upload(input, file)
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    const arg = onChange.mock.calls[0]?.[0] as string
    expect(typeof arg).toBe('string')
    expect(arg.startsWith('data:image/')).toBe(true)
  })

  it('rejects a non-image MIME and surfaces an error, no onChange', async () => {
    // userEvent.upload respects the `accept` attribute and never fires change;
    // use fireEvent to exercise the JS validator directly.
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} />)
    const input = screen.getByTestId('image-upload-input') as HTMLInputElement
    const file = makeFile('bad.txt', 'text/plain', 8)
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => {
      expect(screen.getByTestId('image-upload-error')).toBeInTheDocument()
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rejects a file exceeding maxSizeKB and surfaces an error', async () => {
    const onChange = vi.fn()
    render(<ImageUpload value={null} onChange={onChange} maxSizeKB={1} />)
    const input = screen.getByTestId('image-upload-input') as HTMLInputElement
    const file = makeFile('big.png', 'image/png', 4096)
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => {
      expect(screen.getByTestId('image-upload-error').textContent).toMatch(/troppo grande/i)
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders preview when value is set, and remove button clears value to null', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ImageUpload value={tinyPngDataUrl} onChange={onChange} />)
    expect(screen.getByTestId('image-upload-preview')).toBeInTheDocument()
    const remove = screen.getByTestId('image-upload-remove')
    await user.click(remove)
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
