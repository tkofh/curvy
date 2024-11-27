import { expect, test } from 'vitest'
import * as Matrix4x4 from '../src/matrix/matrix4x4'
import * as CubicPolynomial from '../src/polynomial/cubic'
import * as Vector4 from '../src/vector/vector4'

test('putting it all together', () => {
  const bezier = Matrix4x4.make(
    1,
    0,
    0,
    0,
    -3,
    3,
    0,
    0,
    3,
    -6,
    3,
    0,
    -1,
    3,
    -3,
    1,
  )

  const start = 0
  const end = 10
  const tangent = 20
  const points = Vector4.make(start, start + tangent, end - tangent, end)

  const coefficients = Matrix4x4.vectorProductLeft(bezier, points)

  const polynomial = CubicPolynomial.fromVector(coefficients)

  console.log(polynomial)

  expect(CubicPolynomial.solve(polynomial, 0)).toBe(start)
  expect(CubicPolynomial.solve(polynomial, 0.5)).toBe((start + end) / 2)
  expect(CubicPolynomial.solve(polynomial, 1)).toBe(end)
})
