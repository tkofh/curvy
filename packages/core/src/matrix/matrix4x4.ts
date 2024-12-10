import type {
  FourDimensionalComponent,
  FourDimensionalIndex,
} from '../dimensions'
import type { Pipeable } from '../pipe'
import type { Vector4 } from '../vector/vector4'
import type { Matrix3x3 } from './matrix3x3'
import * as internal from './matrix4x4.internal'
import type { Matrix4x4TypeId } from './matrix4x4.internal'

export type Matrix4x4Coordinate =
  | FourDimensionalIndex
  | FourDimensionalComponent

export interface Matrix4x4 extends Pipeable {
  readonly [Matrix4x4TypeId]: Matrix4x4TypeId

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
}

export const isMatrix4x4: (m: unknown) => m is Matrix4x4 = internal.isMatrix4x4

export const make: (
  m00?: number,
  m01?: number,
  m02?: number,
  m03?: number,
  m10?: number,
  m11?: number,
  m12?: number,
  m13?: number,
  m20?: number,
  m21?: number,
  m22?: number,
  m23?: number,
  m30?: number,
  m31?: number,
  m32?: number,
  m33?: number,
) => Matrix4x4 = internal.make

export const fromRows: (
  v0: Vector4,
  v1: Vector4,
  v2: Vector4,
  v3: Vector4,
) => Matrix4x4 = internal.fromRows

export const fromColumns: (
  v0: Vector4,
  v1: Vector4,
  v2: Vector4,
  v3: Vector4,
) => Matrix4x4 = internal.fromColumns

export const setRow: {
  (m: Matrix4x4, row: Matrix4x4Coordinate, v: Vector4): Matrix4x4
  (row: Matrix4x4Coordinate, v: Vector4): (m: Matrix4x4) => Matrix4x4
} = internal.setRow

export const setColumn: {
  (m: Matrix4x4, column: Matrix4x4Coordinate, v: Vector4): Matrix4x4
  (column: Matrix4x4Coordinate, v: Vector4): (m: Matrix4x4) => Matrix4x4
} = internal.setColumn

export const determinant: (m: Matrix4x4) => number = internal.determinant

export const minor: (
  m: Matrix4x4,
  row: Matrix4x4Coordinate,
  column: Matrix4x4Coordinate,
) => Matrix3x3 = internal.minor

export const vectorProductLeft: {
  (m: Matrix4x4, v: Vector4): Vector4
  (v: Vector4): (m: Matrix4x4) => Vector4
} = internal.vectorProductLeft

export const vectorProductRight: {
  (m: Matrix4x4, v: Vector4): Vector4
  (v: Vector4): (m: Matrix4x4) => Vector4
} = internal.vectorProductRight

export const solveSystem: {
  (m: Matrix4x4, v: Vector4): Vector4
  (v: Vector4): (m: Matrix4x4) => Vector4
} = internal.solveSystem

export const toRows: (m: Matrix4x4) => [Vector4, Vector4, Vector4, Vector4] =
  internal.toRows as (m: Matrix4x4) => [Vector4, Vector4, Vector4, Vector4]

export const toColumns: (m: Matrix4x4) => [Vector4, Vector4, Vector4, Vector4] =
  internal.toColumns as (m: Matrix4x4) => [Vector4, Vector4, Vector4, Vector4]

export const rowVector: {
  (m: Matrix4x4, row: Matrix4x4Coordinate): Vector4
  (row: Matrix4x4Coordinate): (m: Matrix4x4) => Vector4
} = internal.rowVector

export const columnVector: {
  (m: Matrix4x4, column: Matrix4x4Coordinate): Vector4
  (column: Matrix4x4Coordinate): (m: Matrix4x4) => Vector4
} = internal.columnVector

export const transpose: (m: Matrix4x4) => Matrix4x4 = internal.transpose

export const reverseRows: (m: Matrix4x4) => Matrix4x4 = internal.reverseRows

export const reverseColumns: (m: Matrix4x4) => Matrix4x4 =
  internal.reverseColumns
