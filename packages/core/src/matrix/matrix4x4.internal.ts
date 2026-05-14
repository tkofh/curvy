import { toFourDimensionalIndex } from '../dimensions.ts'
import { dual, Pipeable } from '../utils.ts'
import { invariant } from '../utils.ts'
import { epsEquals } from '../number.ts'
import type { Vector4 } from '../vector/vector4.ts'
import * as vector4 from '../vector/vector4.internal.ts'
import type { Matrix3x3 } from './matrix3x3.ts'
import * as matrix3x3 from './matrix3x3.internal.ts'
import type { Matrix4x4, Matrix4x4Coordinate } from './matrix4x4.ts'

export const Matrix4x4TypeId: unique symbol = Symbol.for('curvy/matrix4x4')
export type Matrix4x4TypeId = typeof Matrix4x4TypeId

class Matrix4x4Impl extends Pipeable implements Matrix4x4 {
  readonly [Matrix4x4TypeId]: Matrix4x4TypeId = Matrix4x4TypeId

  readonly m00: number
  readonly m01: number
  readonly m02: number
  readonly m03: number

  readonly m10: number
  readonly m11: number
  readonly m12: number
  readonly m13: number

  readonly m20: number
  readonly m21: number
  readonly m22: number
  readonly m23: number

  readonly m30: number
  readonly m31: number
  readonly m32: number
  readonly m33: number

  constructor(
    m00 = 0,
    m01 = m00,
    m02 = m01,
    m03 = m02,
    m10 = m00,
    m11 = m01,
    m12 = m02,
    m13 = m03,
    m20 = m00,
    m21 = m01,
    m22 = m02,
    m23 = m03,
    m30 = m00,
    m31 = m01,
    m32 = m02,
    m33 = m03,
  ) {
    super()

    this.m00 = m00
    this.m01 = m01
    this.m02 = m02
    this.m03 = m03
    this.m10 = m10
    this.m11 = m11
    this.m12 = m12
    this.m13 = m13
    this.m20 = m20
    this.m21 = m21
    this.m22 = m22
    this.m23 = m23
    this.m30 = m30
    this.m31 = m31
    this.m32 = m32
    this.m33 = m33
  }

  get [Symbol.toStringTag]() {
    return `Matrix4x4(${this.m00}, ${this.m01}, ${this.m02}, ${this.m03}, ${this.m10}, ${this.m11}, ${this.m12}, ${this.m13}, ${this.m20}, ${this.m21}, ${this.m22}, ${this.m23}, ${this.m30}, ${this.m31}, ${this.m32}, ${this.m33})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return `Matrix4x4(${this.m00}, ${this.m01}, ${this.m02}, ${this.m03}, ${this.m10}, ${this.m11}, ${this.m12}, ${this.m13}, ${this.m20}, ${this.m21}, ${this.m22}, ${this.m23}, ${this.m30}, ${this.m31}, ${this.m32}, ${this.m33})`
  }

  [Symbol.hasInstance](m: unknown): m is Matrix4x4 {
    return isMatrix4x4(m)
  }
}

/** @internal */
export const isMatrix4x4 = (m: unknown): m is Matrix4x4 =>
  typeof m === 'object' && m !== null && Matrix4x4TypeId in m

/** @internal */
export const equals = dual<
  (b: Matrix4x4) => (a: Matrix4x4) => boolean,
  (a: Matrix4x4, b: Matrix4x4) => boolean
>(
  2,
  (a: Matrix4x4, b: Matrix4x4) =>
    epsEquals(a.m00, b.m00) &&
    epsEquals(a.m01, b.m01) &&
    epsEquals(a.m02, b.m02) &&
    epsEquals(a.m03, b.m03) &&
    epsEquals(a.m10, b.m10) &&
    epsEquals(a.m11, b.m11) &&
    epsEquals(a.m12, b.m12) &&
    epsEquals(a.m13, b.m13) &&
    epsEquals(a.m20, b.m20) &&
    epsEquals(a.m21, b.m21) &&
    epsEquals(a.m22, b.m22) &&
    epsEquals(a.m23, b.m23) &&
    epsEquals(a.m30, b.m30) &&
    epsEquals(a.m31, b.m31) &&
    epsEquals(a.m32, b.m32) &&
    epsEquals(a.m33, b.m33),
)

/**
 * The 4x4 identity matrix.
 * @internal
 */
export const identity: Matrix4x4 = new Matrix4x4Impl(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)

// first four arguments are the top row
/** @internal */
export const make = (
  m00 = 0,
  m01 = m00,
  m02 = m01,
  m03 = m02,
  m10 = m00,
  m11 = m01,
  m12 = m02,
  m13 = m03,
  m20 = m00,
  m21 = m01,
  m22 = m02,
  m23 = m03,
  m30 = m00,
  m31 = m01,
  m32 = m02,
  m33 = m03,
) =>
  new Matrix4x4Impl(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)

/** @internal */
export const fromRows = (v0: Vector4, v1: Vector4, v2: Vector4, v3: Vector4) =>
  new Matrix4x4Impl(
    v0.x,
    v0.y,
    v0.z,
    v0.w,
    v1.x,
    v1.y,
    v1.z,
    v1.w,
    v2.x,
    v2.y,
    v2.z,
    v2.w,
    v3.x,
    v3.y,
    v3.z,
    v3.w,
  )

/** @internal */
export const fromColumns = (v0: Vector4, v1: Vector4, v2: Vector4, v3: Vector4) =>
  new Matrix4x4Impl(
    v0.x,
    v1.x,
    v2.x,
    v3.x,
    v0.y,
    v1.y,
    v2.y,
    v3.y,
    v0.z,
    v1.z,
    v2.z,
    v3.z,
    v0.w,
    v1.w,
    v2.w,
    v3.w,
  )

/** @internal */
export const setRow = dual<
  (row: Matrix4x4Coordinate, v: Vector4) => (m: Matrix4x4) => Matrix4x4,
  (m: Matrix4x4, row: Matrix4x4Coordinate, v: Vector4) => Matrix4x4
>(3, (m: Matrix4x4, row: Matrix4x4Coordinate, v: Vector4) =>
  fromRows(
    ...(toRows(m).with(toFourDimensionalIndex(row), v) as [Vector4, Vector4, Vector4, Vector4]),
  ),
)

/** @internal */
export const setColumn = dual<
  (column: Matrix4x4Coordinate, v: Vector4) => (m: Matrix4x4) => Matrix4x4,
  (m: Matrix4x4, column: Matrix4x4Coordinate, v: Vector4) => Matrix4x4
>(3, (m: Matrix4x4, column: Matrix4x4Coordinate, v: Vector4) =>
  fromColumns(
    ...(toColumns(m).with(toFourDimensionalIndex(column), v) as [
      Vector4,
      Vector4,
      Vector4,
      Vector4,
    ]),
  ),
)

/** @internal */
export const determinant = (m: Matrix4x4) =>
  m.m00 * matrix3x3.determinant(minor(m, 0, 0)) -
  m.m01 * matrix3x3.determinant(minor(m, 0, 1)) +
  m.m02 * matrix3x3.determinant(minor(m, 0, 2)) -
  m.m03 * matrix3x3.determinant(minor(m, 0, 3))

/** @internal */
export const minor = dual<
  (row: Matrix4x4Coordinate, column: Matrix4x4Coordinate) => (m: Matrix4x4) => Matrix3x3,
  (m: Matrix4x4, row: Matrix4x4Coordinate, column: Matrix4x4Coordinate) => Matrix3x3
>(3, (m: Matrix4x4, row: Matrix4x4Coordinate, column: Matrix4x4Coordinate) => {
  const [v0, v1, v2] = toRows(m).toSpliced(toFourDimensionalIndex(row), 1) as [
    Vector4,
    Vector4,
    Vector4,
  ]
  const columnIndex = toFourDimensionalIndex(column)
  const [m00, m01, m02] = vector4.components(v0).toSpliced(columnIndex, 1) as [
    number,
    number,
    number,
  ]
  const [m10, m11, m12] = vector4.components(v1).toSpliced(columnIndex, 1) as [
    number,
    number,
    number,
  ]
  const [m20, m21, m22] = vector4.components(v2).toSpliced(columnIndex, 1) as [
    number,
    number,
    number,
  ]

  return matrix3x3.make(m00, m01, m02, m10, m11, m12, m20, m21, m22)
})

/** @internal */
export const vectorProductLeft = dual<
  (v: Vector4) => (m: Matrix4x4) => Vector4,
  (m: Matrix4x4, v: Vector4) => Vector4
>(2, (m: Matrix4x4, v: Vector4) => {
  const [v0, v1, v2, v3] = toRows(m) as [Vector4, Vector4, Vector4, Vector4]
  return vector4.make(
    vector4.dot(v0, v),
    vector4.dot(v1, v),
    vector4.dot(v2, v),
    vector4.dot(v3, v),
  )
})

/** @internal */
export const vectorProductRight = dual<
  (v: Vector4) => (m: Matrix4x4) => Vector4,
  (m: Matrix4x4, v: Vector4) => Vector4
>(2, (m: Matrix4x4, v: Vector4) => {
  const [v0, v1, v2, v3] = toColumns(m) as [Vector4, Vector4, Vector4, Vector4]

  return vector4.make(
    vector4.dot(v, v0),
    vector4.dot(v, v1),
    vector4.dot(v, v2),
    vector4.dot(v, v3),
  )
})

/** @internal */
export const multiply = dual<
  (b: Matrix4x4) => (a: Matrix4x4) => Matrix4x4,
  (a: Matrix4x4, b: Matrix4x4) => Matrix4x4
>(
  2,
  (a: Matrix4x4, b: Matrix4x4) =>
    new Matrix4x4Impl(
      a.m00 * b.m00 + a.m01 * b.m10 + a.m02 * b.m20 + a.m03 * b.m30,
      a.m00 * b.m01 + a.m01 * b.m11 + a.m02 * b.m21 + a.m03 * b.m31,
      a.m00 * b.m02 + a.m01 * b.m12 + a.m02 * b.m22 + a.m03 * b.m32,
      a.m00 * b.m03 + a.m01 * b.m13 + a.m02 * b.m23 + a.m03 * b.m33,
      a.m10 * b.m00 + a.m11 * b.m10 + a.m12 * b.m20 + a.m13 * b.m30,
      a.m10 * b.m01 + a.m11 * b.m11 + a.m12 * b.m21 + a.m13 * b.m31,
      a.m10 * b.m02 + a.m11 * b.m12 + a.m12 * b.m22 + a.m13 * b.m32,
      a.m10 * b.m03 + a.m11 * b.m13 + a.m12 * b.m23 + a.m13 * b.m33,
      a.m20 * b.m00 + a.m21 * b.m10 + a.m22 * b.m20 + a.m23 * b.m30,
      a.m20 * b.m01 + a.m21 * b.m11 + a.m22 * b.m21 + a.m23 * b.m31,
      a.m20 * b.m02 + a.m21 * b.m12 + a.m22 * b.m22 + a.m23 * b.m32,
      a.m20 * b.m03 + a.m21 * b.m13 + a.m22 * b.m23 + a.m23 * b.m33,
      a.m30 * b.m00 + a.m31 * b.m10 + a.m32 * b.m20 + a.m33 * b.m30,
      a.m30 * b.m01 + a.m31 * b.m11 + a.m32 * b.m21 + a.m33 * b.m31,
      a.m30 * b.m02 + a.m31 * b.m12 + a.m32 * b.m22 + a.m33 * b.m32,
      a.m30 * b.m03 + a.m31 * b.m13 + a.m32 * b.m23 + a.m33 * b.m33,
    ),
)

/** @internal */
export const inverse = (m: Matrix4x4): Matrix4x4 => {
  const det = determinant(m)
  invariant(det !== 0, 'cannot invert singular matrix')

  const inv = 1 / det
  // adjugate is the transpose of the cofactor matrix
  const cof = (row: Matrix4x4Coordinate, col: Matrix4x4Coordinate) => {
    const sign = ((row as number) + (col as number)) % 2 === 0 ? 1 : -1
    return sign * matrix3x3.determinant(minor(m, row, col)) * inv
  }

  return new Matrix4x4Impl(
    cof(0, 0),
    cof(1, 0),
    cof(2, 0),
    cof(3, 0),
    cof(0, 1),
    cof(1, 1),
    cof(2, 1),
    cof(3, 1),
    cof(0, 2),
    cof(1, 2),
    cof(2, 2),
    cof(3, 2),
    cof(0, 3),
    cof(1, 3),
    cof(2, 3),
    cof(3, 3),
  )
}

/** @internal */
export const solveSystem = dual<
  (v: Vector4) => (m: Matrix4x4) => Vector4,
  (m: Matrix4x4, v: Vector4) => Vector4
>(2, (m: Matrix4x4, v: Vector4) => {
  const inverseDeterminant = 1 / determinant(m)

  invariant(
    Number.isFinite(inverseDeterminant),
    'cannot solve system when coefficient matrix determinant is zero',
  )

  return vector4.make(
    determinant(setColumn(m, 0, v)) * inverseDeterminant,
    determinant(setColumn(m, 1, v)) * inverseDeterminant,
    determinant(setColumn(m, 2, v)) * inverseDeterminant,
    determinant(setColumn(m, 3, v)) * inverseDeterminant,
  )
})

/** @internal */
export const toRows = (m: Matrix4x4) =>
  [
    vector4.make(m.m00, m.m01, m.m02, m.m03),
    vector4.make(m.m10, m.m11, m.m12, m.m13),
    vector4.make(m.m20, m.m21, m.m22, m.m23),
    vector4.make(m.m30, m.m31, m.m32, m.m33),
  ] as const

/** @internal */
export const toColumns = (m: Matrix4x4) =>
  [
    vector4.make(m.m00, m.m10, m.m20, m.m30),
    vector4.make(m.m01, m.m11, m.m21, m.m31),
    vector4.make(m.m02, m.m12, m.m22, m.m32),
    vector4.make(m.m03, m.m13, m.m23, m.m33),
  ] as const

/** @internal */
export const rowVector = dual<
  (row: Matrix4x4Coordinate) => (m: Matrix4x4) => Vector4,
  (m: Matrix4x4, row: Matrix4x4Coordinate) => Vector4
>(2, (m: Matrix4x4, row: Matrix4x4Coordinate) => toRows(m)[toFourDimensionalIndex(row)])

/** @internal */
export const columnVector = dual<
  (column: Matrix4x4Coordinate) => (m: Matrix4x4) => Vector4,
  (m: Matrix4x4, column: Matrix4x4Coordinate) => Vector4
>(2, (m: Matrix4x4, column: Matrix4x4Coordinate) => toColumns(m)[toFourDimensionalIndex(column)])

/** @internal */
export const transpose = (m: Matrix4x4) => fromColumns(...toRows(m)) as Matrix4x4

/** @internal */
export const reverseRows = (m: Matrix4x4) => {
  const [v0, v1, v2, v3] = toRows(m) as [Vector4, Vector4, Vector4, Vector4]
  return fromRows(v3, v2, v1, v0)
}

/** @internal */
export const reverseColumns = (m: Matrix4x4) => {
  const [v0, v1, v2, v3] = toColumns(m) as [Vector4, Vector4, Vector4, Vector4]
  return fromColumns(v3, v2, v1, v0)
}
