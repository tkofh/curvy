import { describe, test } from 'vitest'
import { roundTo, lerp } from 'micro-math'
import { PointObject } from '@curvy/types'
import { createCubicBezierSpline } from '../src'

const solveCubicDeCasteljau = (
  points: [PointObject, PointObject, PointObject, PointObject],
  t: number
): PointObject => {
  const ax = lerp(t, points[0].x, points[1].x)
  const ay = lerp(t, points[0].y, points[1].y)

  const bx = lerp(t, points[1].x, points[2].x)
  const by = lerp(t, points[1].y, points[2].y)

  const cx = lerp(t, points[2].x, points[3].x)
  const cy = lerp(t, points[2].y, points[3].y)

  const dx = lerp(t, ax, bx)
  const dy = lerp(t, ay, by)

  const ex = lerp(t, bx, cx)
  const ey = lerp(t, by, cy)

  const fx = lerp(t, dx, ex)
  const fy = lerp(t, dy, ey)

  return { x: fx, y: fy }
}

describe('createCubicBezierSpline', () => {
  test('creates a valid cubic bezier', ({ expect }) => {
    const points: [PointObject, PointObject, PointObject, PointObject] = [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ]

    const precision = 5

    const spline = createCubicBezierSpline(points, { precision, lutResolution: 512 })

    for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
      const solvedPoint = solveCubicDeCasteljau(points, t)

      expect(spline.solveY(solvedPoint.x)).toBe(roundTo(solvedPoint.y, precision))
      expect(spline.solveX(solvedPoint.y)).toBe(roundTo(solvedPoint.x, precision))
    }
  })
})
