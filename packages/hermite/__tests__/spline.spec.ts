import { describe, test } from 'vitest'
import { Point } from '@curvy/types'
import { createCubicTCBSpline, createCubicCardinalSpline } from '../src'

describe('createCubicTCBSpline', () => {
  test('it creates a tcb spline', ({ expect }) => {
    const points: Point[] = [
      [0, 0],
      [25, 50],
      [50, 25],
      [75, 100],
      [100, 50],
    ]
    const spline = createCubicTCBSpline(points, {
      tension: -1,
      continuity: 0,
      bias: -0,
      virtualStart: [-50, 0],
      virtualEnd: [150, 50],
    })

    expect(spline.solveY(0)).toBe(0)
    expect(spline.solveY(25)).toBe(50)
    expect(spline.solveY(50)).toBe(25)
    expect(spline.solveY(75)).toBe(100)
    expect(spline.solveY(100)).toBe(50)
  })
})

describe('createCubicCardinalSpline', () => {
  test('it creates a cardinal spline', ({ expect }) => {
    const points: Point[] = [
      [0, 0],
      [25, 50],
      [50, 25],
      [75, 100],
      [100, 50],
    ]
    const spline = createCubicCardinalSpline(points, {
      a: 0.5,
      virtualStart: [-50, 0],
      virtualEnd: [150, 50],
    })

    expect(spline.solveY(0)).toBe(0)
    expect(spline.solveY(25)).toBe(50)
    expect(spline.solveY(50)).toBe(25)
    expect(spline.solveY(75)).toBe(100)
    expect(spline.solveY(100)).toBe(50)
  })
})
