import { describe, test } from 'vitest'
import { createCubicTCBSpline } from '../src'

describe('createCubicTCBSpline', () => {
  test('it creates a tcb spline', ({ expect }) => {
    const spline = createCubicTCBSpline(
      [
        [0, 0],
        [25, 50],
        [50, 25],
        [75, 100],
        [100, 50],
      ],
      { tension: -1, continuity: 0, bias: -0, virtualStart: [-50, 0], virtualEnd: [150, 50] }
    )

    expect(spline.solveY(0)).toBe(0)
    expect(spline.solveY(25)).toBe(50)
    expect(spline.solveY(50)).toBe(25)
    expect(spline.solveY(75)).toBe(100)
    expect(spline.solveY(100)).toBe(50)

    // expect(2).toBe(2)
  })
})
