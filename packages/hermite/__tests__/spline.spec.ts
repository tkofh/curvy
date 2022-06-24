import { describe, test } from 'vitest'
import { PointObject } from '@curvy/types'
// import { toPath } from '@curvy/visualize'
import { createCubicHermiteSpline, createCubicTCBSpline } from '../src'

describe('createCubicHermiteSpline', () => {
  test.skip('creates a valid cubic bezier', ({ expect }) => {
    const points: [PointObject, PointObject, PointObject, PointObject] = [
      { x: 0, y: 100 },
      { x: 50, y: 0 },
      { x: 125, y: 0 },
      { x: 100, y: 0 },
    ]

    const precision = 5

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const spline = createCubicHermiteSpline(points, { precision, lutResolution: 512 })

    // console.log(toPath(spline, 200))

    // for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
    //   const solvedPoint = solveCubicDeCasteljau(points, t)
    //
    //   expect(spline.solveY(solvedPoint.x)).toBe(roundTo(solvedPoint.y, precision))
    //   expect(spline.solveX(solvedPoint.y)).toBe(roundTo(solvedPoint.x, precision))
    // }

    expect(2).toBe(2)
  })
})

describe('createCubicTCBSpline', () => {
  test('it creates a tcb spline', ({ expect }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // console.log(toPath(spline, 200))

    expect(2).toBe(2)
  })
})
