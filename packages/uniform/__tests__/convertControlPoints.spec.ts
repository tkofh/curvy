import { describe, test } from 'vitest'
import { CubicPoints, Matrix4x4 } from '@curvy/types'
import { convertControlPoints } from '../src'

const bezier: Matrix4x4 = [
  [-1, 3, -3, 1],
  [3, -6, 3, 0],
  [-3, 3, 0, 0],
  [1, 0, 0, 0],
]

const hermite: Matrix4x4 = [
  [2, 1, -2, 1],
  [-3, -2, 3, -1],
  [0, 1, 0, 0],
  [1, 0, 0, 0],
]

const cardinal = (a: number): Matrix4x4 => [
  [-a, 2 - a, a - 2, a],
  [2 * a, a - 3, 3 - 2 * a, -a],
  [-a, 0, a, 0],
  [0, 1, 0, 0],
]

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
})
