import { describe, test } from 'vitest'
import { createCubicBezierSpline } from '@curvy/bezier'
import { getSplineAxisRanges } from '../src'

describe('getSplineAxisRanges', () => {
  test('it gets spline thresholds', ({ expect }) => {
    expect(2).toBe(2)

    const spline = createCubicBezierSpline([
      [0, 0],
      [0.25, 95],
      [0.75, -20],
      [1, 100],
    ])

    const rangesX = getSplineAxisRanges(spline, 'X', 2, 0)

    for (const [index, range] of rangesX.entries()) {
      if (index > 0 && index < rangesX.length - 1) {
        const previous = rangesX[index - 1]
        const next = rangesX[index + 1]
        expect(previous.end).toBe(range.start)
        expect(next.start).toBe(range.end)
      }
    }

    const rangesY = getSplineAxisRanges(spline, 'Y', 0, 2)

    for (const [index, range] of rangesY.entries()) {
      if (index > 0 && index < rangesY.length - 1) {
        const previous = rangesY[index - 1]
        const next = rangesY[index + 1]

        expect(previous.end).toBe(range.start)
        expect(next.start).toBe(range.end)
      }
    }
  })
})
