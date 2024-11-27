import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import { PRECISION, invariant, round } from '../util'
import type { Vector2 } from '../vector/vector2'
import * as vector2 from '../vector/vector2.internal'
import type { Matrix2x2, Matrix2x2Coordinate } from './matrix2x2'

export const Matrix2x2TypeBrand: unique symbol = Symbol.for('curvy/matrix2x2')
export type Matrix2x2TypeBrand = typeof Matrix2x2TypeBrand

class Matrix2x2Impl extends Pipeable implements Matrix2x2 {
  readonly [Matrix2x2TypeBrand]: Matrix2x2TypeBrand = Matrix2x2TypeBrand

  readonly m00: number
  readonly m01: number

  readonly m10: number
  readonly m11: number

  readonly precision: number

  constructor(m00 = 0, m01 = 0, m10 = 0, m11 = 0, precision = PRECISION) {
    super()
    this.m00 = round(m00, precision)
    this.m01 = round(m01, precision)
    this.m10 = round(m10, precision)
    this.m11 = round(m11, precision)

    this.precision = precision
  }

  get [Symbol.toStringTag]() {
    return `Matrix2x2(${this.m00}, ${this.m01}, ${this.m10}, ${this.m11})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return `Matrix2x2(${this.m00}, ${this.m01}, ${this.m10}, ${this.m11})`
  }

  [Symbol.hasInstance](m: unknown): m is Matrix2x2 {
    return isMatrix2x2(m)
  }
}

export const isMatrix2x2 = (m: unknown): m is Matrix2x2 =>
  typeof m === 'object' && m !== null && Matrix2x2TypeBrand in m

export const make = (
  m00 = 0,
  m01 = m00,
  m10 = m01,
  m11 = m10,
  precision = PRECISION,
) => new Matrix2x2Impl(m00, m01, m10, m11, precision)

export const fromRows = (v0: Vector2, v1: Vector2, precision?: number) =>
  new Matrix2x2Impl(
    v0.v0,
    v0.v1,
    v1.v0,
    v1.v1,
    precision ?? Math.min(v0.precision, v1.precision),
  )

export const fromColumns = (v0: Vector2, v1: Vector2, precision?: number) =>
  new Matrix2x2Impl(
    v0.v0,
    v1.v0,
    v0.v1,
    v1.v1,
    precision ?? Math.min(v0.precision, v1.precision),
  )

export const setRow = dual<
  (row: Matrix2x2Coordinate, v: Vector2) => (m: Matrix2x2) => Matrix2x2,
  (m: Matrix2x2, row: Matrix2x2Coordinate, v: Vector2) => Matrix2x2
>(3, (m: Matrix2x2, row: Matrix2x2Coordinate, v: Vector2) =>
  fromRows(...(toRows(m).with(row, v) as [Vector2, Vector2])),
)

export const setColumn = dual<
  (column: Matrix2x2Coordinate, v: Vector2) => (m: Matrix2x2) => Matrix2x2,
  (m: Matrix2x2, column: Matrix2x2Coordinate, v: Vector2) => Matrix2x2
>(3, (m: Matrix2x2, column: Matrix2x2Coordinate, v: Vector2) =>
  fromColumns(...(toColumns(m).with(column, v) as [Vector2, Vector2])),
)

export const determinant = (m: Matrix2x2): number =>
  round(m.m00 * m.m11 - m.m01 * m.m10, m.precision)

export const vectorProductLeft = dual<
  (v: Vector2) => (m: Matrix2x2) => Vector2,
  (m: Matrix2x2, v: Vector2) => Vector2
>(2, (m: Matrix2x2, v: Vector2) =>
  vector2.make(
    vector2.dot(rowVector(m, 0), v),
    vector2.dot(rowVector(m, 1), v),
    Math.min(m.precision, v.precision),
  ),
)

export const vectorProductRight = dual<
  (v: Vector2) => (m: Matrix2x2) => Vector2,
  (m: Matrix2x2, v: Vector2) => Vector2
>(2, (m: Matrix2x2, v: Vector2) =>
  vector2.make(
    vector2.dot(columnVector(m, 0), v),
    vector2.dot(columnVector(m, 1), v),
    Math.min(m.precision, v.precision),
  ),
)

export const solveSystem = dual<
  (v: Vector2) => (m: Matrix2x2) => Vector2,
  (m: Matrix2x2, v: Vector2) => Vector2
>(2, (m: Matrix2x2, v: Vector2) => {
  const inverseDeterminant = 1 / determinant(m)

  invariant(
    Number.isFinite(inverseDeterminant),
    'cannot solve system when coefficient matrix determinant is zero',
  )

  return vector2.make(
    determinant(setColumn(m, 0, v)) * inverseDeterminant,
    determinant(setColumn(m, 1, v)) * inverseDeterminant,
    Math.min(m.precision, v.precision),
  )
})

export const toRows = (m: Matrix2x2): [Vector2, Vector2] => [
  vector2.make(m.m00, m.m01, m.precision),
  vector2.make(m.m10, m.m11, m.precision),
]

export const toColumns = (m: Matrix2x2): [Vector2, Vector2] => [
  vector2.make(m.m00, m.m10, m.precision),
  vector2.make(m.m01, m.m11, m.precision),
]

export const rowVector = dual<
  (row: Matrix2x2Coordinate) => (m: Matrix2x2) => Vector2,
  (m: Matrix2x2, row: Matrix2x2Coordinate) => Vector2
>(2, (m: Matrix2x2, row: Matrix2x2Coordinate) => toRows(m)[row])

export const columnVector = dual<
  (column: Matrix2x2Coordinate) => (m: Matrix2x2) => Vector2,
  (m: Matrix2x2, column: Matrix2x2Coordinate) => Vector2
>(2, (m: Matrix2x2, column: Matrix2x2Coordinate) => toColumns(m)[column])

export const transpose = (m: Matrix2x2) => fromColumns(...toRows(m))

export const reverseRows = (m: Matrix2x2) => {
  const [r0, r1] = toRows(m)
  return fromRows(r1, r0)
}

export const reverseColumns = (m: Matrix2x2) => {
  const [c0, c1] = toColumns(m)
  return fromColumns(c1, c0)
}
