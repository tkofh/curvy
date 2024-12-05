import { describe, expect, test } from 'vitest'
import * as Matrix4x4 from '../src/matrix/matrix4x4'
import * as CubicPath2d from '../src/path/cubic2d'
import * as CubicPolynomial from '../src/polynomial/cubic'
import * as CubicBezierPoints2d from '../src/splines/bezier/points/cubic2d'
import * as Vector2 from '../src/vector/vector2'
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

  expect(CubicPolynomial.solve(polynomial, 0)).toBe(start)
  expect(CubicPolynomial.solve(polynomial, 0.5)).toBe((start + end) / 2)
  expect(CubicPolynomial.solve(polynomial, 1)).toBe(end)
})

describe('bezier', () => {
  test('makes a path', () => {
    const path = CubicBezierPoints2d.make(
      Vector2.make(0, 0),
      Vector2.make(0, 1),
      Vector2.make(1, 0),
      Vector2.make(1, 1),
    ).pipe(
      CubicBezierPoints2d.append(
        Vector2.make(1, 2),
        Vector2.make(2, 1),
        Vector2.make(2, 2),
      ),
      CubicBezierPoints2d.toPath,
    )

    expect(CubicPath2d.solve(path, 0)).toMatchObject(Vector2.make(0, 0))
    expect(CubicPath2d.solve(path, 0.5)).toMatchObject(Vector2.make(1, 1))
    expect(CubicPath2d.solve(path, 1)).toMatchObject(Vector2.make(2, 2))

    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      console.log(CubicPath2d.solve(path, t).toString())
    }
  })
})
