import type {
  TwoDimensionalComponent,
  TwoDimensionalIndex,
} from '../dimensions'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import * as internal from './matrix2x2.internal'
import type { Matrix2x2TypeId } from './matrix2x2.internal'

export type Matrix2x2Coordinate = TwoDimensionalIndex | TwoDimensionalComponent

export interface Matrix2x2 extends Pipeable {
  readonly [Matrix2x2TypeId]: Matrix2x2TypeId

  readonly m00: number
  readonly m01: number
  readonly m10: number
  readonly m11: number
}

export const isMatrix2x2: (m: unknown) => m is Matrix2x2 = internal.isMatrix2x2

export const matrix2x2: (
  m00?: number,
  m01?: number,
  m10?: number,
  m11?: number,
) => Matrix2x2 = internal.make

export const fromRows: (v0: Vector2, v1: Vector2) => Matrix2x2 =
  internal.fromRows

export const fromColumns: (v0: Vector2, v1: Vector2) => Matrix2x2 =
  internal.fromColumns

export const setRow: {
  (m: Matrix2x2, row: Matrix2x2Coordinate, v: Vector2): Matrix2x2
  (row: Matrix2x2Coordinate, v: Vector2): (m: Matrix2x2) => Matrix2x2
} = internal.setRow

export const setColumn: {
  (m: Matrix2x2, column: Matrix2x2Coordinate, v: Vector2): Matrix2x2
  (column: Matrix2x2Coordinate, v: Vector2): (m: Matrix2x2) => Matrix2x2
} = internal.setColumn

export const determinant: (m: Matrix2x2) => number = internal.determinant

export const vectorProductLeft: {
  (m: Matrix2x2, v: Vector2): Vector2
  (v: Vector2): (m: Matrix2x2) => Vector2
} = internal.vectorProductLeft

export const vectorProductRight: {
  (m: Matrix2x2, v: Vector2): Vector2
  (v: Vector2): (m: Matrix2x2) => Vector2
} = internal.vectorProductRight

export const solveSystem: {
  (m: Matrix2x2, v: Vector2): Vector2
  (v: Vector2): (m: Matrix2x2) => Vector2
} = internal.solveSystem

export const toRows: (m: Matrix2x2) => [Vector2, Vector2] = internal.toRows

export const toColumns: (m: Matrix2x2) => [Vector2, Vector2] =
  internal.toColumns

export const rowVector: (m: Matrix2x2, row: Matrix2x2Coordinate) => Vector2 =
  internal.rowVector

export const columnVector: (
  m: Matrix2x2,
  column: Matrix2x2Coordinate,
) => Vector2 = internal.columnVector

export const transpose: (m: Matrix2x2) => Matrix2x2 = internal.transpose

export const reverseRows: (m: Matrix2x2) => Matrix2x2 = internal.reverseRows

export const reverseColumns: (m: Matrix2x2) => Matrix2x2 =
  internal.reverseColumns
