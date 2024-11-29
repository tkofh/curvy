import type { Vector3 } from '../vector/vector3'
import type { Matrix2x2 } from './matrix2x2'
import * as internal from './matrix3x3.internal'
import type { Matrix3x3TypeId } from './matrix3x3.internal'

export type Matrix3x3Coordinate = 0 | 1 | 2

export interface Matrix3x3 {
  readonly [Matrix3x3TypeId]: Matrix3x3TypeId
  readonly m00: number
  readonly m01: number
  readonly m02: number
  readonly m10: number
  readonly m11: number
  readonly m12: number
  readonly m20: number
  readonly m21: number
  readonly m22: number
}

export const isMatrix3x3: (m: unknown) => m is Matrix3x3 = internal.isMatrix3x3

export const matrix3x3: (
  m00?: number,
  m01?: number,
  m02?: number,
  m10?: number,
  m11?: number,
  m12?: number,
  m20?: number,
  m21?: number,
  m22?: number,
) => Matrix3x3 = internal.make

export const fromRows: (v0: Vector3, v1: Vector3, v2: Vector3) => Matrix3x3 =
  internal.fromRows

export const fromColumns: (v0: Vector3, v1: Vector3, v2: Vector3) => Matrix3x3 =
  internal.fromColumns

export const setRow: {
  (m: Matrix3x3, row: Matrix3x3Coordinate, v: Vector3): Matrix3x3
  (row: Matrix3x3Coordinate, v: Vector3): (m: Matrix3x3) => Matrix3x3
} = internal.setRow

export const setColumn: {
  (m: Matrix3x3, column: Matrix3x3Coordinate, v: Vector3): Matrix3x3
  (column: Matrix3x3Coordinate, v: Vector3): (m: Matrix3x3) => Matrix3x3
} = internal.setColumn

export const determinant: (m: Matrix3x3) => number = internal.determinant

export const minor: (
  m: Matrix3x3,
  row: Matrix3x3Coordinate,
  column: Matrix3x3Coordinate,
) => Matrix2x2 = internal.minor

export const vectorProductLeft: {
  (m: Matrix3x3, v: Vector3): Vector3
  (v: Vector3): (m: Matrix3x3) => Vector3
} = internal.vectorProductLeft

export const vectorProductRight: {
  (m: Matrix3x3, v: Vector3): Vector3
  (v: Vector3): (m: Matrix3x3) => Vector3
} = internal.vectorProductRight

export const solveSystem: {
  (m: Matrix3x3, v: Vector3): Vector3
  (v: Vector3): (m: Matrix3x3) => Vector3
} = internal.solveSystem

export const toRows: (m: Matrix3x3) => [Vector3, Vector3, Vector3] =
  internal.toRows as (m: Matrix3x3) => [Vector3, Vector3, Vector3]

export const toColumns: (m: Matrix3x3) => [Vector3, Vector3, Vector3] =
  internal.toColumns as (m: Matrix3x3) => [Vector3, Vector3, Vector3]

export const rowVector: {
  (m: Matrix3x3, row: Matrix3x3Coordinate): Vector3
  (row: Matrix3x3Coordinate): (m: Matrix3x3) => Vector3
} = internal.rowVector

export const columnVector: {
  (m: Matrix3x3, column: Matrix3x3Coordinate): Vector3
  (column: Matrix3x3Coordinate): (m: Matrix3x3) => Vector3
} = internal.columnVector

export const transpose: (m: Matrix3x3) => Matrix3x3 = internal.transpose

export const reverseRows: (m: Matrix3x3) => Matrix3x3 = internal.reverseRows

export const reverseColumns: (m: Matrix3x3) => Matrix3x3 =
  internal.reverseColumns
