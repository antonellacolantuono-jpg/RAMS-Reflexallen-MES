import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LeakTelemetry } from './LeakTelemetry'
import {
  __INITIAL_DEVICE_CYCLE_STATE__,
  type DeviceCycleState,
} from '../../../../lib/use-device-cycle'

describe('LeakTelemetry', () => {
  it('marks the leak rate as PASS (below threshold) when the rate is under 0.5 mbar/min', () => {
    const cycle: DeviceCycleState = {
      ...__INITIAL_DEVICE_CYCLE_STATE__,
      status: 'running',
      stepExecutionId: 'se-1',
      pressureBar: 6.02,
      leakRateMbarMin: 0.32,
      pressureHistory: [{ t: 0, bar: 6.0 }],
    }
    render(<LeakTelemetry cycle={cycle} />)
    const root = screen.getByTestId('leak-telemetry')
    expect(root.getAttribute('data-leak-pass')).toBe('true')
    expect(screen.getByTestId('leak-rate')).toHaveTextContent('0.32')
    expect(screen.getByTestId('leak-pressure')).toHaveTextContent('6.02')
    expect(screen.getByTestId('leak-threshold-line')).toHaveTextContent('0.50')
  })

  it('marks the leak rate as FAIL when above the threshold', () => {
    const cycle: DeviceCycleState = {
      ...__INITIAL_DEVICE_CYCLE_STATE__,
      status: 'running',
      stepExecutionId: 'se-1',
      pressureBar: 5.7,
      leakRateMbarMin: 1.42,
      pressureHistory: [{ t: 0, bar: 6.0 }],
    }
    render(<LeakTelemetry cycle={cycle} passThresholdMbarMin={0.5} />)
    expect(
      screen.getByTestId('leak-telemetry').getAttribute('data-leak-pass'),
    ).toBe('false')
    expect(screen.getByTestId('leak-rate')).toHaveTextContent('1.42')
  })
})
