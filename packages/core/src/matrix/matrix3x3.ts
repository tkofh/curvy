import { PRECISION, invariant, round } from '../util'
import { type Vector3, components, dot, vector3 } from '../vector/vector3'
import {
  type Matrix2x2,
  matrix2x2,
  determinant as matrix2x2Determinant,
} from './matrix2x2'

export type Matrix3x3Coordinate = 0 | 1 | 2

const TypeBrand: unique symbol = Symbol.for('curvy/matrix3x3')
type TypeBrand = typeof TypeBrand

class Matrix3x3 {
  readonly [TypeBrand]: TypeBrand = TypeBrand

  readonly m00: number
  readonly m01: number
  readonly m02: number

  readonly m10: number
  readonly m11: number
  readonly m12: number

  readonly m20: number
  readonly m21: number
  readonly m22: number

  readonly precision: number

  constructor(
    m00 = 0,
    m01 = 0,
    m02 = 0,
    m10 = 0,
    m11 = 0,
    m12 = 0,
    m20 = 0,
    m21 = 0,
    m22 = 0,
    precision = PRECISION,
  ) {
    this.m00 = round(m00, precision)
    this.m01 = round(m01, precision)
    this.m02 = round(m02, precision)
    this.m10 = round(m10, precision)
    this.m11 = round(m11, precision)
    this.m12 = round(m12, precision)
    this.m20 = round(m20, precision)
    this.m21 = round(m21, precision)
    this.m22 = round(m22, precision)

    this.precision = precision
  }
}

export type { Matrix3x3 }

export function isMatrix3x3(m: unknown): m is Matrix3x3 {
  return typeof m === 'object' && m !== null && TypeBrand in m
}

export function matrix3x3(
  m00 = 0,
  m01 = m00,
  m02 = m01,
  m10 = m02,
  m11 = m10,
  m12 = m11,
  m20 = m12,
  m21 = m20,
  m22 = m21,
  precision = PRECISION,
): Matrix3x3 {
  return new Matrix3x3(m00, m01, m02, m10, m11, m12, m20, m21, m22, precision)
}

export function fromRows(
  v0: Vector3,
  v1: Vector3,
  v2: Vector3,
  precision?: number,
): Matrix3x3 {
  return new Matrix3x3(
    v0.v0,
    v0.v1,
    v0.v2,
    v1.v0,
    v1.v1,
    v1.v2,
    v2.v0,
    v2.v1,
    v2.v2,
    precision ?? Math.min(v0.precision, v1.precision, v2.precision),
  )
}

export function fromColumns(
  v0: Vector3,
  v1: Vector3,
  v2: Vector3,
  precision?: number,
): Matrix3x3 {
  return new Matrix3x3(
    v0.v0,
    v1.v0,
    v2.v0,
    v0.v1,
    v1.v1,
    v2.v1,
    v0.v2,
    v1.v2,
    v2.v2,
    precision ?? Math.min(v0.precision, v1.precision, v2.precision),
  )
}

export function setRow(
  m: Matrix3x3,
  row: Matrix3x3Coordinate,
  v: Vector3,
): Matrix3x3 {
  return fromRows(...(toRows(m).with(row, v) as [Vector3, Vector3, Vector3]))
}

export function setColumn(
  m: Matrix3x3,
  column: Matrix3x3Coordinate,
  v: Vector3,
): Matrix3x3 {
  return fromColumns(
    ...(toColumns(m).with(column, v) as [Vector3, Vector3, Vector3]),
  )
}

export function determinant(m: Matrix3x3): number {
  return round(
    m.m00 * matrix2x2Determinant(minor(m, 0, 0)) -
      m.m01 * matrix2x2Determinant(minor(m, 0, 1)) +
      m.m02 * matrix2x2Determinant(minor(m, 0, 2)),
    m.precision,
  )
}

export function minor(
  m: Matrix3x3,
  row: Matrix3x3Coordinate,
  column: Matrix3x3Coordinate,
): Matrix2x2 {
  const [v0, v1] = toRows(m).toSpliced(row, 1) as [Vector3, Vector3]
  const [m00, m01] = components(v0).toSpliced(column, 1) as [number, number]
  const [m10, m11] = components(v1).toSpliced(column, 1) as [number, number]

  return matrix2x2(m00, m01, m10, m11, m.precision)
}

export function vectorProductLeft(m: Matrix3x3, v: Vector3): Vector3 {
  const [v0, v1, v2] = toRows(m)
  return vector3(
    dot(v0, v),
    dot(v1, v),
    dot(v2, v),
    Math.min(m.precision, v.precision),
  )
}

export function vectorProductRight(m: Matrix3x3, v: Vector3): Vector3 {
  const [v0, v1, v2] = toColumns(m)
  return vector3(
    dot(v, v0),
    dot(v, v1),
    dot(v, v2),
    Math.min(m.precision, v.precision),
  )
}

export function toRows(m: Matrix3x3): [Vector3, Vector3, Vector3] {
  return [
    vector3(m.m00, m.m01, m.m02, m.precision),
    vector3(m.m10, m.m11, m.m12, m.precision),
    vector3(m.m20, m.m21, m.m22, m.precision),
  ]
}

export function toColumns(m: Matrix3x3): [Vector3, Vector3, Vector3] {
  return [
    vector3(m.m00, m.m10, m.m20, m.precision),
    vector3(m.m01, m.m11, m.m21, m.precision),
    vector3(m.m02, m.m12, m.m22, m.precision),
  ]
}

export function solveSystem(m: Matrix3x3, v: Vector3): Vector3 {
  const inverseDeterminant = 1 / determinant(m)

  invariant(
    Number.isFinite(inverseDeterminant),
    'cannot solve system when coefficient matrix determinant is zero',
  )

  return vector3(
    determinant(setRow(m, 0, v)) * inverseDeterminant,
    determinant(setRow(m, 1, v)) * inverseDeterminant,
    determinant(setRow(m, 2, v)) * inverseDeterminant,
  )
}
