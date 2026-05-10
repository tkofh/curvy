import { describe, expect, test } from 'vitest'
import * as cubic2d from '../src/curve/cubic2d'
import * as linear2d from '../src/curve/linear2d'
import * as quadratic2d from '../src/curve/quadratic2d'
import * as interval from '../src/interval'
import * as cubicPolynomial from '../src/polynomial/cubic'
import * as linearPolynomial from '../src/polynomial/linear'
import * as quadraticPolynomial from '../src/polynomial/quadratic'
import * as vector2 from '../src/vector/vector2'

describe('linear2d', () => {
  test('make', () => {
    const c0 = linearPolynomial.make(0, 1)
    const c1 = linearPolynomial.make(1, 0)

    expect(linear2d.fromPolynomials(c0, c1)).toMatchObject({
      x: c0,
      y: c1,

      [0]: c0,
      [1]: c1,
    })
  })
  test('isLinearCurve2d', () => {
    expect(
      linear2d.isLinearCurve2d(
        linear2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
      ),
    ).toBe(true)
  })
  test('fromCoefficients packs coefficient vectors into per-axis polynomials', () => {
    const c = linear2d.fromCoefficients(vector2.make(1, 2), vector2.make(3, 4))
    expect(c.x).toMatchObject({ c0: 1, c1: 3 })
    expect(c.y).toMatchObject({ c0: 2, c1: 4 })
  })
  test('fromBezierPoints reproduces the line at t=0 and t=1', () => {
    const c = linear2d.fromBezierPoints(vector2.make(2, 3), vector2.make(7, 11))
    expect(linear2d.solve(c, 0)).toBeCloseToValue(vector2.make(2, 3))
    expect(linear2d.solve(c, 1)).toBeCloseToValue(vector2.make(7, 11))
  })
  test('solve', () => {
    expect(
      linear2d.solve(
        linear2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
        0.5,
      ),
    ).toBeCloseToValue(vector2.make(0.5, 1))
  })
  test('length', () => {
    expect(
      linear2d.length(
        linear2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(0, 1)),
        interval.make(0, 1),
      ),
    ).toBeCloseTo(Math.sqrt(2))
  })
})

describe('quadratic2d', () => {
  test('make', () => {
    const c0 = quadraticPolynomial.make(0, 0, 1)
    const c1 = quadraticPolynomial.make(0, 0, -1)

    expect(quadratic2d.fromPolynomials(c0, c1)).toMatchObject({
      x: c0,
      y: c1,
      [0]: c0,
      [1]: c1,
    })
  })
  test('isQuadraticCurve2d', () => {
    expect(
      quadratic2d.isQuadraticCurve2d(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
      ),
    ).toBe(true)
  })
  test('fromCoefficients packs coefficient vectors into per-axis polynomials', () => {
    const c = quadratic2d.fromCoefficients(
      vector2.make(1, 2),
      vector2.make(3, 4),
      vector2.make(5, 6),
    )
    expect(c.x).toMatchObject({ c0: 1, c1: 3, c2: 5 })
    expect(c.y).toMatchObject({ c0: 2, c1: 4, c2: 6 })
  })
  test('fromBezierPoints reproduces the curve at t=0, t=0.5, t=1', () => {
    const p0 = vector2.make(0, 0)
    const p1 = vector2.make(2, 4)
    const p2 = vector2.make(4, 0)
    const c = quadratic2d.fromBezierPoints(p0, p1, p2)
    expect(quadratic2d.solve(c, 0)).toBeCloseToValue(p0)
    // Bezier at t=0.5 is (p0 + 2·p1 + p2) / 4 = (2, 2)
    expect(quadratic2d.solve(c, 0.5)).toBeCloseToValue(vector2.make(2, 2))
    expect(quadratic2d.solve(c, 1)).toBeCloseToValue(p2)
  })
  test('solve', () => {
    expect(
      quadratic2d.solve(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        0.5,
      ),
    ).toBeCloseToValue(vector2.make(0.25, -0.25))
  })
  test('length', () => {
    expect(
      quadratic2d.length(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        interval.make(0, 1),
      ),
    ).toBeCloseTo(vector2.magnitude(vector2.make(1, 1)), 10)
    expect(
      quadratic2d.length(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        interval.make(0, 0.5),
      ),
    ).toBeCloseTo(vector2.magnitude(vector2.make(0.25, 0.25)), 10)
  })
})

describe('cubic2d', () => {
  test('make', () => {
    const c0 = cubicPolynomial.make(0, 0, 0, 1)
    const c1 = cubicPolynomial.make(0, 0, 0, -1)

    expect(cubic2d.fromPolynomials(c0, c1)).toMatchObject({
      x: c0,
      y: c1,
      [0]: c0,
      [1]: c1,
    })
  })
  test('isCubicCurve2d', () => {
    expect(
      cubic2d.isCubicCurve2d(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
      ),
    ).toBe(true)
  })
  test('fromCoefficients packs coefficient vectors into per-axis polynomials', () => {
    const c = cubic2d.fromCoefficients(
      vector2.make(1, 2),
      vector2.make(3, 4),
      vector2.make(5, 6),
      vector2.make(7, 8),
    )
    expect(c.x).toMatchObject({ c0: 1, c1: 3, c2: 5, c3: 7 })
    expect(c.y).toMatchObject({ c0: 2, c1: 4, c2: 6, c3: 8 })
  })
  test('fromBezierPoints reproduces endpoints exactly and midpoint geometrically', () => {
    const p0 = vector2.make(0, 0)
    const p1 = vector2.make(0, 1)
    const p2 = vector2.make(1, 1)
    const p3 = vector2.make(1, 0)
    const c = cubic2d.fromBezierPoints(p0, p1, p2, p3)
    expect(cubic2d.solve(c, 0)).toBeCloseToValue(p0)
    expect(cubic2d.solve(c, 1)).toBeCloseToValue(p3)
    // Bezier at t=0.5 is (p0 + 3·p1 + 3·p2 + p3) / 8 = (0.5, 0.75)
    expect(cubic2d.solve(c, 0.5)).toBeCloseToValue(vector2.make(0.5, 0.75))
  })
  test('solve', () => {
    expect(
      cubic2d.solve(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
        0.5,
      ),
    ).toBeCloseToValue(vector2.make(0.125, -0.125))
  })
  test('length', () => {
    expect(
      cubic2d.length(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
        interval.make(0, 1),
      ),
    ).toBeCloseTo(vector2.magnitude(vector2.make(1, 1)), 10)
    expect(
      cubic2d.length(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
        interval.make(0, 0.5),
      ),
    ).toBeCloseTo(vector2.magnitude(vector2.make(0.125, 0.125)), 10)
  })
})
