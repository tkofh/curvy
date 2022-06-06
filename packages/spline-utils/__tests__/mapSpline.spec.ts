import { describe, test } from 'vitest'
import { createCubicBezierSpline } from '@curvy/bezier'
import { remap, roundTo } from '@curvy/math'
import { mapSpline } from '../src'

describe('mapSpline', () => {
  test('it maps a spline', ({ expect }) => {
    const originalSpline = createCubicBezierSpline(
      [
        [0, 0],
        [0, 5],
        [1, -4],
        [1, 1],
      ],
      { precision: 2 }
    )

    const mappedSpline = mapSpline(originalSpline, { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } })

    expect(mappedSpline.meta.bounds).toStrictEqual({
      x: { min: 0, max: 1 },
      y: { min: 0, max: 1 },
    })

    for (const extreme of originalSpline.meta.extrema) {
      expect(mappedSpline.solveY(extreme.x)).toStrictEqual(
        roundTo(
          remap(
            extreme.y,
            originalSpline.meta.bounds.y.min,
            originalSpline.meta.bounds.y.max,
            mappedSpline.meta.bounds.y.min,
            mappedSpline.meta.bounds.y.max
          ),
          mappedSpline.meta.precisionY
        )
      )
    }
  })
})
