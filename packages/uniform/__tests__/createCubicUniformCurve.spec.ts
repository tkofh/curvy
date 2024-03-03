import { describe, test } from 'vitest'
import { bezier, createCubicUniformCurve } from '../src'

describe('createCubicUniformCurve', () => {
  test('calculates the bounds of a curve', ({ expect }) => {
    expect(
      createCubicUniformCurve(
        [{ x: 0 }, { x: 1 / 3 }, { x: 2 / 3 }, { x: 1 }],
        bezier,
      ).bounds,
    ).toStrictEqual({
      x: { min: 0, max: 1 },
    })

    expect(
      createCubicUniformCurve(
        [{ x: 0 }, { x: 2 }, { x: 2 }, { x: 0 }],
        bezier,
        2,
      ).bounds,
    ).toStrictEqual({
      x: { min: 0, max: 1.5 },
    })
  })

  test('calculates the extrema of a curve', ({ expect }) => {
    expect(
      createCubicUniformCurve(
        [{ x: 0 }, { x: 2 }, { x: 2 }, { x: 0 }],
        bezier,
        2,
        512,
      ).extrema,
    ).toStrictEqual([
      { for: new Set(['x']), value: { x: 0 }, t: 0, length: 0 },
      { for: new Set(['x']), value: { x: 1.5 }, t: 0.5, length: 1.5 },
      { for: new Set(['x']), value: { x: 0 }, t: 1, length: 2.999999999999981 },
    ])

    expect(
      createCubicUniformCurve(
        [{ x: 0 }, { x: 2 }, { x: -2 }, { x: 0 }],
        bezier,
        2,
        512,
      ).extrema,
    ).toStrictEqual([
      { for: new Set(['x']), value: { x: 0 }, t: 0, length: 0 },
      {
        for: new Set(['x']),
        value: { x: 0.58 },
        t: 0.2113248654051871,
        length: 0.58,
      },
      {
        for: new Set(['x']),
        value: { x: -0.58 },
        t: 0.7886751345948129,
        length: 1.7400000000000009,
      },
      {
        for: new Set(['x']),
        value: { x: 0 },
        t: 1,
        length: 2.3199999999999945,
      },
    ])
  })

  test('point returned by solve() is identical to extreme', ({ expect }) => {
    const curve = createCubicUniformCurve(
      [{ x: 0 }, { x: 2 }, { x: -2 }, { x: 0 }],
      bezier,
      2,
    )

    for (const extreme of curve.extrema) {
      expect(curve.trySolveT(extreme.t)).toStrictEqual(extreme.value)
      expect(curve.trySolveLength(extreme.length)).toStrictEqual(extreme.value)
      expect(curve.trySolve('x', extreme.value.x)).toStrictEqual(extreme.value)
    }
  })

  test('calculates the length of a curve', ({ expect }) => {
    expect(
      createCubicUniformCurve(
        [{ x: 0 }, { x: 1 / 3 }, { x: 2 / 3 }, { x: 1 }],
        bezier,
      ).length,
    ).toBe(1)
  })

  test('solves axes', ({ expect }) => {
    const curve = createCubicUniformCurve(
      [
        { x: 0, y: 0 },
        { x: 1 / 3, y: 1 / 3 },
        { x: 2 / 3, y: 2 / 3 },
        { x: 1, y: 1 },
      ],
      bezier,
    )

    for (let i = 0; i <= 1; i += 0.1) {
      const solveX = curve.solve('x', i)
      const solveYFromX = curve.solve('y', solveX.y)
      expect(solveX).toStrictEqual(solveYFromX)

      const solveY = curve.solve('y', i)
      const solveXFromY = curve.solve('x', solveY.x)
      expect(solveY).toStrictEqual(solveXFromY)
    }
  })

  test('solves axes with constraints', ({ expect }) => {
    const curve = createCubicUniformCurve(
      [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 0, y: 1 },
      ],
      bezier,
    )
    expect(curve.solve('x', 0.75, { y: { max: 0.5, min: 0 } }).y).toBeLessThan(
      0.5,
    )
    expect(
      curve.solve('x', 0.75, { y: { max: 1, min: 0.5 } }).y,
    ).toBeGreaterThan(0.5)
  })

  test('returns out of bounds for out of bounds input', ({ expect }) => {
    const curve = createCubicUniformCurve(
      [{ x: 0 }, { x: 2 }, { x: 2 }, { x: 0 }],
      bezier,
    )
    expect(curve.trySolve('x', 2)).toBeUndefined()
    expect(curve.trySolve('x', -2)).toBeUndefined()
    expect(curve.trySolveLength(100)).toBeUndefined()
    expect(curve.trySolveLength(-1)).toBeUndefined()
    expect(curve.trySolveT(2)).toBeUndefined()
    expect(curve.trySolveT(-1)).toBeUndefined()
  })

  test('solves extrema as they are represented in array', ({ expect }) => {
    const curve = createCubicUniformCurve(
      [{ x: 0 }, { x: 2 }, { x: -2 }, { x: 0 }],
      bezier,
    )
    for (const extreme of curve.extrema) {
      expect(curve.solveT(extreme.t)).toStrictEqual(extreme.value)
      expect(curve.solveLength(extreme.length)).toStrictEqual(extreme.value)
      expect(curve.solve('x', extreme.value.x)).toStrictEqual(extreme.value)
    }
  })
})
