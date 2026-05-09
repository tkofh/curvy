import { describe, expect, test } from 'vitest'
import * as interval from '../src/interval'
import * as cubic from '../src/polynomial/cubic'
import * as linear from '../src/polynomial/linear'
import * as quadratic from '../src/polynomial/quadratic'
import * as vector2 from '../src/vector/vector2'
import * as vector3 from '../src/vector/vector3'
import * as vector4 from '../src/vector/vector4'

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
    expect(linear.solveInverse(linear.make(0, -1), 0)).toBeCloseTo(0, 10)
    expect(linear.solveInverse(linear.make(0, -1), 1)).toBe(-1)
    expect(linear.solveInverse(linear.make(0, -1), 2)).toBe(-2)
  })
  test('toSolver', () => {
    const solver = linear.toSolver(linear.make(0, 1))
    expect(solver(0)).toBe(0)
    expect(solver(1)).toBe(1)
    expect(solver(2)).toBe(2)
  })
  test('toInverseSolver', () => {
    const inverseSolver = linear.toInverseSolver(linear.make(0, -1))
    expect(inverseSolver(0)).toBeCloseTo(0, 10)
    expect(inverseSolver(1)).toBe(-1)
    expect(inverseSolver(2)).toBe(-2)
  })
  test('root', () => {
    expect(linear.root(linear.make(1, 1))).toBe(-1)
    expect(linear.root(linear.make(2, -1))).toBe(2)
  })
  test('monotonicity', () => {
    expect(linear.monotonicity(linear.make(0, 1))).toBe('increasing')
    expect(linear.monotonicity(linear.make(0, -1))).toBe('decreasing')
    expect(linear.monotonicity(linear.make(0, 0))).toBe('constant')
  })
  test('antiderivative', () => {
    expect(linear.antiderivative(linear.make(0, 1), 2)).toBeCloseToValue(quadratic.make(2, 0, 0.5))
  })
  test('domain', () => {
    const line = linear.make(0, 1)
    expect(linear.domain(line, interval.make(0, 1))).toBeCloseToValue(interval.make(0, 1))
  })
  test('range', () => {
    expect(linear.range(linear.make(0, 1), interval.make(0, 2))).toBeCloseToValue(
      interval.make(0, 2),
    )
  })
  test('length', () => {
    const l = linear.make(0, 2)
    expect(linear.length(l, interval.make(0, 1))).toBeCloseTo(Math.sqrt(5), 10)
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
    expect(quadratic.solveInverse(quadratic.make(0, 1, 2), 0)).toEqual([
      expect.closeTo(-0.5, 10),
      expect.closeTo(0, 10),
    ])
    expect(quadratic.solveInverse(quadratic.make(0, 1, 2), -0.125)).toEqual([
      expect.closeTo(-0.25, 10),
    ])
    expect(quadratic.solveInverse(quadratic.make(0, 1, 2), -0.5)).toEqual([])
  })
  test('toInverseSolver', () => {
    const inverseSolver = quadratic.toInverseSolver(quadratic.make(0, 1, 2))
    expect(inverseSolver(0)).toEqual([expect.closeTo(-0.5, 10), expect.closeTo(0, 10)])
    expect(inverseSolver(-0.125)).toEqual([expect.closeTo(-0.25, 10)])
    expect(inverseSolver(-0.5)).toEqual([])
  })
  test('derivative', () => {
    expect(quadratic.derivative(quadratic.make(0, 1, 2))).toBeCloseToValue(linear.make(1, 4))
  })
  test('roots', () => {
    expect(quadratic.roots(quadratic.make(0, 1, 2))).toEqual([
      expect.closeTo(-0.5, 10),
      expect.closeTo(0, 10),
    ])
  })
  test('monotonicity', () => {
    expect(quadratic.monotonicity(quadratic.make(0, 0, 0))).toBe('constant')
    expect(quadratic.monotonicity(quadratic.make(0, 1, 0))).toBe('increasing')
    expect(quadratic.monotonicity(quadratic.make(0, -1, 0))).toBe('decreasing')
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2))).toBe('none')
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(0, 1))).toBe('increasing')
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(-2, -1))).toBe(
      'decreasing',
    )
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(-2, -0.25))).toBe(
      'decreasing',
    )
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(-0.25))).toBe('constant')
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(-0.25, 1))).toBe(
      'increasing',
    )
    expect(quadratic.monotonicity(quadratic.make(0, 1, 2), interval.make(1, 2))).toBe('increasing')
  })
  test('antiderivative', () => {
    expect(quadratic.antiderivative(quadratic.make(1, 2, 3), 0)).toBeCloseToValue(
      cubic.make(0, 1, 1, 1),
    )
  })
  test('domain', () => {
    const p = quadratic.make(0, 0, 1)
    expect(quadratic.domain(p, interval.make(-2, -1))).toEqual(null)

    expect(quadratic.domain(p, interval.make(-1, 0))).toBeCloseToValue(interval.make(0, 0))

    expect(quadratic.domain(p, interval.make(-1, 1))).toBeCloseToValue(interval.make(-1, 1))

    expect(quadratic.domain(p, interval.make(0, 1))).toBeCloseToValue(interval.make(-1, 1))

    expect(quadratic.domain(p, interval.make(1, 4))).toBeCloseToValue(interval.make(-2, 2))
  })
  test('range', () => {
    const p = quadratic.make(0, 0, 1)

    expect(quadratic.range(p, interval.make(-2, -1))).toBeCloseToValue(interval.make(1, 4))
  })
  test('length', () => {
    expect(quadratic.length(quadratic.make(0, 0, 1), interval.unit)).toBeCloseTo(1.47894286, 7)
  })
  test('curvature', () => {
    expect(quadratic.curvature(quadratic.make(0, 0, 1), 0)).toBe(2)
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
    expect(cubic.solveInverse(cubic.make(0, -1, 0, 1), 0)).toEqual([close(-1), close(0), close(1)])
    expect(cubic.solveInverse(cubic.make(0, 0, 1, 1), 0)).toEqual([close(-1), close(0)])
    expect(cubic.solveInverse(cubic.make(3, -5, 1, 1), 0)).toEqual([close(-3), close(1)])
    expect(cubic.solveInverse(cubic.make(4, 0, 1, 1), 0)).toEqual([close(-2)])
    expect(cubic.solveInverse(cubic.make(0, 0, 1, 1), -4)).toEqual([close(-2)])
    expect(cubic.solveInverse(cubic.make(0, 0, 0, 1), -1)).toEqual([close(-1)])
    expect(cubic.solveInverse(cubic.make(0, 0, 0, 1), 0)).toEqual([close(0)])
    expect(cubic.solveInverse(cubic.make(0, 0, 0, 1), 1)).toEqual([close(1)])
  })
  test('toInverseSolver', () => {
    const close = (n: number) => expect.closeTo(n, 10)
    const inverseSolver = cubic.toInverseSolver(cubic.make(0, -1, 0, 1))
    expect(inverseSolver(0)).toEqual([close(-1), close(0), close(1)])
    expect(inverseSolver(-6)).toEqual([close(-2)])
    expect(inverseSolver(6)).toEqual([close(2)])
  })
  test('derivative', () => {
    expect(cubic.derivative(cubic.make(0, 1, 2, 3))).toBeCloseToValue(quadratic.make(1, 4, 9))
  })
  test('roots', () => {
    const close = (n: number) => expect.closeTo(n, 10)
    expect(cubic.roots(cubic.make(0, -1, 0, 1))).toEqual([close(-1), close(0), close(1)])
    expect(cubic.roots(cubic.make(0, 0, 1, 1))).toEqual([close(-1), close(0)])
  })
  test('extrema', () => {
    const close = (n: number) => expect.closeTo(n, 10)
    expect(cubic.extrema(cubic.make(0, 0, 3, 2))).toEqual([close(-1), close(0)])
  })
  test('monotonicity', () => {
    expect(cubic.monotonicity(cubic.make(0, 0, 0, 0))).toBe('constant')
    expect(cubic.monotonicity(cubic.make(0, 1, 0, 0))).toBe('increasing')
    expect(cubic.monotonicity(cubic.make(0, -1, 0, 0))).toBe('decreasing')
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0))).toBe('none')
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(0, 1))).toBe('increasing')
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(-2, -1))).toBe('decreasing')
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(-2, -0.25))).toBe('decreasing')
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(-0.25))).toBe('constant')
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(-0.25, 1))).toBe('increasing')
    expect(cubic.monotonicity(cubic.make(0, 1, 2, 0), interval.make(1, 2))).toBe('increasing')
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2))).toBe('none')
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-3, -2))).toBe('increasing')
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-2, -1))).toBe('increasing')
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-1.5, -0.5))).toBe('none')
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-1, 0))).toBe('decreasing')
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(-0.5, 0.5))).toBe('none')
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(0.5, 1))).toBe('increasing')
    expect(cubic.monotonicity(cubic.make(0, 0, 3, 2), interval.make(1, 2))).toBe('increasing')
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
  test('length', () => {
    const p = cubic.make(0, 100, 200, -300)
    expect(cubic.length(p, interval.unit)).toBeCloseTo(134.62077838, 7)
  })
  test('curvature', () => {
    expect(cubic.curvature(cubic.make(0, 0, 0, 1), 0)).toBe(0)
  })
})
