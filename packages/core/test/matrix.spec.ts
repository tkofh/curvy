import { describe, expect, test } from 'vitest'
import * as matrix2x2 from '../src/matrix/matrix2x2'
import * as matrix3x3 from '../src/matrix/matrix3x3'
import * as matrix4x4 from '../src/matrix/matrix4x4'
import { round } from '../src/util'
import * as vector2 from '../src/vector/vector2'
import * as vector3 from '../src/vector/vector3'
import * as vector4 from '../src/vector/vector4'

describe('matrix2x2', () => {
  test('make', () => {
    expect(matrix2x2.matrix2x2(1, 2, 3, 4)).toMatchObject({
      m00: 1,
      m01: 2,
      m10: 3,
      m11: 4,
    })
    expect(matrix2x2.matrix2x2(1.555, 0, 0, 0)).toMatchObject({
      m00: 1.56,
      m01: 0,
      m10: 0,
      m11: 0,
    })
  })

  test('fromRows', () => {
    expect(
      matrix2x2.fromRows(vector2.make(1, 2), vector2.make(3, 4)),
    ).toMatchObject({
      m00: 1,
      m01: 2,
      m10: 3,
      m11: 4,
    })
  })

  test('fromColumns', () => {
    expect(
      matrix2x2.fromColumns(vector2.make(1, 2), vector2.make(3, 4)),
    ).toMatchObject({
      m00: 1,
      m01: 3,
      m10: 2,
      m11: 4,
    })
  })

  test('isMatrix2x2', () => {
    expect(matrix2x2.isMatrix2x2(matrix2x2.matrix2x2(1, 2, 3, 4))).toBe(true)
    expect(matrix2x2.isMatrix2x2({ m00: 1, m01: 2, m10: 3, m11: 4 })).toBe(
      false,
    )
  })

  test('determinant', () => {
    expect(matrix2x2.determinant(matrix2x2.matrix2x2(1, 2, 3, 4))).toBe(-2)
  })

  test('vectorProductLeft', () => {
    expect(
      matrix2x2.vectorProductLeft(
        matrix2x2.matrix2x2(1, 2, 3, 4),
        vector2.make(1, 2),
      ),
    ).toEqual(vector2.make(5, 11))
  })

  test('vectorProductRight', () => {
    expect(
      matrix2x2.vectorProductRight(
        matrix2x2.matrix2x2(1, 2, 3, 4),
        vector2.make(1, 2),
      ),
    ).toEqual(vector2.make(7, 10))
  })

  test('solveSystem', () => {
    const solution = vector2.make(1, 2)
    const coefficients = matrix2x2.matrix2x2(1, 2, 3, 4)

    const result = matrix2x2.solveSystem(coefficients, solution)

    expect(
      result.v0 * coefficients.m00 + result.v1 * coefficients.m01,
    ).toBeCloseTo(solution.v0)
    expect(
      result.v0 * coefficients.m10 + result.v1 * coefficients.m11,
    ).toBeCloseTo(solution.v1)
  })

  test('toRows', () => {
    expect(matrix2x2.toRows(matrix2x2.matrix2x2(1, 2, 3, 4))).toEqual([
      vector2.make(1, 2),
      vector2.make(3, 4),
    ])
  })

  test('toColumns', () => {
    expect(matrix2x2.toColumns(matrix2x2.matrix2x2(1, 2, 3, 4))).toEqual([
      vector2.make(1, 3),
      vector2.make(2, 4),
    ])
  })

  test('rowVector', () => {
    expect(matrix2x2.rowVector(matrix2x2.matrix2x2(1, 2, 3, 4), 0)).toEqual(
      vector2.make(1, 2),
    )
  })

  test('columnVector', () => {
    expect(matrix2x2.columnVector(matrix2x2.matrix2x2(1, 2, 3, 4), 0)).toEqual(
      vector2.make(1, 3),
    )
  })
})

describe('matrix3x3', () => {
  test('make', () => {
    expect(matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9)).toMatchObject({
      m00: 1,
      m01: 2,
      m02: 3,
      m10: 4,
      m11: 5,
      m12: 6,
      m20: 7,
      m21: 8,
      m22: 9,
    })
  })

  test('isMatrix3x3', () => {
    expect(
      matrix3x3.isMatrix3x3(matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9)),
    ).toBe(true)

    expect(
      matrix3x3.isMatrix3x3({
        m00: 1,
        m01: 2,
        m02: 3,
        m10: 4,
        m11: 5,
        m12: 6,
        m20: 7,
        m21: 8,
        m22: 9,
      }),
    ).toBe(false)
  })

  test('fromRows', () => {
    expect(
      matrix3x3.fromRows(
        vector3.make(1, 2, 3),
        vector3.make(4, 5, 6),
        vector3.make(7, 8, 9),
      ),
    ).toMatchObject({
      m00: 1,
      m01: 2,
      m02: 3,
      m10: 4,
      m11: 5,
      m12: 6,
      m20: 7,
      m21: 8,
      m22: 9,
    })
  })

  test('fromColumns', () => {
    expect(
      matrix3x3.fromColumns(
        vector3.make(1, 2, 3),
        vector3.make(4, 5, 6),
        vector3.make(7, 8, 9),
      ),
    ).toMatchObject({
      m00: 1,
      m01: 4,
      m02: 7,
      m10: 2,
      m11: 5,
      m12: 8,
      m20: 3,
      m21: 6,
      m22: 9,
    })
  })

  test('determinant', () => {
    expect(
      matrix3x3.determinant(matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9)),
    ).toBe(0)
  })

  test('minor', () => {
    expect(
      matrix3x3.minor(matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9), 0, 1),
    ).toEqual(matrix2x2.matrix2x2(4, 6, 7, 9))
  })

  test('vectorProductLeft', () => {
    expect(
      matrix3x3.vectorProductLeft(
        matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9),
        vector3.make(1, 2, 3),
      ),
    ).toEqual(vector3.make(14, 32, 50))
  })

  test('vectorProductRight', () => {
    expect(
      matrix3x3.vectorProductRight(
        matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9),
        vector3.make(1, 2, 3),
      ),
    ).toEqual(vector3.make(30, 36, 42))
  })

  test('solveSystem', () => {
    const solution = vector3.make(1, 2, 3)
    const coefficients = matrix3x3.matrix3x3(1, 0, 1, 0, 2, 0, 0, 0, 1)

    const result = matrix3x3.solveSystem(coefficients, solution)

    expect(
      round(
        result.v0 * coefficients.m00 +
          result.v1 * coefficients.m01 +
          result.v2 * coefficients.m02,
      ),
    ).toEqual(solution.v0)
    expect(
      round(
        result.v0 * coefficients.m10 +
          result.v1 * coefficients.m11 +
          result.v2 * coefficients.m12,
      ),
    ).toEqual(solution.v1)
    expect(
      round(
        result.v0 * coefficients.m20 +
          result.v1 * coefficients.m21 +
          result.v2 * coefficients.m22,
      ),
    ).toEqual(solution.v2)
  })

  test('toRows', () => {
    expect(
      matrix3x3.toRows(matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9)),
    ).toEqual([
      vector3.make(1, 2, 3),
      vector3.make(4, 5, 6),
      vector3.make(7, 8, 9),
    ])
  })

  test('toColumns', () => {
    expect(
      matrix3x3.toColumns(matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9)),
    ).toEqual([
      vector3.make(1, 4, 7),
      vector3.make(2, 5, 8),
      vector3.make(3, 6, 9),
    ])
  })

  test('rowVector', () => {
    expect(
      matrix3x3.rowVector(matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9), 0),
    ).toEqual(vector3.make(1, 2, 3))
  })

  test('columnVector', () => {
    expect(
      matrix3x3.columnVector(matrix3x3.matrix3x3(1, 2, 3, 4, 5, 6, 7, 8, 9), 0),
    ).toEqual(vector3.make(1, 4, 7))
  })
})

describe('matrix4x4', () => {
  test('make', () => {
    expect(
      matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
    ).toMatchObject({
      m00: 1,
      m01: 2,
      m02: 3,
      m03: 4,
      m10: 5,
      m11: 6,
      m12: 7,
      m13: 8,
      m20: 9,
      m21: 10,
      m22: 11,
      m23: 12,
      m30: 13,
      m31: 14,
      m32: 15,
      m33: 16,
    })
  })

  test('isMatrix4x4', () => {
    expect(matrix4x4.isMatrix4x4(matrix4x4.make(0))).toBe(true)
    expect(
      matrix4x4.isMatrix4x4({
        m00: 0,
        m01: 0,
        m02: 0,
        m03: 0,
        m10: 0,
        m11: 0,
        m12: 0,
        m13: 0,
        m20: 0,
        m21: 0,
        m22: 0,
        m23: 0,
        m30: 0,
        m31: 0,
        m32: 0,
        m33: 0,
      }),
    ).toBe(false)
  })

  test('fromRows', () => {
    expect(
      matrix4x4.fromRows(
        vector4.make(1, 2, 3, 4),
        vector4.make(5, 6, 7, 8),
        vector4.make(9, 10, 11, 12),
        vector4.make(13, 14, 15, 16),
      ),
    ).toMatchObject({
      m00: 1,
      m01: 2,
      m02: 3,
      m03: 4,
      m10: 5,
      m11: 6,
      m12: 7,
      m13: 8,
      m20: 9,
      m21: 10,
      m22: 11,
      m23: 12,
      m30: 13,
      m31: 14,
      m32: 15,
      m33: 16,
    })
  })

  test('fromColumns', () => {
    expect(
      matrix4x4.fromColumns(
        vector4.make(1, 2, 3, 4),
        vector4.make(5, 6, 7, 8),
        vector4.make(9, 10, 11, 12),
        vector4.make(13, 14, 15, 16),
      ),
    ).toMatchObject({
      m00: 1,
      m01: 5,
      m02: 9,
      m03: 13,
      m10: 2,
      m11: 6,
      m12: 10,
      m13: 14,
      m20: 3,
      m21: 7,
      m22: 11,
      m23: 15,
      m30: 4,
      m31: 8,
      m32: 12,
      m33: 16,
    })
  })

  test('determinant', () => {
    expect(
      matrix4x4.determinant(
        matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
      ),
    ).toBe(0)
  })

  test('minor', () => {
    expect(
      matrix4x4.minor(
        matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
        0,
        1,
      ),
    ).toEqual(matrix3x3.matrix3x3(5, 7, 8, 9, 11, 12, 13, 15, 16))
  })

  test('vectorProductLeft', () => {
    expect(
      matrix4x4.vectorProductLeft(
        matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
        vector4.make(1, 2, 3, 4),
      ),
    ).toEqual(vector4.make(30, 70, 110, 150))
  })

  test('vectorProductRight', () => {
    expect(
      matrix4x4.vectorProductRight(
        matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
        vector4.make(1, 2, 3, 4),
      ),
    ).toEqual(vector4.make(90, 100, 110, 120))
  })

  test('solveSystem', () => {
    const solution = vector4.make(1, 2, 3, 4)
    const coefficients = matrix4x4.make(
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
    )

    const result = matrix4x4.solveSystem(coefficients, solution)

    expect(
      round(
        result.v0 * coefficients.m00 +
          result.v1 * coefficients.m01 +
          result.v2 * coefficients.m02 +
          result.v3 * coefficients.m03,
      ),
    ).toEqual(solution.v0)
    expect(
      round(
        result.v0 * coefficients.m10 +
          result.v1 * coefficients.m11 +
          result.v2 * coefficients.m12 +
          result.v3 * coefficients.m13,
      ),
    ).toEqual(solution.v1)
    expect(
      round(
        result.v0 * coefficients.m20 +
          result.v1 * coefficients.m21 +
          result.v2 * coefficients.m22 +
          result.v3 * coefficients.m23,
      ),
    ).toEqual(solution.v2)
    expect(
      round(
        result.v0 * coefficients.m30 +
          result.v1 * coefficients.m31 +
          result.v2 * coefficients.m32 +
          result.v3 * coefficients.m33,
      ),
    ).toEqual(solution.v3)
  })

  test('toRows', () => {
    expect(
      matrix4x4.toRows(
        matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
      ),
    ).toEqual([
      vector4.make(1, 2, 3, 4),
      vector4.make(5, 6, 7, 8),
      vector4.make(9, 10, 11, 12),
      vector4.make(13, 14, 15, 16),
    ])
  })

  test('toColumns', () => {
    expect(
      matrix4x4.toColumns(
        matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
      ),
    ).toEqual([
      vector4.make(1, 5, 9, 13),
      vector4.make(2, 6, 10, 14),
      vector4.make(3, 7, 11, 15),
      vector4.make(4, 8, 12, 16),
    ])
  })

  test('rowVector', () => {
    expect(
      matrix4x4.rowVector(
        matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
        0,
      ),
    ).toEqual(vector4.make(1, 2, 3, 4))
  })

  test('columnVector', () => {
    expect(
      matrix4x4.columnVector(
        matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
        0,
      ),
    ).toEqual(vector4.make(1, 5, 9, 13))
  })
})
