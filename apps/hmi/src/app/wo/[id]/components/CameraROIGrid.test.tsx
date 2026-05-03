import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CameraROIGrid } from './CameraROIGrid'

describe('CameraROIGrid', () => {
  it('renders 4 cells with PASS chips when all similarities clear the threshold', () => {
    render(
      <CameraROIGrid
        rois={[
          { roiId: 'raccordo_a', similarityPct: 97 },
          { roiId: 'raccordo_b', similarityPct: 96 },
          { roiId: 'label_position', similarityPct: 95 },
          { roiId: 'tape_position', similarityPct: 99 },
        ]}
      />,
    )
    const grid = screen.getByTestId('camera-roi-grid')
    expect(grid.getAttribute('data-roi-count')).toBe('4')
    expect(screen.getByText('Raccordo A')).toBeInTheDocument()
    expect(screen.getByText('Raccordo B')).toBeInTheDocument()
    expect(screen.getByText('Posizione etichetta')).toBeInTheDocument()
    expect(screen.getByText('Posizione nastro')).toBeInTheDocument()

    for (let i = 0; i < 4; i++) {
      const cell = screen.getByTestId(`camera-roi-cell-${i}`)
      expect(cell.getAttribute('data-roi-pass')).toBe('true')
    }
    expect(screen.getAllByText('PASS')).toHaveLength(4)
  })

  it('marks cells below threshold with FAIL chip + bad tone', () => {
    render(
      <CameraROIGrid
        rois={[
          { roiId: 'raccordo_a', similarityPct: 97 },
          { roiId: 'raccordo_b', similarityPct: 82 }, // FAIL
          { roiId: 'label_position', similarityPct: 96 },
          { roiId: 'tape_position', similarityPct: 95 },
        ]}
      />,
    )
    expect(
      screen.getByTestId('camera-roi-cell-1').getAttribute('data-roi-pass'),
    ).toBe('false')
    expect(screen.getByText('FAIL')).toBeInTheDocument()
  })

  it('pads to 4 cells with pending state when fewer ROIs are provided', () => {
    render(<CameraROIGrid rois={[{ roiId: 'raccordo_a', similarityPct: 95 }]} />)
    expect(
      screen.getByTestId('camera-roi-grid').getAttribute('data-roi-count'),
    ).toBe('4')
    // Cell index 0 has data; 1..3 are pending.
    expect(
      screen.getByTestId('camera-roi-cell-0').getAttribute('data-roi-pass'),
    ).toBe('true')
    for (let i = 1; i < 4; i++) {
      expect(
        screen.getByTestId(`camera-roi-cell-${i}`).getAttribute('data-roi-pass'),
      ).toBe('pending')
    }
  })
})
