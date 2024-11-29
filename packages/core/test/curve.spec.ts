import { describe, expect, test } from 'vitest'
import * as curve2d from '../src/curve/curve2d'
import * as linearPolynomial from '../src/polynomial/linear'
import * as vector2 from '../src/vector/vector2'

describe('curve2d', () => {
  test('make', () => {
    const c0 = linearPolynomial.make(0, 1)
    const c1 = linearPolynomial.make(1, 0)

    expect(curve2d.make(c0, c1)).toMatchObject({
      c0,
      c1,
    })
  })
  test('isCurve2d', () => {
    expect(
      curve2d.isCurve2d(
        curve2d.make(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
      ),
    ).toBe(true)
  })
  test('solve', () => {
    expect(
      curve2d.solve(
        curve2d.make(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
        0.5,
      ),
    ).toEqual(vector2.make(0.5, 1))
  })
})
