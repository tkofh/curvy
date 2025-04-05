import type { FourDimensionalComponent, FourDimensionalIndex } from '../dimensions'
import type { Pipeable } from '../pipe'
import type { Vector4 } from '../vector/vector4'
import type { Matrix3x3 } from './matrix3x3'
import * as internal from './matrix4x4.internal'
import type { Matrix4x4TypeId } from './matrix4x4.internal'

/**
 * A coordinate in a 4x4 matrix.
 *
 * @since 1.0.0
 */
export type Matrix4x4Coordinate = FourDimensionalIndex | FourDimensionalComponent

/**
 * A 4x4 matrix.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface Matrix4x4 extends Pipeable {
  readonly [Matrix4x4TypeId]: Matrix4x4TypeId

  /**
   * The value of the first row and first column.
   */
  readonly m00: number
  /**
   * The value of the first row and second column.
   */
  readonly m01: number
  /**
   * The value of the first row and third column.
   */
  readonly m02: number
  /**
   * The value of the first row and fourth column.
   */
  readonly m03: number
  /**
   * The value of the second row and first column.
   */
  readonly m10: number
  /**
   * The value of the second row and second column.
   */
  readonly m11: number
  /**
   * The value of the second row and third column.
   */
  readonly m12: number
  /**
   * The value of the second row and fourth column.
   */
  readonly m13: number
  /**
   * The value of the third row and first column.
   */
  readonly m20: number
  /**
   * The value of the third row and second column.
   */
  readonly m21: number
  /**
   * The value of the third row and third column.
   */
  readonly m22: number
  /**
   * The value of the third row and fourth column.
   */
  readonly m23: number
  /**
   * The value of the fourth row and first column.
   */
  readonly m30: number
  /**
   * The value of the fourth row and second column.
   */
  readonly m31: number
  /**
   * The value of the fourth row and third column.
   */
  readonly m32: number
  /**
   * The value of the fourth row and fourth column.
   */
  readonly m33: number
}

/**
 * Checks if a value is a `Matrix4x4`.
 *
 * @param m - The value to check.
 * @returns `true` if the value is a `Matrix4x4`, `false` otherwise.
 * @since 1.0.0
 */
export const isMatrix4x4: (m: unknown) => m is Matrix4x4 = internal.isMatrix4x4

/**
 * Creates a new `Matrix4x4` instance.
 *
 * @param m00 - The value of the first row and first column.
 * @param m01 - The value of the first row and second column.
 * @param m02 - The value of the first row and third column.
 * @param m03 - The value of the first row and fourth column.
 * @param m10 - The value of the second row and first column.
 * @param m11 - The value of the second row and second column.
 * @param m12 - The value of the second row and third column.
 * @param m13 - The value of the second row and fourth column.
 * @param m20 - The value of the third row and first column.
 * @param m21 - The value of the third row and second column.
 * @param m22 - The value of the third row and third column.
 * @param m23 - The value of the third row and fourth column.
 * @param m30 - The value of the fourth row and first column.
 * @param m31 - The value of the fourth row and second column.
 * @param m32 - The value of the fourth row and third column.
 * @param m33 - The value of the fourth row and fourth column.
 * @returns A new `Matrix4x4` instance.
 * @since 1.0.0
 */
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

/**
 * Creates a new `Matrix4x4` instance from four row vectors.
 *
 * @param v0 - The first row vector.
 * @param v1 - The second row vector.
 * @param v2 - The third row vector.
 * @param v3 - The fourth row vector.
 * @returns A new `Matrix4x4` instance.
 * @since 1.0.0
 */
export const fromRows: (v0: Vector4, v1: Vector4, v2: Vector4, v3: Vector4) => Matrix4x4 =
  internal.fromRows

/**
 * Creates a new `Matrix4x4` instance from four column vectors.
 *
 * @param v0 - The first column vector.
 * @param v1 - The second column vector.
 * @param v2 - The third column vector.
 * @param v3 - The fourth column vector.
 */
export const fromColumns: (v0: Vector4, v1: Vector4, v2: Vector4, v3: Vector4) => Matrix4x4 =
  internal.fromColumns

export const setRow: {
  /**
   * Sets a row of a `Matrix4x4` to a new vector.
   *
   * @param m - The matrix to modify.
   * @param row - The row to set.
   * @param v - The new vector.
   * @returns A new `Matrix4x4` instance with the specified row set to the new vector.
   * @since 1.0.0
   */
  (m: Matrix4x4, row: Matrix4x4Coordinate, v: Vector4): Matrix4x4
  /**
   * Sets a row of a `Matrix4x4` to a new vector.
   *
   * @param row - The row to set.
   * @param v - The new vector.
   * @returns A function that takes a matrix and returns a new `Matrix4x4` instance with the specified row set to the new vector.
   * @since 1.0.0
   */
  (row: Matrix4x4Coordinate, v: Vector4): (m: Matrix4x4) => Matrix4x4
} = internal.setRow

export const setColumn: {
  /**
   * Sets a column of a `Matrix4x4` to a new vector.
   *
   * @param m - The matrix to modify.
   * @param column - The column to set.
   * @param v - The new vector.
   * @returns A new `Matrix4x4` instance with the specified column set to the new vector.
   * @since 1.0.0
   */
  (m: Matrix4x4, column: Matrix4x4Coordinate, v: Vector4): Matrix4x4
  /**
   * Sets a column of a `Matrix4x4` to a new vector.
   *
   * @param column - The column to set.
   * @param v - The new vector.
   * @returns A function that takes a matrix and returns a new `Matrix4x4` instance with the specified column set to the new vector.
   * @since 1.0.0
   */
  (column: Matrix4x4Coordinate, v: Vector4): (m: Matrix4x4) => Matrix4x4
} = internal.setColumn

/**
 * Calculates the determinant of a `Matrix4x4`.
 *
 * @param m - The matrix to calculate the determinant of.
 * @returns The determinant of the matrix.
 * @since 1.0.0
 */
export const determinant: (m: Matrix4x4) => number = internal.determinant

/**
 * Calculates the minor of a `Matrix4x4` at a given row and column.
 *
 * @param m - The matrix to calculate the minor of.
 * @param row - The row to exclude.
 * @param column - The column to exclude.
 * @returns The minor of the matrix at the given row and column.
 */
export const minor: (
  m: Matrix4x4,
  row: Matrix4x4Coordinate,
  column: Matrix4x4Coordinate,
) => Matrix3x3 = internal.minor

export const vectorProductLeft: {
  /**
   * Calculates the left vector product of a `Matrix4x4` and a `Vector4`.
   *
   * @example
   * ```ts
   * import * as Matrix4x4 from 'curvy/matrix4x4'
   * import * as Vector4 from 'curvy/vector4'
   *
   * const m = Matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
   * const v = Vector4.make(17, 18, 19, 20)
   *
   * // Result:
   * // x = 1 * 17 + 2 * 18 + 3 * 19 + 4 * 20
   * // y = 5 * 17 + 6 * 18 + 7 * 19 + 8 * 20
   * // z = 9 * 17 + 10 * 18 + 11 * 19 + 12 * 20
   * // w = 13 * 17 + 14 * 18 + 15 * 19 + 16 * 20
   * const result = Matrix4x4.vectorProductLeft(m, v)
   * ```
   * @param m - The matrix to multiply.
   * @param v - The vector to multiply.
   * @returns The resulting vector.
   */
  (m: Matrix4x4, v: Vector4): Vector4
  /**
   * Calculates the left vector product of a `Matrix4x4` and a `Vector4`.
   *
   * @example
   * ```ts
   * import * as Matrix4x4 from 'curvy/matrix4x4'
   * import * as Vector4 from 'curvy/vector4'
   *
   * const m = Matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
   * const v = Vector4.make(17, 18, 19, 20)
   *
   * // Result:
   * // x = 1 * 17 + 2 * 18 + 3 * 19 + 4 * 20
   * // y = 5 * 17 + 6 * 18 + 7 * 19 + 8 * 20
   * // z = 9 * 17 + 10 * 18 + 11 * 19 + 12 * 20
   * // w = 13 * 17 + 14 * 18 + 15 * 19 + 16 * 20
   * const result = Matrix4x4.vectorProductLeft(v)(m)
   * ```
   */
  (v: Vector4): (m: Matrix4x4) => Vector4
} = internal.vectorProductLeft

export const vectorProductRight: {
  /**
   * Calculates the right vector product of a `Matrix4x4` and a `Vector4`.
   *
   * @example
   * ```ts
   * import * as Matrix4x4 from 'curvy/matrix4x4'
   * import * as Vector4 from 'curvy/vector4'
   *
   * const m = Matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
   * const v = Vector4.make(17, 18, 19, 20)
   *
   * // Result:
   * // x = 1 * 17 + 5 * 18 + 9 * 19 + 13 * 20
   * // y = 2 * 17 + 6 * 18 + 10 * 19 + 14 * 20
   * // z = 3 * 17 + 7 * 18 + 11 * 19 + 15 * 20
   * // w = 4 * 17 + 8 * 18 + 12 * 19 + 16 * 20
   * const result = Matrix4x4.vectorProductRight(m, v)
   * ```
   */
  (m: Matrix4x4, v: Vector4): Vector4
  /**
   * Calculates the right vector product of a `Matrix4x4` and a `Vector4`.
   *
   * @example
   * ```ts
   * import * as Matrix4x4 from 'curvy/matrix4x4'
   * import * as Vector4 from 'curvy/vector4'
   *
   * const m = Matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
   * const v = Vector4.make(17, 18, 19, 20)
   *
   * // Result:
   * // x = 1 * 17 + 5 * 18 + 9 * 19 + 13 * 20
   * // y = 2 * 17 + 6 * 18 + 10 * 19 + 14 * 20
   * // z = 3 * 17 + 7 * 18 + 11 * 19 + 15 * 20
   * // w = 4 * 17 + 8 * 18 + 12 * 19 + 16 * 20
   * const result = Matrix4x4.vectorProductRight(v)(m)
   */
  (v: Vector4): (m: Matrix4x4) => Vector4
} = internal.vectorProductRight

export const solveSystem: {
  /**
   * Solves a system of linear equations represented by a `Matrix4x4` and a `Vector4`.
   *
   * @param m - The matrix representing the coefficients of the equations.
   * @param v - The vector representing the constants of the equations.
   * @returns The solution vector.
   */
  (m: Matrix4x4, v: Vector4): Vector4
  /**
   * Solves a system of linear equations represented by a `Matrix4x4` and a `Vector4`.
   *
   * @param v - The vector representing the constants of the equations.
   * @returns A function that takes a matrix and returns the solution vector.
   */
  (v: Vector4): (m: Matrix4x4) => Vector4
} = internal.solveSystem

/**
 * Returns the rows of a `Matrix4x4` as an array of vectors.
 *
 * @param m - The matrix to convert.
 * @returns An array of vectors representing the rows of the matrix.
 * @since 1.0.0
 */
export const toRows: (m: Matrix4x4) => [Vector4, Vector4, Vector4, Vector4] = internal.toRows as (
  m: Matrix4x4,
) => [Vector4, Vector4, Vector4, Vector4]

/**
 * Returns the columns of a `Matrix4x4` as an array of vectors.
 *
 * @param m - The matrix to convert.
 * @returns An array of vectors representing the columns of the matrix.
 * @since 1.0.0
 */
export const toColumns: (m: Matrix4x4) => [Vector4, Vector4, Vector4, Vector4] =
  internal.toColumns as (m: Matrix4x4) => [Vector4, Vector4, Vector4, Vector4]

export const rowVector: {
  /**
   * Returns a row vector from a `Matrix4x4`.
   *
   * @param m - The matrix to get the row vector from.
   * @param row - The row index.
   * @returns The row vector.
   */
  (m: Matrix4x4, row: Matrix4x4Coordinate): Vector4
  /**
   * Returns a row vector from a `Matrix4x4`.
   *
   * @param row - The row index.
   * @returns A function that takes a matrix and returns the row vector.
   */
  (row: Matrix4x4Coordinate): (m: Matrix4x4) => Vector4
} = internal.rowVector

export const columnVector: {
  /**
   * Returns a column vector from a `Matrix4x4`.
   *
   * @param m - The matrix to get the column vector from.
   * @param column - The column index.
   * @returns The column vector.
   */
  (m: Matrix4x4, column: Matrix4x4Coordinate): Vector4
  /**
   * Returns a column vector from a `Matrix4x4`.
   *
   * @param column - The column index.
   * @returns A function that takes a matrix and returns the column vector.
   */
  (column: Matrix4x4Coordinate): (m: Matrix4x4) => Vector4
} = internal.columnVector

/**
 * Transposes a `Matrix4x4`.
 *
 * @param m - The matrix to transpose.
 * @returns The transposed matrix.
 * @since 1.0.0
 */
export const transpose: (m: Matrix4x4) => Matrix4x4 = internal.transpose

/**
 * Reverses the rows of a `Matrix4x4`.
 *
 * @param m - The matrix to reverse the rows of.
 * @returns The matrix with the rows reversed.
 * @since 1.0.0
 */
export const reverseRows: (m: Matrix4x4) => Matrix4x4 = internal.reverseRows

/**
 * Reverses the columns of a `Matrix4x4`.
 *
 * @param m - The matrix to reverse the columns of.
 * @returns The matrix with the columns reversed.
 * @since 1.0.0
 */
export const reverseColumns: (m: Matrix4x4) => Matrix4x4 = internal.reverseColumns
