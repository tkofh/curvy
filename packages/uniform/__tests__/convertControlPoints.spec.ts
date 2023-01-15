import { describe, test } from 'vitest'
import type { CubicPoints } from '@curvy/types'
import { bezier, cardinal, convertControlPoints, hermite } from '../src'

describe('convertControlPoint', () => {
  test('it works', ({ expect }) => {
    expect(2).toBe(2)

    const sourceControlPoints: CubicPoints<'x' | 'y'> = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]

    expect(convertControlPoints(sourceControlPoints, bezier, hermite)).toStrictEqual([
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 1, y: 1 },
      { x: 3, y: 0 },
    ])

    expect(
      convertControlPoints(
        [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 1, y: 1 },
          { x: 3, y: 0 },
        ],
        hermite,
        bezier
      )
    ).toStrictEqual(sourceControlPoints)

    expect(convertControlPoints(sourceControlPoints, bezier, cardinal(0.5))).toStrictEqual([
      { x: -5, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 6, y: 0 },
    ])

    expect(
      convertControlPoints(
        [
          { x: -5, y: 1 },
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 6, y: 0 },
        ],
        cardinal(0.5),
        bezier
      )
    ).toStrictEqual(sourceControlPoints)
  })

  test('it converts bezier to hermite', ({ expect }) => {
    const bezierPoints: CubicPoints<'x' | 'y'> = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]

    expect(convertControlPoints(bezierPoints, bezier, hermite)).toStrictEqual([
      { x: bezierPoints[0].x, y: bezierPoints[0].y },
      {
        x: 3 * (bezierPoints[1].x - bezierPoints[0].x),
        y: 3 * (bezierPoints[1].y - bezierPoints[0].y),
      },
      { x: bezierPoints[3].x, y: bezierPoints[3].y },
      {
        x: 3 * (bezierPoints[3].x - bezierPoints[2].x),
        y: 3 * (bezierPoints[3].y - bezierPoints[2].y),
      },
    ])
  })
})
