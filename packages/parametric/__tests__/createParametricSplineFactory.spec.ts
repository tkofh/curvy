import { describe, test } from 'vitest'
import { Matrix4x3, Matrix4x4, Point } from '@curvy/types'
import { roundTo } from '@curvy/math'
import { createParametricSplineFactory } from '../src'

const bezierBaseMatrix: Matrix4x4 = [
  [-1, 3, -3, 1],
  [3, -6, 3, 0],
  [-3, 3, 0, 0],
  [1, 0, 0, 0],
]
const bezierPrimeMatrix: Matrix4x3 = [
  [-3, 6, -3],
  [9, -12, 3],
  [-9, 6, 0],
  [3, 0, 0],
]

describe('createParametricSplineFactory', () => {
  test('ensures at least one cubic segment is provided', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    expect(() => createBezier([])).toThrowError(
      'At least one cubic segment (four points) must be provided'
    )
  })
  test('ensures only complete cubic segments are provided', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    expect(() =>
      createBezier([
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ])
    ).toThrowError('Invalid number of points provided (must have 3n+1 points)')
  })

  test('calculates the bounds of a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
    ])
    expect(spline.meta.bounds).toStrictEqual({
      minX: 0,
      maxX: 1,
      minY: 0,
      maxY: 1,
    })
  })
  test('calculates the bounds of multiple curves', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
      [1.25, 1.25],
      [1.75, 1.75],
      [2, 2],
      [2.25, 2.25],
      [2.75, 2.75],
      [3, 3],
    ])
    expect(spline.meta.bounds).toStrictEqual({
      minX: 0,
      maxX: 3,
      minY: 0,
      maxY: 3,
    })
  })

  test('calculates the extrema of a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline1 = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
    ])
    expect(spline1.meta.extrema).toStrictEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ])

    const spline2 = createBezier(
      [
        [0, 0],
        [0, 5],
        [1, -4],
        [1, 1],
      ],
      // reduce precision for simplicity
      { precision: 2 }
    )

    expect(spline2.meta.extrema).toStrictEqual([
      { x: 0, y: 0 },
      { x: 0.14, y: 1.57 },
      { x: 0.86, y: -0.57 },
      { x: 1, y: 1 },
    ])
  })
  test('calculates the extrema of multiple curves', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline1 = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
      [1.25, 1.25],
      [1.75, 1.75],
      [2, 2],
    ])

    expect(spline1.meta.extrema).toStrictEqual([
      { x: 0, y: 0 },
      { x: 2, y: 2 },
    ])

    const spline2 = createBezier(
      [
        [0, 0],
        [0, 5],
        [0.5, 5],
        [0.5, 0.5],
        [0.5, -4],
        [1, -4],
        [1, 1],
      ],
      { precision: 2 }
    )

    expect(spline2.meta.extrema).toStrictEqual([
      { x: 0, y: 0 },
      { x: 0.26, y: 3.81 },
      { x: 0.74, y: -2.81 },
      { x: 1, y: 1 },
    ])
  })

  test('calculates the length of a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline1 = createBezier([
      [0, 0],
      [0, 0.25],
      [0, 0.75],
      [0, 1],
    ])
    expect(spline1.meta.length).toBe(1)

    const spline2 = createBezier([
      [0, 0],
      [0.25, 0],
      [0.75, 0],
      [1, 0],
    ])
    expect(spline2.meta.length).toBe(1)

    const spline3 = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
    ])
    expect(roundTo(spline3.meta.length, 10)).toBe(roundTo(Math.sqrt(2), 10))
  })
  test('calculates the length of multiple curves', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline1 = createBezier([
      [0, 0],
      [0, 0.25],
      [0, 0.75],
      [0, 1],
      [0, 1.25],
      [0, 1.75],
      [0, 2],
    ])
    expect(spline1.meta.length).toBe(2)

    const spline2 = createBezier([
      [0, 0],
      [0.25, 0],
      [0.75, 0],
      [1, 0],
      [1.25, 0],
      [1.75, 0],
      [2, 0],
    ])

    expect(spline2.meta.length).toBe(2)

    const spline3 = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
      [1.25, 1.25],
      [1.75, 1.75],
      [2, 2],
    ])

    expect(roundTo(spline3.meta.length, 10)).toBe(roundTo(Math.sqrt(2) * 2, 10))
  })

  test('can solve y for a given x of a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
      ],
      { precision: 2 }
    )

    for (let i = 0; i <= 1; i += 0.01) {
      const x = roundTo(i, 2)
      expect(spline.solveY(x)).toBe(x)
    }
  })
  test('returns undefined attempting to solve y for an out of bounds x on a single curve', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
    ])

    expect(spline.solveY(-1)).toBeUndefined()
    expect(spline.solveY(2)).toBeUndefined()
  })
  test('respects min/max y when solving y for a given x of a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [5, 0.25],
        [-4, 0.75],
        [1, 1],
      ],
      { precision: 4 }
    )

    expect(spline.solveY(0.5, 0, 0.0287)).toBeUndefined()
    expect(spline.solveY(0.5, 0, 0.0288)).toBe(0.0288)
    expect(spline.solveY(0.5, 0.0287, 0.0289)).toBe(0.0288)
    expect(spline.solveY(0.5, 0.0288, 0.4999)).toBe(0.0288)
    expect(spline.solveY(0.5, 0.0289, 0.4999)).toBeUndefined()
    expect(spline.solveY(0.5, 0.0289, 0.5)).toBe(0.5)
    expect(spline.solveY(0.5, 0.4999, 0.5001)).toBe(0.5)
    expect(spline.solveY(0.5, 0.5, 0.9711)).toBe(0.5)
    expect(spline.solveY(0.5, 0.5001, 0.9711)).toBeUndefined()
    expect(spline.solveY(0.5, 0.5001, 0.9712)).toBe(0.9712)
    expect(spline.solveY(0.5, 0.9711, 0.9713)).toBe(0.9712)
    expect(spline.solveY(0.5, 0.9712, 1)).toBe(0.9712)
    expect(spline.solveY(0.5, 0.9713, 1)).toBeUndefined()
  })
  test('respects spline precision when solving y for a given x of a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const points: Point[] = [
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
    ]

    const spline1 = createBezier(points, { precision: 0 })
    expect(spline1.solveY(0.5432)).toBe(1)

    const spline2 = createBezier(points, { precision: 1 })
    expect(spline2.solveY(0.5432)).toBe(0.5)

    const spline3 = createBezier(points, { precision: 2 })
    expect(spline3.solveY(0.5432)).toBe(0.54)

    const spline4 = createBezier(points, { precision: 3 })
    expect(spline4.solveY(0.5432)).toBe(0.543)

    const spline5 = createBezier(points, { precision: 4 })
    expect(spline5.solveY(0.5432)).toBe(0.5432)
  })

  test('can solve y for a given x of multiple curves', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
        [1.25, 1.25],
        [1.75, 1.75],
        [2, 2],
      ],
      { precision: 2 }
    )

    for (let i = 0; i <= 2; i += 0.01) {
      const x = roundTo(i, 2)
      expect(spline.solveY(x)).toBe(x)
    }
  })
  test('returns undefined attempting to solve y for an out of bounds x on multiple curves', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
      [1.25, 1.25],
      [1.75, 1.75],
      [2, 2],
    ])

    expect(spline.solveY(-1)).toBeUndefined()
    expect(spline.solveY(3)).toBeUndefined()
  })
  test('respects min/max y when solving y for a given x of multiple curves', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [5, 0],
        [5, 0.5],
        [0.5, 0.5],
        [-4, 0.5],
        [-4, 1],
        [1, 1],
      ],
      { precision: 4 }
    )

    expect(spline.solveY(0.5, 0, 0.0016)).toBeUndefined()
    expect(spline.solveY(0.5, 0, 0.0017)).toBe(0.0017)
    expect(spline.solveY(0.5, 0.0016, 0.0018)).toBe(0.0017)
    expect(spline.solveY(0.5, 0.0017, 0.4999)).toBe(0.0017)
    expect(spline.solveY(0.5, 0.0018, 0.4999)).toBeUndefined()
    expect(spline.solveY(0.5, 0.0018, 0.5)).toBe(0.5)
    expect(spline.solveY(0.5, 0.4999, 0.5001)).toBe(0.5)
    expect(spline.solveY(0.5, 0.5, 0.9982)).toBe(0.5)
    expect(spline.solveY(0.5, 0.5001, 0.9982)).toBeUndefined()
    expect(spline.solveY(0.5, 0.5001, 0.9983)).toBe(0.9983)
    expect(spline.solveY(0.5, 0.9982, 0.9984)).toBe(0.9983)
    expect(spline.solveY(0.5, 0.9983, 1)).toBe(0.9983)
    expect(spline.solveY(0.5, 0.9984, 1)).toBeUndefined()
  })
  test('respects spline precision when solving y for a given x of multiple curves', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const points: Point[] = [
      [0, 0],
      [0.1, 0.1],
      [0.4, 0.4],
      [0.5, 0.5],
      [0.6, 0.6],
      [0.9, 0.9],
      [1, 1],
    ]

    const spline1 = createBezier(points, { precision: 0 })
    expect(spline1.solveY(0.5432)).toBe(1)

    const spline2 = createBezier(points, { precision: 1 })
    expect(spline2.solveY(0.5432)).toBe(0.5)

    const spline3 = createBezier(points, { precision: 2 })
    expect(spline3.solveY(0.5432)).toBe(0.54)

    const spline4 = createBezier(points, { precision: 3 })
    expect(spline4.solveY(0.5432)).toBe(0.543)

    const spline5 = createBezier(points, { precision: 4 })
    expect(spline5.solveY(0.5432)).toBe(0.5432)
  })

  test('can solve x for a given y of a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
      ],
      { precision: 2 }
    )

    for (let i = 0; i <= 1; i += 0.01) {
      const y = roundTo(i, 2)
      expect(spline.solveX(y)).toBe(y)
    }
  })
  test('returns undefined attempting to solve x for an out of bounds y on a single curve', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
    ])

    expect(spline.solveX(-1)).toBeUndefined()
    expect(spline.solveX(2)).toBeUndefined()
  })
  test('respects min/max x when solving x for a given y of a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 5],
        [0.75, -4],
        [1, 1],
      ],
      { precision: 4 }
    )

    expect(spline.solveX(0.5, 0, 0.0287)).toBeUndefined()
    expect(spline.solveX(0.5, 0, 0.0288)).toBe(0.0288)
    expect(spline.solveX(0.5, 0.0287, 0.0289)).toBe(0.0288)
    expect(spline.solveX(0.5, 0.0288, 0.4999)).toBe(0.0288)
    expect(spline.solveX(0.5, 0.0289, 0.4999)).toBeUndefined()
    expect(spline.solveX(0.5, 0.0289, 0.5)).toBe(0.5)
    expect(spline.solveX(0.5, 0.4999, 0.5001)).toBe(0.5)
    expect(spline.solveX(0.5, 0.5, 0.9711)).toBe(0.5)
    expect(spline.solveX(0.5, 0.5001, 0.9711)).toBeUndefined()
    expect(spline.solveX(0.5, 0.5001, 0.9712)).toBe(0.9712)
    expect(spline.solveX(0.5, 0.9711, 0.9713)).toBe(0.9712)
    expect(spline.solveX(0.5, 0.9712, 1)).toBe(0.9712)
    expect(spline.solveX(0.5, 0.9713, 1)).toBeUndefined()
  })
  test('respects spline precision when solving x for a given y of a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const points: Point[] = [
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
    ]

    const spline1 = createBezier(points, { precision: 0 })
    expect(spline1.solveX(0.5432)).toBe(1)

    const spline2 = createBezier(points, { precision: 1 })
    expect(spline2.solveX(0.5432)).toBe(0.5)

    const spline3 = createBezier(points, { precision: 2 })
    expect(spline3.solveX(0.5432)).toBe(0.54)

    const spline4 = createBezier(points, { precision: 3 })
    expect(spline4.solveX(0.5432)).toBe(0.543)

    const spline5 = createBezier(points, { precision: 4 })
    expect(spline5.solveX(0.5432)).toBe(0.5432)
  })

  test('can solve x for a given y of multiple curves', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
        [1.25, 1.25],
        [1.75, 1.75],
        [2, 2],
      ],
      { precision: 2 }
    )

    for (let i = 0; i <= 2; i += 0.01) {
      const y = roundTo(i, 2)
      expect(spline.solveX(y)).toBe(y)
    }
  })
  test('returns undefined attempting to solve x for an out of bounds y on multiple curves', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier([
      [0, 0],
      [0.25, 0.25],
      [0.75, 0.75],
      [1, 1],
      [1.25, 1.25],
      [1.75, 1.75],
      [2, 2],
    ])

    expect(spline.solveX(-1)).toBeUndefined()
    expect(spline.solveX(3)).toBeUndefined()
  })
  test('respects min/max x when solving x for a given y of multiple curves', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0, 5],
        [0.5, 5],
        [0.5, 0.5],
        [0.5, -4],
        [1, -4],
        [1, 1],
      ],
      { precision: 4 }
    )

    expect(spline.solveX(0.5, 0, 0.0016)).toBeUndefined()
    expect(spline.solveX(0.5, 0, 0.0017)).toBe(0.0017)
    expect(spline.solveX(0.5, 0.0016, 0.0018)).toBe(0.0017)
    expect(spline.solveX(0.5, 0.0017, 0.4999)).toBe(0.0017)
    expect(spline.solveX(0.5, 0.0018, 0.4999)).toBeUndefined()
    expect(spline.solveX(0.5, 0.0018, 0.5)).toBe(0.5)
    expect(spline.solveX(0.5, 0.4999, 0.5001)).toBe(0.5)
    expect(spline.solveX(0.5, 0.5, 0.9982)).toBe(0.5)
    expect(spline.solveX(0.5, 0.5001, 0.9982)).toBeUndefined()
    expect(spline.solveX(0.5, 0.5001, 0.9983)).toBe(0.9983)
    expect(spline.solveX(0.5, 0.9982, 0.9984)).toBe(0.9983)
    expect(spline.solveX(0.5, 0.9983, 1)).toBe(0.9983)
    expect(spline.solveX(0.5, 0.9984, 1)).toBeUndefined()
  })
  test('respects spline precision when solving x for a given y of multiple curves', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const points: Point[] = [
      [0, 0],
      [0.1, 0.1],
      [0.4, 0.4],
      [0.5, 0.5],
      [0.6, 0.6],
      [0.9, 0.9],
      [1, 1],
    ]

    const spline1 = createBezier(points, { precision: 0 })
    expect(spline1.solveX(0.5432)).toBe(1)

    const spline2 = createBezier(points, { precision: 1 })
    expect(spline2.solveX(0.5432)).toBe(0.5)

    const spline3 = createBezier(points, { precision: 2 })
    expect(spline3.solveX(0.5432)).toBe(0.54)

    const spline4 = createBezier(points, { precision: 3 })
    expect(spline4.solveX(0.5432)).toBe(0.543)

    const spline5 = createBezier(points, { precision: 4 })
    expect(spline5.solveX(0.5432)).toBe(0.5432)
  })

  test('can solve the point at a given length for a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
      ],
      { precision: 2 }
    )

    expect(spline.solveLength(0)).toStrictEqual({ x: 0, y: 0 })
    expect(spline.solveLength(Math.sqrt(2) * 0.25)).toStrictEqual({ x: 0.25, y: 0.25 })
    expect(spline.solveLength(Math.sqrt(2) * 0.5)).toStrictEqual({ x: 0.5, y: 0.5 })
    expect(spline.solveLength(Math.sqrt(2) * 0.75)).toStrictEqual({ x: 0.75, y: 0.75 })
    expect(spline.solveLength(Math.sqrt(2))).toStrictEqual({ x: 1, y: 1 })
  })
  test('can solve the point at a given length for multiple curves', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.1, 0.1],
        [0.4, 0.4],
        [0.5, 0.5],
        [0.6, 0.6],
        [0.9, 0.9],
        [1, 1],
      ],
      { precision: 2 }
    )

    expect(spline.solveLength(0)).toStrictEqual({ x: 0, y: 0 })
    expect(spline.solveLength(Math.sqrt(2) * 0.25)).toStrictEqual({ x: 0.25, y: 0.25 })
    expect(spline.solveLength(Math.sqrt(2) * 0.5)).toStrictEqual({ x: 0.5, y: 0.5 })
    expect(spline.solveLength(Math.sqrt(2) * 0.75)).toStrictEqual({ x: 0.75, y: 0.75 })
    expect(spline.solveLength(Math.sqrt(2))).toStrictEqual({ x: 1, y: 1 })
  })
  test('returns undefined when attempting to solve the point at an out of bounds length for a single curve', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
      ],
      { precision: 2 }
    )

    expect(spline.solveLength(-1)).toBeUndefined()
    expect(spline.solveLength(Math.sqrt(2) + 1)).toBeUndefined()
  })
  test('returns undefined when attempting to solve the point at an out of bounds length for multiple curves', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.1, 0.1],
        [0.4, 0.4],
        [0.5, 0.5],
        [0.6, 0.6],
        [0.9, 0.9],
        [1, 1],
      ],
      { precision: 2 }
    )

    expect(spline.solveLength(-1)).toBeUndefined()
    expect(spline.solveLength(Math.sqrt(2) + 1)).toBeUndefined()
  })

  test('can solve the point at a given t for a single curve', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
      ],
      { precision: 2 }
    )

    expect(spline.solveT(0)).toStrictEqual({ x: 0, y: 0 })
    expect(spline.solveT(0.5)).toStrictEqual({ x: 0.5, y: 0.5 })
    expect(spline.solveT(1)).toStrictEqual({ x: 1, y: 1 })
  })
  test('can solve the point at a given t for multiple curves', ({ expect }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
        [1.25, 1.25],
        [1.75, 1.75],
        [2, 2],
      ],
      { precision: 2 }
    )

    expect(spline.solveT(0)).toStrictEqual({ x: 0, y: 0 })
    expect(spline.solveT(0.25)).toStrictEqual({ x: 0.5, y: 0.5 })
    expect(spline.solveT(0.5)).toStrictEqual({ x: 1, y: 1 })
    expect(spline.solveT(0.75)).toStrictEqual({ x: 1.5, y: 1.5 })
    expect(spline.solveT(1)).toStrictEqual({ x: 2, y: 2 })
  })
  test('returns undefined when attempting to solve the point at an out of bounds t for a single curve', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
      ],
      { precision: 2 }
    )

    expect(spline.solveT(-1)).toBeUndefined()
    expect(spline.solveT(2)).toBeUndefined()
  })
  test('returns undefined when attempting to solve the point at an out of bounds t for multiple curves', ({
    expect,
  }) => {
    const createBezier = createParametricSplineFactory(bezierBaseMatrix, bezierPrimeMatrix)

    const spline = createBezier(
      [
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
        [1.25, 1.25],
        [1.75, 1.75],
        [2, 2],
      ],
      { precision: 2 }
    )

    expect(spline.solveT(-1)).toBeUndefined()
    expect(spline.solveT(2)).toBeUndefined()
  })
})
