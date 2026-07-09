import { describe, expect, test } from 'vitest'
import * as interval from '../src/interval/interval.ts'
import * as Monotonicity from '../src/monotonicity/monotonicity.ts'
import * as cubic from '../src/polynomial/cubic.ts'
import * as linear from '../src/polynomial/linear.ts'
import * as quadratic from '../src/polynomial/quadratic.ts'
import * as vector2 from '../src/vector/vector2.ts'
import * as vector3 from '../src/vector/vector3.ts'
import * as vector4 from '../src/vector/vector4.ts'

describe('linear', () => {
  test('make', () => {
    expect(linear.make(0, 1)).toMatchObject({ c0: 0, c1: 1 })
  })
  test('fromVector', () => {
    expect(linear.fromVector(vector2.make(0, 1))).toMatchObject({
      c0: 0,
      c1: 1,
    })
  })
  test('fromPointSlope', () => {
    expect(linear.fromPointSlope(vector2.make(1, 1), 1)).toMatchObject({
      c0: 0,
      c1: 1,
    })
  })
  test('fromPoints', () => {
    expect(linear.fromPoints(vector2.make(-1, -1), vector2.make(1, 1))).toMatchObject({
      c0: 0,
      c1: 1,
    })
  })
  test('isLinear', () => {
    expect(linear.isLinearPolynomial(linear.make(0, 1))).toBe(true)
    expect(linear.isLinearPolynomial({ c0: 0, c1: 1 })).toBe(false)
  })
  test('solve', () => {
    expect(linear.solve(linear.make(0, 1), 0)).toBe(0)
    expect(linear.solve(linear.make(0, 1), 1)).toBe(1)
    expect(linear.solve(linear.make(0, 1), 2)).toBe(2)
  })
  test('solveInverse', () => {
    expect([...linear.solveInverse(linear.make(0, -1), 0)][0]).toBeCloseTo(0, 10)
    expect([...linear.solveInverse(linear.make(0, -1), 1)]).toEqual([-1])
    expect([...linear.solveInverse(linear.make(0, -1), 2)]).toEqual([-2])
    expect([...linear.solveInverse(linear.make(5, 0), 0)]).toEqual([])
  })
  test('toSolver', () => {
    const solver = linear.toSolver(linear.make(0, 1))
    expect(solver(0)).toBe(0)
    expect(solver(1)).toBe(1)
    expect(solver(2)).toBe(2)
  })
  test('toInverseSolver', () => {
    const inverseSolver = linear.toInverseSolver(linear.make(0, -1))
    expect([...inverseSolver(0)][0]).toBeCloseTo(0, 10)
    expect([...inverseSolver(1)]).toEqual([-1])
    expect([...inverseSolver(2)]).toEqual([-2])
  })
  test('root', () => {
    expect([...linear.root(linear.make(1, 1))]).toEqual([-1])
    expect([...linear.root(linear.make(2, -1))]).toEqual([2])
  })
  test('monotonicity', () => {
    expect(linear.monotonicity(linear.make(0, 1))).toBe(Monotonicity.Increasing)
    expect(linear.monotonicity(linear.make(0, -1))).toBe(Monotonicity.Decreasing)
    expect(linear.monotonicity(linear.make(0, 0))).toBe(Monotonicity.Constant)
  })
  test('antiderivative', () => {
    expect(linear.antiderivative(linear.make(0, 1), 2)).toBeCloseToValue(quadratic.make(2, 0, 0.5))
  })
  test('domain', () => {
    const line = linear.make(0, 1)
    const result = linear.domain(line, interval.make(0, 1))
    expect(result).toHaveLength(1)
    expect([...result][0]).toBeCloseToValue(interval.make(0, 1))
  })
  test('range', () => {
    expect(linear.range(linear.make(0, 1), interval.make(0, 2))).toBeCloseToValue(
      interval.make(0, 2),
    )
  })
  test('unitRange evaluates over [0, 1]', () => {
    // p(t) = 3 + 2t  →  [3, 5] on [0, 1]
    expect(linear.unitRange(linear.make(3, 2))).toBeCloseToValue(interval.make(3, 5))
    // p(t) = 5 - 2t  →  same range, fromMinMax normalizes order
    expect(linear.unitRange(linear.make(5, -2))).toBeCloseToValue(interval.make(3, 5))
  })
  test('length', () => {
    const l = linear.make(0, 2)
    expect(linear.length(l, interval.make(0, 1))).toBeCloseTo(Math.sqrt(5), 10)
  })
  test('coefficients', () => {
    expect(linear.coefficients(linear.make(3, 7))).toEqual([3, 7])
  })
})

describe('quadratic', () => {
  test('make', () => {
    expect(quadratic.make(0, 1, 2)).toMatchObject({ c0: 0, c1: 1, c2: 2 })
  })
  test('fromVector', () => {
    expect(quadratic.fromVector(vector3.make(0, 1, 2))).toMatchObject({
      c0: 0,
      c1: 1,
      c2: 2,
    })
  })
  test('fromPoints interpolates a known parabola', () => {
    // y = x² + 2x + 3, sampled at x = -1, 0, 1.
    const p = quadratic.fromPoints(vector2.make(-1, 2), vector2.make(0, 3), vector2.make(1, 6))
    expect(p.c0).toBeCloseTo(3, 10)
    expect(p.c1).toBeCloseTo(2, 10)
    expect(p.c2).toBeCloseTo(1, 10)
  })
  test('fromPoints recovers exact polynomial values at sample points', () => {
    const p = quadratic.fromPoints(vector2.make(-2, 7), vector2.make(1, -2), vector2.make(3, 18))
    expect(quadratic.solve(p, -2)).toBeCloseTo(7, 10)
    expect(quadratic.solve(p, 1)).toBeCloseTo(-2, 10)
    expect(quadratic.solve(p, 3)).toBeCloseTo(18, 10)
  })
  test('solve', () => {
    expect(quadratic.solve(quadratic.make(0, 1, 2), 0)).toBe(0)
    expect(quadratic.solve(quadratic.make(0, 1, 2), 1)).toBe(3)
    expect(quadratic.solve(quadratic.make(0, 1, 2), 2)).toBe(10)
  })
  test('toSolver', () => {
    const solver = quadratic.toSolver(quadratic.make(0, 1, 2))
    expect(solver(0)).toBe(0)
    expect(solver(1)).toBe(3)
    expect(solver(2)).toBe(10)
  })
  test('solveInverse', () => {
    expect([...quadratic.solveInverse(quadratic.make(0, 1, 2), 0)]).toEqual([
      expect.closeTo(-0.5, 10),
      expect.closeTo(0, 10),
    ])
    expect([...quadratic.solveInverse(quadratic.make(0, 1, 2), -0.125)]).toEqual([
      expect.closeTo(-0.25, 10),
    ])
    expect([...quadratic.solveInverse(quadratic.make(0, 1, 2), -0.5)]).toEqual([])
  })
  test('solveInverse finds a tangency the query undershoots by an ulp', () => {
    // (t - 1)² touches zero at t = 1; querying y = -Number.EPSILON makes the
    // raw discriminant -8.9e-16 — noise relative to its ~4-magnitude terms.
    // The relative clamp reports the double root instead of no solution.
    expect([...quadratic.solveInverse(quadratic.make(1, -2, 1), -Number.EPSILON)]).toEqual([
      expect.closeTo(1, 10),
    ])
  })
  test('solveInverse resists cancellation when roots differ wildly in magnitude', () => {
    // t² + 1e8·t + 1: the naive quadratic formula computes the small root as
    // (-1e8 + √(1e16 - 4))/2, cancelling to ~-7.45e-9 — off by 25%. The
    // stable form recovers it through the root product instead.
    const roots = [...quadratic.solveInverse(quadratic.make(1, 1e8, 1), 0)]
    expect(roots[0]).toBeCloseTo(-1e8, 5)
    expect(roots[1]).toBeCloseTo(-1e-8, 15)
  })
  test('toInverseSolver', () => {
    const inverseSolver = quadratic.toInverseSolver(quadratic.make(0, 1, 2))
    expect([...inverseSolver(0)]).toEqual([expect.closeTo(-0.5, 10), expect.closeTo(0, 10)])
    expect([...inverseSolver(-0.125)]).toEqual([expect.closeTo(-0.25, 10)])
    expect([...inverseSolver(-0.5)]).toEqual([])
  })
  test('derivative', () => {
    expect(quadratic.derivative(quadratic.make(0, 1, 2))).toBeCloseToValue(linear.make(1, 4))
  })
  test('roots', () => {
    expect([...quadratic.roots(quadratic.make(0, 1, 2))]).toEqual([
      expect.closeTo(-0.5, 10),
      expect.closeTo(0, 10),
    ])
  })
  test('monotonicity', () => {
    expect(quadratic.monotonicity(quadratic.make(0, 0, 0))).toBe(Monotonicity.Constant)
    expect(quadratic.monotonicity(quadratic.make(0, 1, 0))).toBe(Monotonicity.Increasing)
    expect(quadratic.monotonicity(quadratic.make(0, -1, 0))).toBe(Monotonicity.Decreasing)
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2))).toBe(Monotonicity.None)
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(0, 1))).toBe(
      Monotonicity.Increasing,
    )
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(-2, -1))).toBe(
      Monotonicity.Decreasing,
    )
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(-2, -0.25))).toBe(
      Monotonicity.Decreasing,
    )
    expect(() => quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(-0.25))).toThrow(
      /zero-width interval/,
    )
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(-0.25, 1))).toBe(
      Monotonicity.Increasing,
    )
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(1, 2))).toBe(
      Monotonicity.Increasing,
    )
  })
  test('antiderivative', () => {
    expect(quadratic.antiderivative(quadratic.make(1, 2, 3), 0)).toBeCloseToValue(
      cubic.make(0, 1, 1, 1),
    )
  })
  test('domain', () => {
    const p = quadratic.make(0, 0, 1)
    expect(quadratic.domain(p, interval.make(-2, -1))).toHaveLength(0)

    const at1 = quadratic.domain(p, interval.make(-1, 0))
    expect(at1).toHaveLength(1)
    expect([...at1][0]).toBeCloseToValue(interval.make(0, 0))

    const at2 = quadratic.domain(p, interval.make(-1, 1))
    expect(at2).toHaveLength(1)
    expect([...at2][0]).toBeCloseToValue(interval.make(-1, 1))

    const at3 = quadratic.domain(p, interval.make(0, 1))
    expect(at3).toHaveLength(1)
    expect([...at3][0]).toBeCloseToValue(interval.make(-1, 1))

    const at4 = quadratic.domain(p, interval.make(1, 4))
    expect(at4).toHaveLength(1)
    expect([...at4][0]).toBeCloseToValue(interval.make(-2, 2))
  })
  test('range', () => {
    const p = quadratic.make(0, 0, 1)

    expect(quadratic.range(p, interval.make(-2, -1))).toBeCloseToValue(interval.make(1, 4))
  })
  test('unitRange captures an interior extremum on [0, 1]', () => {
    // p(t) = -4t² + 4t  →  peak at t = 0.5, p(0.5) = 1; endpoints both 0.
    const p = quadratic.make(0, 4, -4)
    expect(quadratic.unitRange(p)).toBeCloseToValue(interval.make(0, 1))
  })
  test('length', () => {
    expect(quadratic.length(quadratic.make(0, 0, 1), interval.unit)).toBeCloseTo(1.47894286, 7)
  })
  test('curvature', () => {
    expect(quadratic.curvature(quadratic.make(0, 0, 1), 0)).toBe(2)
  })
  test('coefficients', () => {
    expect(quadratic.coefficients(quadratic.make(3, 5, 7))).toEqual([3, 5, 7])
  })
})

describe('cubic', () => {
  test('make', () => {
    expect(cubic.make(0, 1, 2, 3)).toMatchObject({
      c0: 0,
      c1: 1,
      c2: 2,
      c3: 3,
    })
  })
  test('fromVector', () => {
    expect(cubic.fromVector(vector4.make(0, 1, 2, 3))).toBeCloseToValue(cubic.make(0, 1, 2, 3))
  })
  test('fromPoints interpolates a known cubic', () => {
    // y = x³ - 2x² + x + 1, sampled at x = -1, 0, 1, 2.
    const p = cubic.fromPoints(
      vector2.make(-1, -3),
      vector2.make(0, 1),
      vector2.make(1, 1),
      vector2.make(2, 3),
    )
    expect(p.c0).toBeCloseTo(1, 10)
    expect(p.c1).toBeCloseTo(1, 10)
    expect(p.c2).toBeCloseTo(-2, 10)
    expect(p.c3).toBeCloseTo(1, 10)
  })
  test('fromPoints recovers exact polynomial values at sample points', () => {
    const p = cubic.fromPoints(
      vector2.make(-2, -5),
      vector2.make(0, 1),
      vector2.make(1, 4),
      vector2.make(3, 28),
    )
    expect(cubic.solve(p, -2)).toBeCloseTo(-5, 10)
    expect(cubic.solve(p, 0)).toBeCloseTo(1, 10)
    expect(cubic.solve(p, 1)).toBeCloseTo(4, 10)
    expect(cubic.solve(p, 3)).toBeCloseTo(28, 10)
  })
  test('solve', () => {
    expect(cubic.solve(cubic.make(0, 1, 2, 3), 0)).toBe(0)
    expect(cubic.solve(cubic.make(0, 1, 2, 3), 1)).toBe(6)
    expect(cubic.solve(cubic.make(0, 1, 2, 3), -1)).toBe(-2)
  })
  test('toSolver', () => {
    const solver = cubic.toSolver(cubic.make(0, 1, 2, 3))
    expect(solver(0)).toBe(0)
    expect(solver(1)).toBe(6)
    expect(solver(-1)).toBe(-2)
  })
  test('solveInverse', () => {
    const close = (n: number) => expect.closeTo(n, 10)
    expect([...cubic.solveInverse(cubic.make(0, -1, 0, 1), 0)]).toEqual([
      close(-1),
      close(0),
      close(1),
    ])
    expect([...cubic.solveInverse(cubic.make(0, 0, 1, 1), 0)]).toEqual([close(-1), close(0)])
    expect([...cubic.solveInverse(cubic.make(3, -5, 1, 1), 0)]).toEqual([close(-3), close(1)])
    expect([...cubic.solveInverse(cubic.make(4, 0, 1, 1), 0)]).toEqual([close(-2)])
    expect([...cubic.solveInverse(cubic.make(0, 0, 1, 1), -4)]).toEqual([close(-2)])
    expect([...cubic.solveInverse(cubic.make(0, 0, 0, 1), -1)]).toEqual([close(-1)])
    expect([...cubic.solveInverse(cubic.make(0, 0, 0, 1), 0)]).toEqual([close(0)])
    expect([...cubic.solveInverse(cubic.make(0, 0, 0, 1), 1)]).toEqual([close(1)])
  })
  test('toInverseSolver', () => {
    const close = (n: number) => expect.closeTo(n, 10)
    const inverseSolver = cubic.toInverseSolver(cubic.make(0, -1, 0, 1))
    expect([...inverseSolver(0)]).toEqual([close(-1), close(0), close(1)])
    expect([...inverseSolver(-6)]).toEqual([close(-2)])
    expect([...inverseSolver(6)]).toEqual([close(2)])
  })
  test('derivative', () => {
    expect(cubic.derivative(cubic.make(0, 1, 2, 3))).toBeCloseToValue(quadratic.make(1, 4, 9))
  })
  test('roots', () => {
    const close = (n: number) => expect.closeTo(n, 10)
    expect([...cubic.roots(cubic.make(0, -1, 0, 1))]).toEqual([close(-1), close(0), close(1)])
    expect([...cubic.roots(cubic.make(0, 0, 1, 1))]).toEqual([close(-1), close(0)])
  })
  test('extrema', () => {
    const close = (n: number) => expect.closeTo(n, 10)
    expect([...cubic.extrema(cubic.make(0, 0, 3, 2))]).toEqual([close(-1), close(0)])
  })
  test('monotonicity', () => {
    expect(cubic.monotonicity(cubic.make(0, 0, 0, 0))).toBe(Monotonicity.Constant)
    expect(cubic.monotonicity(cubic.make(0, 1, 0, 0))).toBe(Monotonicity.Increasing)
    expect(cubic.monotonicity(cubic.make(0, -1, 0, 0))).toBe(Monotonicity.Decreasing)
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0))).toBe(Monotonicity.None)
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(0, 1))).toBe(
      Monotonicity.Increasing,
    )
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(-2, -1))).toBe(
      Monotonicity.Decreasing,
    )
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(-2, -0.25))).toBe(
      Monotonicity.Decreasing,
    )
    expect(() => cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(-0.25))).toThrow(
      /zero-width interval/,
    )
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(-0.25, 1))).toBe(
      Monotonicity.Increasing,
    )
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(1, 2))).toBe(
      Monotonicity.Increasing,
    )
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2))).toBe(Monotonicity.None)
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-3, -2))).toBe(
      Monotonicity.Increasing,
    )
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-2, -1))).toBe(
      Monotonicity.Increasing,
    )
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-1.5, -0.5))).toBe(
      Monotonicity.None,
    )
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-1, 0))).toBe(
      Monotonicity.Decreasing,
    )
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-0.5, 0.5))).toBe(
      Monotonicity.None,
    )
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(0.5, 1))).toBe(
      Monotonicity.Increasing,
    )
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(1, 2))).toBe(
      Monotonicity.Increasing,
    )
  })
  test('domain', () => {
    const p = cubic.make(0, -1.5, 0, 0.5)

    expect(cubic.domain(p, interval.make(-3, -2))).toBeCloseToValue(
      interval.make(-2.355301397608, -2.195823345446),
      1e-9,
    )
    expect(cubic.domain(p, interval.make(-2, -1))).toBeCloseToValue(
      interval.make(-2.195823345446, 1),
      1e-9,
    )
    expect(cubic.domain(p, interval.make(-1, 0))).toBeCloseToValue(
      interval.make(-2, 1.732050807569),
      1e-9,
    )
    expect(cubic.domain(p, interval.make(0, 1))).toBeCloseToValue(
      interval.make(-1.732050807569, 2),
      1e-9,
    )
    expect(cubic.domain(p, interval.make(1, 2))).toBeCloseToValue(
      interval.make(-1, 2.195823345446),
      1e-9,
    )
    expect(cubic.domain(p, interval.make(2, 3))).toBeCloseToValue(
      interval.make(2.195823345446, 2.355301397608),
      1e-9,
    )
  })
  test('range', () => {
    const p = cubic.make(0, -1.5, 0, 0.5)
    expect(cubic.range(p, interval.make(-3, -2))).toBeCloseToValue(interval.make(-9, -1))
    expect(cubic.range(p, interval.make(-2, -1))).toBeCloseToValue(interval.make(-1, 1))
    expect(cubic.range(p, interval.make(-1, 0))).toBeCloseToValue(interval.make(0, 1))
  })
  test('unitRange agrees with range over [0, 1]', () => {
    // p(t) = t³ - 1.5t² + 1 — has an extremum inside [0, 1]
    const p = cubic.make(1, 0, -1.5, 1)
    expect(cubic.unitRange(p)).toBeCloseToValue(cubic.range(p, interval.unit))
  })
  test('length', () => {
    const p = cubic.make(0, 100, 200, -300)
    expect(cubic.length(p, interval.unit)).toBeCloseTo(134.62077838, 7)
  })
  test('curvature', () => {
    expect(cubic.curvature(cubic.make(0, 0, 0, 1), 0)).toBe(0)
  })
  test('subdivide: continuity at split point', () => {
    // p(t) = 1 + 2t + 3t² + 4t³ — arbitrary non-degenerate cubic.
    const p = cubic.make(1, 2, 3, 4)
    for (const splitAt of [0.25, 0.5, 0.75]) {
      const [left, right] = cubic.subdivide(p, splitAt)
      // left(1) = right(0) = p(splitAt)
      expect(cubic.solve(left, 1)).toBeCloseTo(cubic.solve(p, splitAt), 10)
      expect(cubic.solve(right, 0)).toBeCloseTo(cubic.solve(p, splitAt), 10)
      // left(0) = p(0), right(1) = p(1)
      expect(cubic.solve(left, 0)).toBeCloseTo(cubic.solve(p, 0), 10)
      expect(cubic.solve(right, 1)).toBeCloseTo(cubic.solve(p, 1), 10)
    }
  })
  test('subdivide: left half reparameterizes p(splitAt · u)', () => {
    const p = cubic.make(1, 2, 3, 4)
    const splitAt = 0.3
    const [left] = cubic.subdivide(p, splitAt)
    for (const u of [0.1, 0.4, 0.7, 0.9]) {
      expect(cubic.solve(left, u)).toBeCloseTo(cubic.solve(p, splitAt * u), 10)
    }
  })
  test('subdivide: right half reparameterizes p(splitAt + (1-splitAt) · u)', () => {
    const p = cubic.make(1, 2, 3, 4)
    const splitAt = 0.3
    const [, right] = cubic.subdivide(p, splitAt)
    for (const u of [0.1, 0.4, 0.7, 0.9]) {
      expect(cubic.solve(right, u)).toBeCloseTo(cubic.solve(p, splitAt + (1 - splitAt) * u), 10)
    }
  })
  test('subdivide: rejects t outside (0, 1)', () => {
    const p = cubic.make(1, 2, 3, 4)
    expect(() => cubic.subdivide(p, 0)).toThrow()
    expect(() => cubic.subdivide(p, 1)).toThrow()
    expect(() => cubic.subdivide(p, -0.1)).toThrow()
    expect(() => cubic.subdivide(p, 1.5)).toThrow()
  })
  test('coefficients', () => {
    expect(cubic.coefficients(cubic.make(2, 3, 5, 7))).toEqual([2, 3, 5, 7])
  })
})
