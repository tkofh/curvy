import { toFourDimensionalIndex } from '../dimensions'
import { Pipeable } from '../pipe'
import { dual } from '../pipe'
import { invariant, round } from '../utils'
import type { Vector4 } from '../vector/vector4'
import * as vector4 from '../vector/vector4.internal'
import type { Matrix3x3 } from './matrix3x3'
import * as matrix3x3 from './matrix3x3.internal'
import type { Matrix4x4, Matrix4x4Coordinate } from './matrix4x4'

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

    this.m00 = round(m00)
    this.m01 = round(m01)
    this.m02 = round(m02)
    this.m03 = round(m03)
    this.m10 = round(m10)
    this.m11 = round(m11)
    this.m12 = round(m12)
    this.m13 = round(m13)
    this.m20 = round(m20)
    this.m21 = round(m21)
    this.m22 = round(m22)
    this.m23 = round(m23)
    this.m30 = round(m30)
    this.m31 = round(m31)
    this.m32 = round(m32)
    this.m33 = round(m33)
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

export const isMatrix4x4 = (m: unknown): m is Matrix4x4 =>
  typeof m === 'object' && m !== null && Matrix4x4TypeId in m

// first four arguments are the top row
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
  new Matrix4x4Impl(
    m00,
    m01,
    m02,
    m03,
    m10,
    m11,
    m12,
    m13,
    m20,
    m21,
    m22,
    m23,
    m30,
    m31,
    m32,
    m33,
  )

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

export const fromColumns = (
  v0: Vector4,
  v1: Vector4,
  v2: Vector4,
  v3: Vector4,
) =>
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

export const setRow = dual<
  (row: Matrix4x4Coordinate, v: Vector4) => (m: Matrix4x4) => Matrix4x4,
  (m: Matrix4x4, row: Matrix4x4Coordinate, v: Vector4) => Matrix4x4
>(3, (m: Matrix4x4, row: Matrix4x4Coordinate, v: Vector4) =>
  fromRows(
    ...(toRows(m).with(toFourDimensionalIndex(row), v) as [
      Vector4,
      Vector4,
      Vector4,
      Vector4,
    ]),
  ),
)

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

export const determinant = (m: Matrix4x4) =>
  round(
    m.m00 * matrix3x3.determinant(minor(m, 0, 0)) -
      m.m01 * matrix3x3.determinant(minor(m, 0, 1)) +
      m.m02 * matrix3x3.determinant(minor(m, 0, 2)) -
      m.m03 * matrix3x3.determinant(minor(m, 0, 3)),
  )

export const minor = dual<
  (
    row: Matrix4x4Coordinate,
    column: Matrix4x4Coordinate,
  ) => (m: Matrix4x4) => Matrix3x3,
  (
    m: Matrix4x4,
    row: Matrix4x4Coordinate,
    column: Matrix4x4Coordinate,
  ) => Matrix3x3
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

export const toRows = (m: Matrix4x4) =>
  [
    vector4.make(m.m00, m.m01, m.m02, m.m03),
    vector4.make(m.m10, m.m11, m.m12, m.m13),
    vector4.make(m.m20, m.m21, m.m22, m.m23),
    vector4.make(m.m30, m.m31, m.m32, m.m33),
  ] as const

export const toColumns = (m: Matrix4x4) =>
  [
    vector4.make(m.m00, m.m10, m.m20, m.m30),
    vector4.make(m.m01, m.m11, m.m21, m.m31),
    vector4.make(m.m02, m.m12, m.m22, m.m32),
    vector4.make(m.m03, m.m13, m.m23, m.m33),
  ] as const

export const rowVector = dual<
  (row: Matrix4x4Coordinate) => (m: Matrix4x4) => Vector4,
  (m: Matrix4x4, row: Matrix4x4Coordinate) => Vector4
>(
  2,
  (m: Matrix4x4, row: Matrix4x4Coordinate) =>
    toRows(m)[toFourDimensionalIndex(row)],
)

export const columnVector = dual<
  (column: Matrix4x4Coordinate) => (m: Matrix4x4) => Vector4,
  (m: Matrix4x4, column: Matrix4x4Coordinate) => Vector4
>(
  2,
  (m: Matrix4x4, column: Matrix4x4Coordinate) =>
    toColumns(m)[toFourDimensionalIndex(column)],
)

export const transpose = (m: Matrix4x4) =>
  fromColumns(...toRows(m)) as Matrix4x4

export const reverseRows = (m: Matrix4x4) => {
  const [v0, v1, v2, v3] = toRows(m) as [Vector4, Vector4, Vector4, Vector4]
  return fromRows(v3, v2, v1, v0)
}

export const reverseColumns = (m: Matrix4x4) => {
  const [v0, v1, v2, v3] = toColumns(m) as [Vector4, Vector4, Vector4, Vector4]
  return fromColumns(v3, v2, v1, v0)
}
