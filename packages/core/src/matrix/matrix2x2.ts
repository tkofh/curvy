import { PRECISION, invariant, round } from '../util'
import { type Vector2, dot, isVector2, vector2 } from '../vector/vector2'

export type Matrix2x2Coordinate = 0 | 1

const TypeBrand: unique symbol = Symbol.for('curvy/matrix2x2')
type TypeBrand = typeof TypeBrand

class Matrix2x2 {
  readonly [TypeBrand]: TypeBrand = TypeBrand

  readonly m00: number
  readonly m01: number

  readonly m10: number
  readonly m11: number

  readonly precision: number

  constructor(m00 = 0, m01 = 0, m10 = 0, m11 = 0, precision = PRECISION) {
    this.m00 = round(m00, precision)
    this.m01 = round(m01, precision)
    this.m10 = round(m10, precision)
    this.m11 = round(m11, precision)

    this.precision = precision
  }
}
export type { Matrix2x2 }

export function isMatrix2x2(m: unknown): m is Matrix2x2 {
  return typeof m === 'object' && m !== null && TypeBrand in m
}

export function matrix2x2(
  m00 = 0,
  m01 = m00,
  m10 = m01,
  m11 = m10,
  precision = PRECISION,
) {
  return new Matrix2x2(m00, m01, m10, m11, precision)
}

export function fromRows(
  v0: Vector2,
  v1: Vector2,
  precision?: number,
): Matrix2x2 {
  return new Matrix2x2(
    v0.v0,
    v0.v1,
    v1.v0,
    v1.v1,
    precision ?? Math.min(v0.precision, v1.precision),
  )
}

export function fromColumns(
  v0: Vector2,
  v1: Vector2,
  precision?: number,
): Matrix2x2 {
  return new Matrix2x2(
    v0.v0,
    v1.v0,
    v0.v1,
    v1.v1,
    precision ?? Math.min(v0.precision, v1.precision),
  )
}

export function setRow(
  m: Matrix2x2,
  row: Matrix2x2Coordinate,
  v: Vector2 | number,
): Matrix2x2 {
  return fromRows(
    ...(toRows(m).with(row, isVector2(v) ? v : vector2(v)) as [
      Vector2,
      Vector2,
    ]),
  )
}

export function setColumn(
  m: Matrix2x2,
  column: Matrix2x2Coordinate,
  v: Vector2 | number,
): Matrix2x2 {
  return fromColumns(
    ...(toColumns(m).with(column, isVector2(v) ? v : vector2(v)) as [
      Vector2,
      Vector2,
    ]),
  )
}

export function determinant(m: Matrix2x2): number {
  return round(m.m00 * m.m11 - m.m01 * m.m10, m.precision)
}

export function vectorProductLeft(m: Matrix2x2, v: Vector2): Vector2 {
  const [v0, v1] = toRows(m)
  return vector2(dot(v0, v), dot(v1, v), Math.min(m.precision, v.precision))
}

export function vectorProductRight(m: Matrix2x2, v: Vector2): Vector2 {
  const [v0, v1] = toColumns(m)
  return vector2(dot(v, v0), dot(v, v1), Math.min(m.precision, v.precision))
}

export function solveSystem(m: Matrix2x2, v: Vector2): Vector2 {
  const inverseDeterminant = 1 / determinant(m)

  invariant(
    Number.isFinite(inverseDeterminant),
    'cannot solve system when coefficient matrix determinant is zero',
  )

  return vector2(
    determinant(setRow(m, 0, v)) * inverseDeterminant,
    determinant(setRow(m, 1, v)) * inverseDeterminant,
    Math.min(m.precision, v.precision),
  )
}

export function toRows(m: Matrix2x2): [Vector2, Vector2] {
  return [
    vector2(m.m00, m.m01, m.precision),
    vector2(m.m10, m.m11, m.precision),
  ]
}

export function toColumns(m: Matrix2x2): [Vector2, Vector2] {
  return [
    vector2(m.m00, m.m10, m.precision),
    vector2(m.m01, m.m11, m.precision),
  ]
}

export function rowVector(m: Matrix2x2, row: Matrix2x2Coordinate): Vector2 {
  return toRows(m)[row]
}

export function columnVector(
  m: Matrix2x2,
  column: Matrix2x2Coordinate,
): Vector2 {
  return toColumns(m)[column]
}
