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
  test('solve', () => {
    expect(
      linear2d.solve(
        linear2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
        0.5,
      ),
    ).toEqual(vector2.make(0.5, 1))
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
  test('solve', () => {
    expect(
      quadratic2d.solve(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        0.5,
      ),
    ).toEqual(vector2.make(0.25, -0.25))
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
    ).toEqual(vector2.magnitude(vector2.make(1, 1)))
    expect(
      quadratic2d.length(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        interval.make(0, 0.5),
      ),
    ).toEqual(vector2.magnitude(vector2.make(0.25, 0.25)))
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
  test('solve', () => {
    expect(
      cubic2d.solve(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
        0.5,
      ),
    ).toEqual(vector2.make(0.125, -0.125))
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
    ).toEqual(vector2.magnitude(vector2.make(1, 1)))
    expect(
      cubic2d.length(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
        interval.make(0, 0.5),
      ),
    ).toEqual(vector2.magnitude(vector2.make(0.125, 0.125)))
  })
})
