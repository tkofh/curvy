import { describe, expect, test } from 'vitest'
import {
  createCubicPolynomial,
  createLinearPolynomial,
  createQuadraticPolynomial,
} from '../src/polynomial'

describe('createLinearPolynomial', () => {
  test('coefficients', () => {
    expect(createLinearPolynomial(1, 2)).toMatchObject({
      c0: 1,
      c1: 2,
    })
  })

  test('roots', () => {
    const line = createLinearPolynomial(0, 1)
    expect(line.root(-10, 10)).toBeCloseTo(0)
    expect(line.solve(0)).toBeCloseTo(0)

    expect(line.root(0, 10)).toBeCloseTo(0)
    expect(line.root(-10, 0)).toBeCloseTo(0)

    expect(line.root(10, 20)).toBeNull()
  })

  test('monotonicity', () => {
    expect(createLinearPolynomial(0, 0).monotonicity).toBe('constant')
    expect(createLinearPolynomial(0, 1).monotonicity).toBe('increasing')
  })

  test('antiderivative', () => {
    expect(createLinearPolynomial(1, 2).antiderivative(0)).toEqual([0, 1, 1])
  })

  test('solve', () => {
    expect(createLinearPolynomial(1, 2).solve(0)).toBeCloseTo(1)
    expect(createLinearPolynomial(1, 2).solve(1)).toBeCloseTo(3)
    expect(createLinearPolynomial(1, 2).solve(2)).toBeCloseTo(5)

    expect(createLinearPolynomial(1, 2).solve(0, 2, 10)).toBeNull()
  })

  test('solveInverse', () => {
    expect(createLinearPolynomial(1, 2).solveInverse(0)).toBeCloseTo(-0.5)
    expect(createLinearPolynomial(1, 2).solveInverse(1)).toBeCloseTo(0)
    expect(createLinearPolynomial(1, 2).solveInverse(2)).toBeCloseTo(0.5)

    expect(createLinearPolynomial(1, 2).solveInverse(0, 0, 10)).toBeNull()
  })
})

describe('createQuadraticPolynomial', () => {
  test('coefficients', () => {
    expect(createQuadraticPolynomial(1, 2, 3)).toMatchObject({
      c0: 1,
      c1: 2,
      c2: 3,
    })
  })

  test('roots', () => {
    const parabola = createQuadraticPolynomial(-1, 1, 2)
    expect(parabola.roots(-10, 10)).toEqual([-1, 0.5])
    expect(parabola.roots(0, 10)).toEqual([0.5])
    expect(parabola.roots(-10, 0)).toEqual([-1])
    expect(parabola.roots(-20, -10)).toEqual([])
    expect(parabola.roots(10, 20)).toEqual([])
  })

  test('extreme', () => {
    const parabola = createQuadraticPolynomial(-1, 0, 2)
    expect(parabola.extrema(-10, 10)).toBeCloseTo(0)
    expect(parabola.extrema(0, 10)).toBeCloseTo(0)
    expect(parabola.extrema(-10, 0)).toBeCloseTo(0)
    expect(parabola.extrema(-20, -10)).toBeNull()
    expect(parabola.extrema(10, 20)).toBeNull()
  })

  test('monotonicity', () => {
    expect(createQuadraticPolynomial(0, 0, 0).monotonicity()).toBe('constant')
    expect(createQuadraticPolynomial(-1, 0, 2).monotonicity()).toBe('none')
    expect(createQuadraticPolynomial(-1, 0, 2).monotonicity(0, 10)).toBe(
      'increasing',
    )
    expect(createQuadraticPolynomial(-1, 0, 2).monotonicity(-10, 0)).toBe(
      'decreasing',
    )
  })

  test('antiderivative', () => {
    expect(createQuadraticPolynomial(1, 2, 3).antiderivative(0)).toEqual([
      0, 1, 1, 1,
    ])
  })

  test('solve', () => {
    expect(createQuadraticPolynomial(-1, 0, 1).solve(-1)).toBeCloseTo(0)
    expect(createQuadraticPolynomial(-1, 0, 1).solve(-0.5)).toBeCloseTo(-0.75)
    expect(createQuadraticPolynomial(-1, 0, 1).solve(0)).toBeCloseTo(-1)
    expect(createQuadraticPolynomial(-1, 0, 1).solve(0.5)).toBeCloseTo(-0.75)
    expect(createQuadraticPolynomial(-1, 0, 1).solve(1)).toBeCloseTo(0)

    expect(createQuadraticPolynomial(-1, 0, 1).solve(0, 0, 10)).toBeNull()
  })

  test('solveInverse', () => {
    expect(createQuadraticPolynomial(-1, 0, 1).solveInverse(-2)).toEqual([])
    expect(createQuadraticPolynomial(-1, 0, 1).solveInverse(-1)).toEqual([0])
    expect(createQuadraticPolynomial(-1, 0, 1).solveInverse(0)).toEqual([-1, 1])

    expect(createQuadraticPolynomial(-1, 0, 1).solveInverse(0, 0, 10)).toEqual([
      1,
    ])
    expect(createQuadraticPolynomial(-1, 0, 1).solveInverse(0, -10, 0)).toEqual(
      [-1],
    )
  })
})

describe('createCubicPolynomial', () => {
  test('coefficients', () => {
    expect(createCubicPolynomial(1, 2, 3, 4)).toMatchObject({
      c0: 1,
      c1: 2,
      c2: 3,
      c3: 4,
    })
  })

  test('roots', () => {
    const polynomial = createCubicPolynomial(0, -1, 0, 1)

    expect(polynomial.roots()).toEqual([-1, 0, 1])
    expect(polynomial.roots(0, 10)).toEqual([0, 1])
    expect(polynomial.roots(-10, 0)).toEqual([-1, 0])
  })

  test('monotonicity', () => {
    expect(createCubicPolynomial(0, -3, 0, 1).monotonicity()).toBe('none')
    expect(createCubicPolynomial(0, -3, 0, 1).monotonicity(-3, -1)).toBe(
      'increasing',
    )
    expect(createCubicPolynomial(0, -3, 0, 1).monotonicity(-2, 0)).toBe('none')
    expect(createCubicPolynomial(0, -3, 0, 1).monotonicity(-1, 1)).toBe(
      'decreasing',
    )
    expect(createCubicPolynomial(0, -3, 0, 1).monotonicity(0, 2)).toBe('none')
    expect(createCubicPolynomial(0, -3, 0, 1).monotonicity(1, 3)).toBe(
      'increasing',
    )
  })

  test('extrema', () => {
    expect(createCubicPolynomial(0, -3, 0, 1).extrema()).toEqual([-1, 1])
    expect(createCubicPolynomial(0, -3, 0, 1).extrema(-4, -2)).toEqual([])
    expect(createCubicPolynomial(0, -3, 0, 1).extrema(-3, -1)).toEqual([-1])
    expect(createCubicPolynomial(0, -3, 0, 1).extrema(-2, 0)).toEqual([-1])
    expect(createCubicPolynomial(0, -3, 0, 1).extrema(-1, 1)).toEqual([-1, 1])
    expect(createCubicPolynomial(0, -3, 0, 1).extrema(0, 2)).toEqual([1])
    expect(createCubicPolynomial(0, -3, 0, 1).extrema(1, 3)).toEqual([1])
    expect(createCubicPolynomial(0, -3, 0, 1).extrema(2, 4)).toEqual([])
  })

  test('solve', () => {
    expect(createCubicPolynomial(0, -3, 0, 1).solve(-2)).toBeCloseTo(-2)
    expect(createCubicPolynomial(0, -3, 0, 1).solve(-1)).toBeCloseTo(2)
    expect(createCubicPolynomial(0, -3, 0, 1).solve(0)).toBeCloseTo(0)
    expect(createCubicPolynomial(0, -3, 0, 1).solve(1)).toBeCloseTo(-2)
    expect(createCubicPolynomial(0, -3, 0, 1).solve(2)).toBeCloseTo(2)

    expect(createCubicPolynomial(0, -3, 0, 1).solve(0, 1, 10)).toBeNull()
  })

  test('solveInverse', () => {
    expect(createCubicPolynomial(0, -3, 0, 1).solveInverse(-18)).toEqual([-3])
    expect(createCubicPolynomial(0, -3, 0, 1).solveInverse(-2)).toEqual([-2, 1])
    expect(createCubicPolynomial(0, -3, 0, 1).solveInverse(2)).toEqual([-1, 2])
    expect(createCubicPolynomial(0, -3, 0, 1).solveInverse(18)).toEqual([3])

    expect(createCubicPolynomial(0, -3, 0, 1).solveInverse(-2, 0, 10)).toEqual([
      1,
    ])
  })
})
