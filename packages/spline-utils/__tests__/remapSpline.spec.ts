import { describe, test } from 'vitest'
import { createCubicBezierSpline } from '@curvy/bezier'
import { remapSpline } from '../src'

describe('remapSpline', () => {
  test('it remaps a spline', ({ expect }) => {
    const originalSpline1 = createCubicBezierSpline(
      [
        [0, 0],
        [0, 5],
        [1, -4],
        [1, 1],
      ],
      { precision: 2 }
    )

    const remappedSpline1 = remapSpline(
      originalSpline1,
      { minX: 0, maxX: 1, minY: 0, maxY: 1 },
      { minX: 0, maxX: 2, minY: 0, maxY: 2 }
    )

    expect(remappedSpline1.solveY(0)).toBe(0)
    expect(remappedSpline1.solveY(1)).toBe(1)
    expect(remappedSpline1.solveY(2)).toBe(2)

    for (const extreme of originalSpline1.meta.extrema) {
      expect(remappedSpline1.solveY(extreme.x * 2)).toBe(extreme.y * 2)
    }

    const originalSpline2 = createCubicBezierSpline(
      [
        [0, 0],
        [5, 0],
        [-4, 1],
        [1, 1],
      ],
      { precision: 2 }
    )

    const remappedSpline2 = remapSpline(
      originalSpline2,
      { minX: 0, maxX: 1, minY: 0, maxY: 1 },
      { minX: 0, maxX: 2, minY: 0, maxY: 2 }
    )

    expect(remappedSpline2.solveX(0)).toBe(0)
    expect(remappedSpline2.solveX(1)).toBe(1)
    expect(remappedSpline2.solveX(2)).toBe(2)

    for (const extreme of originalSpline2.meta.extrema) {
      expect(remappedSpline2.solveX(extreme.y * 2)).toBe(extreme.x * 2)
    }
  })
})
