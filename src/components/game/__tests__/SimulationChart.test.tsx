import { describe, expect, it } from 'vitest'
import { getNearestHoverPoint } from '../SimulationChart'

const ACTIVE_SERIES = {
  systemCount: true,
  responseTime: true,
  utilization: true,
  arrivalRate: true,
}

describe('getNearestHoverPoint', () => {
  it('selects the rendered point closest to the cursor in chart space', () => {
    const nearest = getNearestHoverPoint(
      [
        {
          item: { props: { dataKey: 'systemCount' } },
          props: {
            points: [
              { x: 100, y: 20, value: 12, payload: { time: 10, systemCount: 12 } },
              { x: 200, y: 20, value: 9, payload: { time: 20, systemCount: 9 } },
            ],
          },
        },
        {
          item: { props: { dataKey: 'responseTime' } },
          props: {
            points: [
              { x: 102, y: 130, value: 5, payload: { time: 10, responseTime: 5 } },
              { x: 198, y: 42, value: 2, payload: { time: 20, responseTime: 2 } },
            ],
          },
        },
      ],
      ACTIVE_SERIES,
      195,
      45,
    )

    expect(nearest?.key).toBe('responseTime')
    expect(nearest?.time).toBe(20)
    expect(nearest?.value).toBe(2)
  })

  it('ignores hidden series, missing keys, and invalid points', () => {
    const nearest = getNearestHoverPoint(
      [
        {
          props: {
            dataKey: 'systemCount',
            points: [{ x: 30, y: 50, value: 4, payload: { time: 5, systemCount: 4 } }],
          },
        },
        {
          props: {
            dataKey: 'responseTime',
            points: [{ x: 50, y: 50, value: 1, payload: { time: 5, responseTime: 1 } }],
          },
        },
        {
          props: {
            dataKey: 'utilization',
            points: [{ x: null, y: 10, value: 1, payload: { time: 5, utilization: 1 } }],
          },
        },
      ],
      { ...ACTIVE_SERIES, responseTime: false },
      50,
      50,
    )

    expect(nearest?.key).toBe('systemCount')
  })
})
