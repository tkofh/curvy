import { describe, expect, test } from 'vitest'
import {
  computeCubicAntiderivative,
  computeLinearAntiderivative,
  computeQuadraticAntiderivative,
  createCubicPolynomial,
  createLinearPolynomial,
  createQuadraticPolynomial,
} from '../src/polynomial'

const testPrecision = 8

const testDomain = [-10, 10] as const

describe('createLinearPolynomial', () => {
  test('stores coefficients', () => {
    expect(createLinearPolynomial([1, 2], testDomain).coefficients).toEqual([
      1, 2,
    ])
  })

  test('stores domain', () => {
    expect(createLinearPolynomial([1, 2], testDomain).domain).toEqual(
      testDomain,
    )
  })

  test('finds root 0 for [1, 0]', () => {
    const line = createLinearPolynomial([1, 0], testDomain)
    expect(line.root).toBeCloseTo(0, testPrecision)
    expect(line.solve(line.root as number)).toBeCloseTo(0, testPrecision)
  })

  test('finds root -2 for [1, 2]', () => {
    const line = createLinearPolynomial([1, 2], testDomain)
    expect(line.root).toBeCloseTo(-2, testPrecision)
    expect(line.solve(line.root as number)).toBeCloseTo(0, testPrecision)
  })

  test('finds no root for [0, 1]', () => {
    expect(createLinearPolynomial([0, 1], testDomain).root).toBeNull()
  })

  test('finds no root for [0, 0]', () => {
    expect(createLinearPolynomial([0, 0], testDomain).root).toBeNull()
  })

  test('finds no root for [-1, 10] with domain [0, 1]', () => {
    expect(createLinearPolynomial([-1, 10], [0, 1]).root).toBeNull()
  })

  test('throws when solving outside of domain', () => {
    expect(() =>
      createLinearPolynomial([1, 0], testDomain).solve(-11),
    ).toThrow()
  })

  test('finds solution 5 at x=2 for [2, 1]', () => {
    expect(createLinearPolynomial([2, 1], testDomain).solve(2)).toBeCloseTo(
      5,
      testPrecision,
    )
  })

  test('finds solution 0 at x=0 for [1, 0]', () => {
    expect(createLinearPolynomial([1, 0], testDomain).solve(0)).toBeCloseTo(
      0,
      testPrecision,
    )
  })

  test('throws when inverse solving outside of range', () => {
    expect(() =>
      createLinearPolynomial([1, 2], [0, 1]).solveInverse(-3),
    ).toThrow()
  })

  test('finds inverse solution 0 at y=2 for [1, 2]', () => {
    expect(
      createLinearPolynomial([1, 2], testDomain).solveInverse(2),
    ).toBeCloseTo(0, testPrecision)
  })

  test('finds inverse solution -2 at y=0 for [1, 2]', () => {
    expect(
      createLinearPolynomial([1, 2], testDomain).solveInverse(0),
    ).toBeCloseTo(-2, testPrecision)
  })

  test('finds inverse solution 0 at y=2 for [0, 2]', () => {
    expect(
      createLinearPolynomial([0, 2], testDomain).solveInverse(2),
    ).toBeCloseTo(0, testPrecision)
  })
})

describe('createQuadraticPolynomial', () => {
  test('stores coefficients', () => {
    expect(
      createQuadraticPolynomial([1, 2, 3], testDomain).coefficients,
    ).toEqual([1, 2, 3])
  })

  test('finds extreme 1 for [-1, 2, 1]', () => {
    expect(
      createQuadraticPolynomial([-1, 2, 1], testDomain).extreme,
    ).toBeCloseTo(1, testPrecision)
  })

  test('finds no extreme for [0, 2, 1]', () => {
    expect(createQuadraticPolynomial([0, 2, 1], testDomain).extreme).toBeNull()
  })

  test('finds roots [-2] for [0, 1, 2]', () => {
    const parabola = createQuadraticPolynomial([0, 1, 2], testDomain)
    expect(parabola.roots).toHaveLength(1)
    expect(parabola.roots[0]).toBeCloseTo(-2, testPrecision)
    expect(parabola.solve(parabola.roots[0])).toBeCloseTo(0, testPrecision)
  })

  test('finds roots [-1, 4] for [-2, 6, 8]', () => {
    const parabola = createQuadraticPolynomial([-2, 6, 8], testDomain)
    expect(parabola.roots).toHaveLength(2)
    expect(parabola.roots[0]).toBeCloseTo(-1, testPrecision)
    expect(parabola.roots[1]).toBeCloseTo(4, testPrecision)
    expect(parabola.solve(parabola.roots[0])).toEqual(0)
    expect(parabola.solve(parabola.roots[1])).toEqual(0)
  })

  test('finds roots [1, 5] for [1, -6, 5]', () => {
    const parabola = createQuadraticPolynomial([1, -6, 5], testDomain)
    expect(parabola.roots).toHaveLength(2)
    expect(parabola.roots[0]).toBeCloseTo(1, testPrecision)
    expect(parabola.roots[1]).toBeCloseTo(5, testPrecision)
    expect(parabola.solve(parabola.roots[0])).toBeCloseTo(0)
    expect(parabola.solve(parabola.roots[1])).toEqual(0)
  })

  test('finds no roots for [2, -4, 4]', () => {
    expect(createQuadraticPolynomial([2, -4, 4], testDomain).roots).toEqual([])
  })

  test('finds no roots for [0, 0, 3]', () => {
    expect(createQuadraticPolynomial([0, 0, 3], testDomain).roots).toEqual([])
  })

  test('finds the derivative for [2, 4, -3]', () => {
    const parabola = createQuadraticPolynomial([2, 4, -3], testDomain)
    expect(parabola.derivative.coefficients).toHaveLength(2)
    expect(parabola.derivative.coefficients[0]).toBeCloseTo(4, testPrecision)
    expect(parabola.derivative.coefficients[1]).toBeCloseTo(4, testPrecision)
    expect(parabola.extreme).toBeCloseTo(-1, testPrecision)
    expect(parabola.derivative.solve(parabola.extreme as number)).toBeCloseTo(
      0,
      testPrecision,
    )
  })

  test('finds solution -3 at x=2 for [1, -6, 5]', () => {
    expect(
      createQuadraticPolynomial([1, -6, 5], testDomain).solve(2),
    ).toBeCloseTo(-3, testPrecision)
  })

  test('finds solution 0 at x=1 for [1, -6, 5]', () => {
    expect(
      createQuadraticPolynomial([1, -6, 5], testDomain).solve(1),
    ).toBeCloseTo(0, testPrecision)
  })

  test('finds inverse solutions [0, 2] at y=4 for [2, -4, 4]', () => {
    const solution = createQuadraticPolynomial(
      [2, -4, 4],
      testDomain,
    ).solveInverse(4)
    expect(solution).toHaveLength(2)
    expect(solution[0]).toBeCloseTo(0, testPrecision)
    expect(solution[1]).toBeCloseTo(2, testPrecision)
  })

  test('finds inverse solution [-2] at y=-2 for [1, 4, 2]', () => {
    const solution = createQuadraticPolynomial(
      [1, 4, 2],
      testDomain,
    ).solveInverse(-2)
    expect(solution).toHaveLength(1)
    expect(solution[0]).toBeCloseTo(-2, testPrecision)
  })
})

describe('createCubicPolynomial', () => {
  test('stores coefficients', () => {
    expect(
      createCubicPolynomial([1, 2, 3, 4], testDomain).coefficients,
    ).toEqual([1, 2, 3, 4])
  })

  test('finds extrema for [-1, 0, 3, 0]', () => {
    const extrema = createCubicPolynomial([-1, 0, 3, 0], testDomain).extrema
    expect(extrema).toHaveLength(2)
    expect(extrema[0]).toBeCloseTo(-1, testPrecision)
    expect(extrema[1]).toBeCloseTo(1, testPrecision)
  })

  test('finds extrema for [0, -9, 9, 0]', () => {
    const extrema = createCubicPolynomial([0, -9, 9, 0], testDomain).extrema
    expect(extrema).toHaveLength(1)
    expect(extrema[0]).toBeCloseTo(0.5, testPrecision)
  })

  test('finds no extrema for [-1, -1, -1, 0]', () => {
    expect(createCubicPolynomial([-1, -1, -1, 0], testDomain).extrema).toEqual(
      [],
    )
  })

  test('finds no extrema for [2, -3, 1.5, 2] (parabola has single root)', () => {
    expect(createCubicPolynomial([2, -3, 1.5, 2], testDomain).extrema).toEqual(
      [],
    )
  })

  test('finds roots [1.5] for [-4, 0, 3, 9]', () => {
    const cubic = createCubicPolynomial([-4, 0, 3, 9], testDomain)
    expect(cubic.roots).toHaveLength(1)
    expect(cubic.roots[0]).toBeCloseTo(1.5, testPrecision)
    expect(cubic.solve(cubic.roots[0])).toBeCloseTo(0, testPrecision)
  })

  test('finds roots [-1, 0, 1] for [-1, 0, 1, 0]', () => {
    const cubic = createCubicPolynomial([-1, 0, 1, 0], testDomain)
    expect(cubic.roots).toHaveLength(3)
    expect(cubic.roots[0]).toBeCloseTo(-1, testPrecision)
    expect(cubic.roots[1]).toBeCloseTo(0, testPrecision)
    expect(cubic.roots[2]).toBeCloseTo(1, testPrecision)
    expect(cubic.solve(cubic.roots[0])).toBeCloseTo(0, testPrecision)
    expect(cubic.solve(cubic.roots[1])).toBeCloseTo(0, testPrecision)
    expect(cubic.solve(cubic.roots[2])).toBeCloseTo(0, testPrecision)
  })

  test('finds roots [-2, 1] for [-1, 0, 3, -2]', () => {
    const cubic = createCubicPolynomial([-1, 0, 3, -2], testDomain)
    expect(cubic.roots).toHaveLength(2)
    expect(cubic.roots[0]).toBeCloseTo(-2, testPrecision)
    expect(cubic.roots[1]).toBeCloseTo(1, testPrecision)
    expect(cubic.solve(cubic.roots[0])).toBeCloseTo(0, testPrecision)
    expect(cubic.solve(cubic.roots[1])).toBeCloseTo(0, testPrecision)
  })

  test('finds roots [-1, 2] for [-1, 0, 3, 2]', () => {
    const cubic = createCubicPolynomial([-1, 0, 3, 2], testDomain)
    expect(cubic.roots).toHaveLength(2)
    expect(cubic.roots[0]).toBeCloseTo(-1, testPrecision)
    expect(cubic.roots[1]).toBeCloseTo(2, testPrecision)
    expect(cubic.solve(cubic.roots[0])).toBeCloseTo(0, testPrecision)
    expect(cubic.solve(cubic.roots[1])).toBeCloseTo(0, testPrecision)
  })

  test('finds roots [0, 1] for [0, 9, -9, 0]', () => {
    const cubic = createCubicPolynomial([0, 9, -9, 0], testDomain)
    expect(cubic.roots).toHaveLength(2)
    expect(cubic.roots[0]).toBeCloseTo(0, testPrecision)
    expect(cubic.roots[1]).toBeCloseTo(1, testPrecision)
    expect(cubic.solve(cubic.roots[0])).toBeCloseTo(0, testPrecision)
    expect(cubic.solve(cubic.roots[1])).toBeCloseTo(0, testPrecision)
  })

  test('finds the derivative for [2, 0, -2, 0]', () => {
    const cubic = createCubicPolynomial([2, 0, -2, 0], testDomain)
    expect(cubic.derivative.coefficients).toHaveLength(3)
    expect(cubic.derivative.coefficients[0]).toBeCloseTo(6, testPrecision)
    expect(cubic.derivative.coefficients[1]).toBeCloseTo(0, testPrecision)
    expect(cubic.derivative.coefficients[2]).toBeCloseTo(-2, testPrecision)

    expect(cubic.extrema).toHaveLength(2)
    expect(cubic.derivative.solve(cubic.extrema[0])).toBeCloseTo(
      0,
      testPrecision,
    )
    expect(cubic.derivative.solve(cubic.extrema[1])).toBeCloseTo(
      0,
      testPrecision,
    )
  })

  test('finds solution 1 at x=1 for [2, 1, -2, 0]', () => {
    const cubic = createCubicPolynomial([2, 1, -2, 0], testDomain)
    expect(cubic.solve(1)).toBeCloseTo(1, testPrecision)
  })

  test('finds solution 1.5 at x=-0.5 [2, 1, -1, 1]', () => {
    const cubic = createCubicPolynomial([2, 1, -1, 1], testDomain)
    expect(cubic.solve(-0.5)).toBeCloseTo(1.5, testPrecision)
  })

  test('finds inverse solutions [-1, 0, 0.5] at y=1 for [2, 1, -1, 1]', () => {
    const solution = createCubicPolynomial(
      [2, 1, -1, 1],
      testDomain,
    ).solveInverse(1)
    expect(solution).toHaveLength(3)
    expect(solution[0]).toBeCloseTo(-1, testPrecision)
    expect(solution[1]).toBeCloseTo(0, testPrecision)
    expect(solution[2]).toBeCloseTo(0.5, testPrecision)
  })

  test('finds inverse solutions [-2, 1] at y=-1 for [1, 0, -3, 1]', () => {
    const solution = createCubicPolynomial(
      [1, 0, -3, 1],
      testDomain,
    ).solveInverse(-1)
    expect(solution).toHaveLength(2)
    expect(solution[0]).toBeCloseTo(-2, testPrecision)
    expect(solution[1]).toBeCloseTo(1, testPrecision)
  })

  test('finds inverse solution [2] at y=5 for [1, 0, -2, 1]', () => {
    const solution = createCubicPolynomial(
      [1, 0, -2, 1],
      testDomain,
    ).solveInverse(5)
    expect(solution).toHaveLength(1)
    expect(solution[0]).toBeCloseTo(2, testPrecision)
  })
})

describe('computeLinearAntiderivative', () => {
  test('computes antiderivative coefficients for [2, 3]', () => {
    const line = createLinearPolynomial([2, 3], testDomain)
    const integrationConstant = 2
    const parabola = createQuadraticPolynomial(
      computeLinearAntiderivative(line.coefficients, integrationConstant),
      testDomain,
    )
    expect(parabola.coefficients).toEqual([1, 3, integrationConstant])
    expect(parabola.derivative.coefficients).toEqual(line.coefficients)
  })
})

describe('computeQuadraticAntiderivative', () => {
  test('computes antiderivative coefficients for [1, 2, 3]', () => {
    const parabola = createQuadraticPolynomial([6, -6, 1.5])
    const integrationConstant = 2
    const cubic = createCubicPolynomial(
      computeQuadraticAntiderivative(
        parabola.coefficients,
        integrationConstant,
      ),
      testDomain,
    )
    expect(cubic.coefficients).toEqual([2, -3, 1.5, integrationConstant])
    expect(cubic.derivative.coefficients).toEqual(parabola.coefficients)
  })
})

describe('computeCubicAntiderivative', () => {
  test('computes antiderivative coefficients for [8, -3, 4, 1]', () => {
    expect(computeCubicAntiderivative([8, -3, 4, 1], 2)).toEqual([
      2, -1, 2, 1, 2,
    ])
  })
})
