import { describe, expect, test } from 'vitest'
import * as linear2d from '../src/curve/linear2d'
import * as quadratic2d from '../src/curve/quadratic2d'
import * as interval from '../src/interval'
import * as linearPolynomial from '../src/polynomial/linear'
import * as quadraticPolynomial from '../src/polynomial/quadratic'
import * as vector2 from '../src/vector/vector2'

describe('linear2d', () => {
  test('make', () => {
    const c0 = linearPolynomial.make(0, 1)
    const c1 = linearPolynomial.make(1, 0)

    expect(linear2d.make(c0, c1)).toMatchObject({
      c0,
      c1,
    })
  })
  test('isLinearCurve2d', () => {
    expect(
      linear2d.isLinearCurve2d(
        linear2d.make(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
      ),
    ).toBe(true)
  })
  test('solve', () => {
    expect(
      linear2d.solve(
        linear2d.make(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
        0.5,
      ),
    ).toEqual(vector2.make(0.5, 1))
  })
  test('length', () => {
    expect(
      linear2d.length(
        linear2d.make(linearPolynomial.make(0, 1), linearPolynomial.make(0, 1)),
        interval.make(0, 1),
      ),
    ).toBeCloseTo(Math.sqrt(2))
  })
})

describe('quadratic2d', () => {
  test('make', () => {
    const c0 = quadraticPolynomial.make(0, 0, 1)
    const c1 = quadraticPolynomial.make(0, 0, -1)

    expect(quadratic2d.make(c0, c1)).toMatchObject({
      c0,
      c1,
    })
  })
  test('isQuadraticCurve2d', () => {
    expect(
      quadratic2d.isQuadraticCurve2d(
        quadratic2d.make(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
      ),
    ).toBe(true)
  })
  test('solve', () => {
    expect(
      quadratic2d.solve(
        quadratic2d.make(
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
        quadratic2d.make(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        interval.make(0, 1),
      ),
    ).toEqual(vector2.magnitude(vector2.make(1, 1)))
    expect(
      quadratic2d.length(
        quadratic2d.make(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        interval.make(0, 0.5),
      ),
    ).toEqual(vector2.magnitude(vector2.make(0.25, 0.25)))
  })
})
