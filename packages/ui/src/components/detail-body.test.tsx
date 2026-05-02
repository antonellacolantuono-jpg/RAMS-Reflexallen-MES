import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DetailBody } from './detail-body'

describe('DetailBody', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    })
  })

  it('renders main and sidebar with default sidebar width', () => {
    render(
      <DetailBody
        main={<div>main-content</div>}
        sidebar={<div>sidebar-content</div>}
      />,
    )
    expect(screen.getByText('main-content')).toBeInTheDocument()
    expect(screen.getByText('sidebar-content')).toBeInTheDocument()
    const sidebar = screen.getByTestId('detail-body-sidebar')
    expect(sidebar.style.width).toBe('320px')
  })

  it('renders only main when sidebar is omitted', () => {
    render(<DetailBody main={<div>only-main</div>} />)
    expect(screen.getByText('only-main')).toBeInTheDocument()
    expect(screen.queryByTestId('detail-body-sidebar')).not.toBeInTheDocument()
  })
})
