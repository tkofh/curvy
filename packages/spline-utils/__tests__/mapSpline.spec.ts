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

    const mappedSpline = mapSpline(originalSpline, { minX: 0, maxX: 1, minY: 0, maxY: 1 })

    expect(mappedSpline.meta.bounds).toStrictEqual({
      minX: 0,
      maxX: 1,
      minY: 0,
      maxY: 1,
    })

    for (const extreme of originalSpline.meta.extrema) {
      expect(mappedSpline.solveY(extreme.x)).toStrictEqual(
        roundTo(
          remap(
            extreme.y,
            originalSpline.meta.bounds.minY,
            originalSpline.meta.bounds.maxY,
            mappedSpline.meta.bounds.minY,
            mappedSpline.meta.bounds.maxY
          ),
          mappedSpline.meta.precisionY
        )
      )
    }
  })
})
