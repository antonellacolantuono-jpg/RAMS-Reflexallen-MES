import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DevicePane } from './DevicePane'
import { __INITIAL_DEVICE_CYCLE_STATE__, type DeviceCycleState } from '../../lib/use-device-cycle'

const baseProps = {
  deviceSerialNumber: 'DEV-LEAK-001',
  recipeCode: 'RCP-LEAK-PNE-12-001',
  recipeVersion: 2,
  cycleTimeSec: 45,
  targetPressureBar: 6.0,
  pressureToleranceBar: 0.1,
}

describe('DevicePane', () => {
  it('renders idle state with full countdown and IN ATTESA badge', () => {
    render(<DevicePane {...baseProps} cycle={__INITIAL_DEVICE_CYCLE_STATE__} />)

    expect(screen.getByText('DEV-LEAK-001')).toBeInTheDocument()
    expect(screen.getByText(/RCP-LEAK-PNE-12-001/)).toBeInTheDocument()
    expect(screen.getByText('IN ATTESA')).toBeInTheDocument()
    // countdown shows full cycle time when elapsed is 0
    const countdown = screen.getByTestId('leak-countdown')
    expect(countdown).toHaveTextContent('45')
    expect(countdown).toHaveTextContent('sec')
  })

  it('countdown reflects elapsedSec from progress state', () => {
    const cycle: DeviceCycleState = {
      ...__INITIAL_DEVICE_CYCLE_STATE__,
      status: 'running',
      stepExecutionId: 'se-1',
      startedAt: new Date('2026-05-03T08:00:00Z').toISOString(),
      expectedDurationSec: 45,
      elapsedSec: 13,
      phase: 'hold',
      pressureBar: 6.02,
      pressureHistory: [
        { t: 0, bar: 0 },
        { t: 5, bar: 6.0 },
        { t: 10, bar: 6.05 },
        { t: 13, bar: 6.02 },
      ],
    }
    render(<DevicePane {...baseProps} cycle={cycle} />)

    expect(screen.getByText('IN ESECUZIONE')).toBeInTheDocument()
    // 45 - 13 = 32
    expect(screen.getByTestId('leak-countdown')).toHaveTextContent('32')
    expect(screen.getByTestId('leak-pressure-bar')).toHaveTextContent('6.02')
    expect(screen.getByTestId('leak-phase')).toHaveTextContent(
      'Mantenimento e misura',
    )
  })
})
