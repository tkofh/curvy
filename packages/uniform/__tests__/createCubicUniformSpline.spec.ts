import { describe, test } from 'vitest'
import type { Matrix4x4 } from '@curvy/types'
import { catmullRom, createCubicUniformSpline } from '../src'

const bezier: Matrix4x4 = [
  [-1, 3, -3, 1],
  [3, -6, 3, 0],
  [-3, 3, 0, 0],
  [1, 0, 0, 0],
]

describe('createCubicUniformCurve', () => {
  test('ensures at least one cubic segment is provided', ({ expect }) => {
    expect(() => createCubicUniformSpline([], bezier)).toThrowError(
      'At least one cubic segment must be provided'
    )
  })

  test('calculates the bounds of a spline', ({ expect }) => {
    expect(
      createCubicUniformSpline(
        [
          [{ x: 0 }, { x: 2 }, { x: 2 }, { x: 0 }],
          [{ x: 0 }, { x: -2 }, { x: -2 }, { x: 0 }],
        ],
        bezier,
        2
      ).bounds
    ).toStrictEqual({
      x: { min: -1.5, max: 1.5 },
    })
  })

  test('calculates the extrema of a spline', ({ expect }) => {
    expect(
      createCubicUniformSpline(
        [
          [{ x: 0 }, { x: 2 }, { x: 2 }, { x: 0 }],
          [{ x: 0 }, { x: -2 }, { x: -2 }, { x: 0 }],
        ],
        bezier,
        2
      ).extrema
    ).toStrictEqual([
      { for: new Set('x'), value: { x: 0 }, t: 0, length: 0 },
      { for: new Set('x'), value: { x: 1.5 }, t: 0.25, length: 1.5 },
      { for: new Set('x'), value: { x: -1.5 }, t: 0.75, length: 4.4999999999999805 },
      { for: new Set('x'), value: { x: 0 }, t: 1, length: 5.999999999999962 },
    ])
  })

  test('point returned by solve() is identical to extreme', ({ expect }) => {
    const spline = createCubicUniformSpline(
      [
        [{ x: 0 }, { x: 2 }, { x: 2 }, { x: 0 }],
        [{ x: 0 }, { x: -2 }, { x: -2 }, { x: 0 }],
      ],
      bezier,
      2
    )

    for (const extreme of spline.extrema) {
      expect(spline.trySolveT(extreme.t)).toStrictEqual(extreme.value)
      expect(spline.trySolveLength(extreme.length)).toStrictEqual(extreme.value)
      expect(spline.solve('x', extreme.value.x)).toStrictEqual(extreme.value)
    }
  })

  test('calculates the length of a spline', ({ expect }) => {
    expect(
      createCubicUniformSpline(
        [
          [{ x: 0 }, { x: 2 }, { x: 2 }, { x: 0 }],
          [{ x: 0 }, { x: -2 }, { x: -2 }, { x: 0 }],
        ],
        bezier
      ).length
    ).toBe(6.000000000000002)
  })

  test('solves axes', ({ expect }) => {
    const curve = createCubicUniformSpline(
      [
        [
          { x: 0, y: 0 },
          { x: 1 / 3, y: 1 / 3 },
          { x: 2 / 3, y: 2 / 3 },
          { x: 1, y: 1 },
        ],
        [
          { x: 1, y: 1 },
          { x: 4 / 3, y: 4 / 3 },
          { x: 5 / 3, y: 5 / 3 },
          { x: 2, y: 2 },
        ],
      ],
      bezier
    )

    for (let i = 0; i <= 2; i += 0.1) {
      const solveX = curve.solve('x', i)
      const solveYFromX = curve.solve('y', solveX.y)
      expect(solveX).toStrictEqual(solveYFromX)

      const solveY = curve.solve('y', i)
      const solveXFromY = curve.solve('x', solveY.x)
      expect(solveY).toStrictEqual(solveXFromY)
    }
  })

  test('solves axes with constraints', ({ expect }) => {
    const spline1 = createCubicUniformSpline(
      [
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 2, y: 0.5 },
        ],
        [
          { x: 2, y: 0.5 },
          { x: 2, y: 1 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      ],
      bezier
    )
    expect(spline1.solve('x', 0.75, { y: { max: 0.5, min: 0 } }).y).toBeLessThan(0.5)
    expect(spline1.solve('x', 0.75, { y: { max: 1, min: 0.5 } }).y).toBeGreaterThan(0.5)

    const spline2 = createCubicUniformSpline(
      [
        [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          { x: 0.25, y: 50 },
          { x: 0.5, y: 25 },
        ],
        [
          { x: 0, y: 0 },
          { x: 0.25, y: 50 },
          { x: 0.5, y: 25 },
          { x: 0.75, y: 100 },
        ],
        [
          { x: 0.25, y: 50 },
          { x: 0.5, y: 25 },
          { x: 0.75, y: 100 },
          { x: 1, y: 75 },
        ],
        [
          { x: 0.5, y: 25 },
          { x: 0.75, y: 100 },
          { x: 1, y: 75 },
          { x: 1, y: 75 },
        ],
      ],
      catmullRom,
      { x: 4, y: 0 }
    )

    expect(spline2.solve('y', 48, { x: { min: 0.28, max: 1 } }).x).toBeGreaterThanOrEqual(0.28)
  })

  test('returns out of bounds for out of bounds input', ({ expect }) => {
    const spline = createCubicUniformSpline(
      [
        [{ x: 0 }, { x: 2 }, { x: 2 }, { x: 0 }],
        [{ x: 0 }, { x: -2 }, { x: -2 }, { x: 0 }],
      ],
      bezier
    )
    expect(spline.trySolve('x', 2)).toBeUndefined()
    expect(spline.trySolve('x', -2)).toBeUndefined()
    expect(spline.trySolveLength(100)).toBeUndefined()
    expect(spline.trySolveLength(-1)).toBeUndefined()
    expect(spline.trySolveT(2)).toBeUndefined()
    expect(spline.trySolveT(-1)).toBeUndefined()
  })

  test('solves extrema as they are represented in array', ({ expect }) => {
    const spline = createCubicUniformSpline(
      [
        [{ x: 0 }, { x: 2 }, { x: 2 }, { x: 0 }],
        [{ x: 0 }, { x: -2 }, { x: -2 }, { x: 0 }],
      ],
      bezier
    )
    for (const extreme of spline.extrema) {
      expect(spline.solveT(extreme.t)).toStrictEqual(extreme.value)
      expect(spline.solveLength(extreme.length)).toStrictEqual(extreme.value)
      expect(spline.solve('x', extreme.value.x)).toStrictEqual(extreme.value)
    }
  })
})
