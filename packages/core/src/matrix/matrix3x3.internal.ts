import { toThreeDimensionalIndex } from '../dimensions.ts'
import { dual, Pipeable } from '../utils.ts'
import { invariant } from '../utils.ts'
import { epsEquals } from '../number.ts'
import type { Vector3 } from '../vector/vector3.ts'
import * as vector3 from '../vector/vector3.internal.ts'
import type { Matrix2x2 } from './matrix2x2.ts'
import * as matrix2x2 from './matrix2x2.internal.ts'
import type { Matrix3x3, Matrix3x3Coordinate } from './matrix3x3.ts'

export const Matrix3x3TypeId: unique symbol = Symbol.for('curvy/matrix3x3')
export type Matrix3x3TypeId = typeof Matrix3x3TypeId

class Matrix3x3Impl extends Pipeable implements Matrix3x3 {
  readonly [Matrix3x3TypeId]: Matrix3x3TypeId = Matrix3x3TypeId

  readonly m00: number
  readonly m01: number
  readonly m02: number

  readonly m10: number
  readonly m11: number
  readonly m12: number

  readonly m20: number
  readonly m21: number
  readonly m22: number

  constructor(m00 = 0, m01 = 0, m02 = 0, m10 = 0, m11 = 0, m12 = 0, m20 = 0, m21 = 0, m22 = 0) {
    super()
    this.m00 = m00
    this.m01 = m01
    this.m02 = m02
    this.m10 = m10
    this.m11 = m11
    this.m12 = m12
    this.m20 = m20
    this.m21 = m21
    this.m22 = m22
  }

  get [Symbol.toStringTag]() {
    return `Matrix3x3(${this.m00}, ${this.m01}, ${this.m02}, ${this.m10}, ${this.m11}, ${this.m12}, ${this.m20}, ${this.m21}, ${this.m22})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return `Matrix3x3(${this.m00}, ${this.m01}, ${this.m02}, ${this.m10}, ${this.m11}, ${this.m12}, ${this.m20}, ${this.m21}, ${this.m22})`
  }

  [Symbol.hasInstance](m: unknown): m is Matrix3x3 {
    return isMatrix3x3(m)
  }
}

export type { Matrix3x3 }

/** @internal */
export const isMatrix3x3 = (m: unknown): m is Matrix3x3 =>
  typeof m === 'object' && m !== null && Matrix3x3TypeId in m

/** @internal */
export const equals = dual<
  (b: Matrix3x3) => (a: Matrix3x3) => boolean,
  (a: Matrix3x3, b: Matrix3x3) => boolean
>(
  2,
  (a: Matrix3x3, b: Matrix3x3) =>
    epsEquals(a.m00, b.m00) &&
    epsEquals(a.m01, b.m01) &&
    epsEquals(a.m02, b.m02) &&
    epsEquals(a.m10, b.m10) &&
    epsEquals(a.m11, b.m11) &&
    epsEquals(a.m12, b.m12) &&
    epsEquals(a.m20, b.m20) &&
    epsEquals(a.m21, b.m21) &&
    epsEquals(a.m22, b.m22),
)

/** @internal */
export const make = (
  m00 = 0,
  m01 = m00,
  m02 = m01,
  m10 = m02,
  m11 = m10,
  m12 = m11,
  m20 = m12,
  m21 = m20,
  m22 = m21,
): Matrix3x3 => {
  return new Matrix3x3Impl(m00, m01, m02, m10, m11, m12, m20, m21, m22)
}

/** @internal */
export const fromRows = (v0: Vector3, v1: Vector3, v2: Vector3): Matrix3x3 =>
  new Matrix3x3Impl(v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)

/** @internal */
export const fromColumns = (v0: Vector3, v1: Vector3, v2: Vector3): Matrix3x3 =>
  new Matrix3x3Impl(v0.x, v1.x, v2.x, v0.y, v1.y, v2.y, v0.z, v1.z, v2.z)

/** @internal */
export const setRow = dual<
  (row: Matrix3x3Coordinate, v: Vector3) => (m: Matrix3x3) => Matrix3x3,
  (m: Matrix3x3, row: Matrix3x3Coordinate, v: Vector3) => Matrix3x3
>(3, (m: Matrix3x3, row: Matrix3x3Coordinate, v: Vector3) =>
  fromRows(...(toRows(m).with(toThreeDimensionalIndex(row), v) as [Vector3, Vector3, Vector3])),
)

/** @internal */
export const setColumn = dual<
  (column: Matrix3x3Coordinate, v: Vector3) => (m: Matrix3x3) => Matrix3x3,
  (m: Matrix3x3, column: Matrix3x3Coordinate, v: Vector3) => Matrix3x3
>(3, (m: Matrix3x3, column: Matrix3x3Coordinate, v: Vector3) =>
  fromColumns(
    ...(toColumns(m).with(toThreeDimensionalIndex(column), v) as [Vector3, Vector3, Vector3]),
  ),
)

/** @internal */
export const determinant = (m: Matrix3x3) =>
  m.m00 * matrix2x2.determinant(minor(m, 0, 0)) -
  m.m01 * matrix2x2.determinant(minor(m, 0, 1)) +
  m.m02 * matrix2x2.determinant(minor(m, 0, 2))

/** @internal */
export const minor = dual<
  (row: Matrix3x3Coordinate, column: Matrix3x3Coordinate) => (m: Matrix3x3) => Matrix2x2,
  (m: Matrix3x3, row: Matrix3x3Coordinate, column: Matrix3x3Coordinate) => Matrix2x2
>(3, (m: Matrix3x3, row: Matrix3x3Coordinate, column: Matrix3x3Coordinate) => {
  const [v0, v1] = toRows(m).toSpliced(toThreeDimensionalIndex(row), 1) as [Vector3, Vector3]
  const columnIndex = toThreeDimensionalIndex(column)
  const [m00, m01] = vector3.components(v0).toSpliced(columnIndex, 1) as [number, number]
  const [m10, m11] = vector3.components(v1).toSpliced(columnIndex, 1) as [number, number]

  return matrix2x2.make(m00, m01, m10, m11) as Matrix2x2
})

/** @internal */
export const vectorProductLeft = dual<
  (v: Vector3) => (m: Matrix3x3) => Vector3,
  (m: Matrix3x3, v: Vector3) => Vector3
>(2, (m: Matrix3x3, v: Vector3) => {
  const [v0, v1, v2] = toRows(m) as [Vector3, Vector3, Vector3]
  return vector3.make(vector3.dot(v0, v), vector3.dot(v1, v), vector3.dot(v2, v))
})

/** @internal */
export const vectorProductRight = dual<
  (v: Vector3) => (m: Matrix3x3) => Vector3,
  (m: Matrix3x3, v: Vector3) => Vector3
>(2, (m: Matrix3x3, v: Vector3) => {
  const [v0, v1, v2] = toColumns(m) as [Vector3, Vector3, Vector3]
  return vector3.make(vector3.dot(v, v0), vector3.dot(v, v1), vector3.dot(v, v2))
})

/** @internal */
export const solveSystem = dual<
  (v: Vector3) => (m: Matrix3x3) => Vector3,
  (m: Matrix3x3, v: Vector3) => Vector3
>(2, (m: Matrix3x3, v: Vector3) => {
  const inverseDeterminant = 1 / determinant(m)

  invariant(
    Number.isFinite(inverseDeterminant),
    'cannot solve system when coefficient matrix determinant is zero',
  )

  return vector3.make(
    determinant(setColumn(m, 0, v)) * inverseDeterminant,
    determinant(setColumn(m, 1, v)) * inverseDeterminant,
    determinant(setColumn(m, 2, v)) * inverseDeterminant,
  )
})

/** @internal */
export const toRows = (m: Matrix3x3): [Vector3, Vector3, Vector3] => [
  vector3.make(m.m00, m.m01, m.m02),
  vector3.make(m.m10, m.m11, m.m12),
  vector3.make(m.m20, m.m21, m.m22),
]

/** @internal */
export const toColumns = (m: Matrix3x3): [Vector3, Vector3, Vector3] => [
  vector3.make(m.m00, m.m10, m.m20),
  vector3.make(m.m01, m.m11, m.m21),
  vector3.make(m.m02, m.m12, m.m22),
]

/** @internal */
export const rowVector = dual<
  (row: Matrix3x3Coordinate) => (m: Matrix3x3) => Vector3,
  (m: Matrix3x3, row: Matrix3x3Coordinate) => Vector3
>(2, (m: Matrix3x3, row: Matrix3x3Coordinate) => toRows(m)[toThreeDimensionalIndex(row)])

/** @internal */
export const columnVector = dual<
  (column: Matrix3x3Coordinate) => (m: Matrix3x3) => Vector3,
  (m: Matrix3x3, column: Matrix3x3Coordinate) => Vector3
>(2, (m: Matrix3x3, column: Matrix3x3Coordinate) => toColumns(m)[toThreeDimensionalIndex(column)])

/** @internal */
export const transpose = (m: Matrix3x3) => fromColumns(...toRows(m))

/** @internal */
export const reverseRows = (m: Matrix3x3) => {
  const [v0, v1, v2] = toRows(m)
  return fromRows(v2, v1, v0)
}

/** @internal */
export const reverseColumns = (m: Matrix3x3) => {
  const [v0, v1, v2] = toColumns(m)
  return fromColumns(v2, v1, v0)
}
