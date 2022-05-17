import { describe, test } from 'vitest'
import { roundTo, lerp } from '@curvy/math'
import { CubicPoints, Point } from '@curvy/types'
import { createCubicBezierSpline } from '../src'

const solveCubicDeCasteljau = (points: CubicPoints, t: number): Point => {
  const ax = lerp(t, points[0][0], points[1][0])
  const ay = lerp(t, points[0][1], points[1][1])

  const bx = lerp(t, points[1][0], points[2][0])
  const by = lerp(t, points[1][1], points[2][1])

  const cx = lerp(t, points[2][0], points[3][0])
  const cy = lerp(t, points[2][1], points[3][1])

  const dx = lerp(t, ax, bx)
  const dy = lerp(t, ay, by)

  const ex = lerp(t, bx, cx)
  const ey = lerp(t, by, cy)

  const fx = lerp(t, dx, ex)
  const fy = lerp(t, dy, ey)

  return [fx, fy]
}

describe('createCubicBezierSpline', () => {
  test('creates a valid cubic bezier', ({ expect }) => {
    const points: CubicPoints = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]

    const precision = 5

    const spline = createCubicBezierSpline(points, { precision, lutResolution: 512 })

    for (const t of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
      const solvedPoint = solveCubicDeCasteljau(points, t)

      expect(spline.solveY(solvedPoint[0])).toBe(roundTo(solvedPoint[1], precision))
      expect(spline.solveX(solvedPoint[1])).toBe(roundTo(solvedPoint[0], precision))
    }

    expect(2).toBe(2)
  })
})
