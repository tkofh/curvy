import type { TwoDimensionalComponent, TwoDimensionalIndex } from '../dimensions.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Matrix2x2TypeId } from './matrix2x2.internal.ts'
import * as internal from './matrix2x2.internal.ts'

/**
 * A row or column selector for a `Matrix2x2`: a numeric index (`0 | 1`) or
 * the equivalent component name (`'x' | 'y'`).
 *
 * @since 1.0.0
 */
export type Matrix2x2Coordinate = TwoDimensionalIndex | TwoDimensionalComponent

/**
 * A 2×2 matrix, stored as four `m<row><column>` fields.
 *
 * All fields are readonly. No operation mutates a matrix. Construct via
 * `make`, `fromRows`, or `fromColumns`.
 *
 * @since 1.0.0
 */
export interface Matrix2x2 extends Pipeable {
  readonly [Matrix2x2TypeId]: Matrix2x2TypeId

  /**
   * The value in the first row and first column.
   */
  readonly m00: number
  /**
   * The value in the first row and second column.
   */
  readonly m01: number
  /**
   * The value in the second row and first column.
   */
  readonly m10: number
  /**
   * The value in the second row and second column.
   */
  readonly m11: number
}

/**
 * Checks if a value is a `Matrix2x2`.
 *
 * True only for values built by this module's constructors, which carry
 * the brand. A structural object with `m00`…`m11` fields does not match.
 *
 * @param m - The value to check.
 * @returns `true` if the value is a `Matrix2x2`, `false` otherwise.
 * @since 1.0.0
 */
export const isMatrix2x2: (m: unknown) => m is Matrix2x2 = internal.isMatrix2x2

export const equals: {
  /**
   * Checks if two `Matrix2x2` instances are approximately equal.
   *
   * Each pair of components is compared with `coincident` from
   * `curvy/number`, an absolute-plus-relative tolerance band. See
   * `PRECISION.md` for the mechanics.
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns `true` when each pair of components is within tolerance.
   * @since 2.0.0
   */
  (a: Matrix2x2, b: Matrix2x2): boolean
  /**
   * Checks if two `Matrix2x2` instances are approximately equal.
   *
   * @param b - The second matrix.
   * @returns A function that takes the first matrix and returns the comparison result.
   * @since 2.0.0
   */
  (b: Matrix2x2): (a: Matrix2x2) => boolean
} = internal.equals

/**
 * Creates a new `Matrix2x2` instance, in row-major argument order.
 *
 * Each omitted value copies the previous argument, so `make(5)` fills the
 * whole matrix with `5` and `make()` is the zero matrix.
 *
 * @param m00 - The value in the first row and first column. Defaults to `0`.
 * @param m01 - The value in the first row and second column. Defaults to `m00`.
 * @param m10 - The value in the second row and first column. Defaults to `m01`.
 * @param m11 - The value in the second row and second column. Defaults to `m10`.
 * @returns A new `Matrix2x2` instance.
 * @since 1.0.0
 */
export const make: (m00?: number, m01?: number, m10?: number, m11?: number) => Matrix2x2 =
  internal.make

/**
 * Creates a new `Matrix2x2` instance from two vectors representing rows.
 *
 * @param v0 - The first row vector.
 * @param v1 - The second row vector.
 * @returns A new `Matrix2x2` instance.
 * @since 1.0.0
 */
export const fromRows: (v0: Vector2, v1: Vector2) => Matrix2x2 = internal.fromRows

/**
 * Creates a new `Matrix2x2` instance from two vectors representing columns.
 *
 * @param v0 - The first column vector.
 * @param v1 - The second column vector.
 * @returns A new `Matrix2x2` instance.
 * @since 1.0.0
 */
export const fromColumns: (v0: Vector2, v1: Vector2) => Matrix2x2 = internal.fromColumns

export const setRow: {
  /**
   * Sets the specified row of the matrix to the given vector.
   *
   * @param m - The matrix to update.
   * @param row - The row to replace: `0`/`'x'` or `1`/`'y'`.
   * @param v - The vector to set the row to.
   * @returns A new `Matrix2x2` instance with the specified row set to the given vector.
   * @since 1.0.0
   */
  (m: Matrix2x2, row: Matrix2x2Coordinate, v: Vector2): Matrix2x2
  /**
   * Sets the specified row of the matrix to the given vector.
   *
   * @param row - The row to replace: `0`/`'x'` or `1`/`'y'`.
   * @param v - The vector to set the row to.
   * @returns A function that takes a matrix and returns a new `Matrix2x2` with the row replaced.
   * @since 1.0.0
   */
  (row: Matrix2x2Coordinate, v: Vector2): (m: Matrix2x2) => Matrix2x2
} = internal.setRow

export const setColumn: {
  /**
   * Sets the specified column of the matrix to the given vector.
   *
   * @param m - The matrix to update.
   * @param column - The column to replace: `0`/`'x'` or `1`/`'y'`.
   * @param v - The vector to set the column to.
   * @returns A new `Matrix2x2` instance with the specified column set to the given vector.
   * @since 1.0.0
   */
  (m: Matrix2x2, column: Matrix2x2Coordinate, v: Vector2): Matrix2x2
  /**
   * Sets the specified column of the matrix to the given vector.
   *
   * @param column - The column to replace: `0`/`'x'` or `1`/`'y'`.
   * @param v - The vector to set the column to.
   * @returns A function that takes a matrix and returns a new `Matrix2x2` with the column replaced.
   * @since 1.0.0
   */
  (column: Matrix2x2Coordinate, v: Vector2): (m: Matrix2x2) => Matrix2x2
} = internal.setColumn

/**
 * Calculates the determinant of a `Matrix2x2`.
 *
 * @param m - The matrix to calculate the determinant for.
 * @returns The determinant `m00 * m11 - m01 * m10`.
 * @since 1.0.0
 */
export const determinant: (m: Matrix2x2) => number = internal.determinant

export const vectorProductLeft: {
  /**
   * Computes `M · v`: the matrix on the left, the vector as a column.
   * Component `k` of the result is the dot product of row `k` with `v`.
   *
   * @param m - The matrix to multiply by.
   * @param v - The vector to transform.
   * @returns The vector `M · v`.
   * @example
   * ```ts
   * const m = Matrix2x2.make(1, 2, 3, 4)
   * const v = Vector2.make(5, 6)
   *
   * // x = 1 * 5 + 2 * 6 = 17
   * // y = 3 * 5 + 4 * 6 = 39
   * Matrix2x2.vectorProductLeft(m, v) // (17, 39)
   * ```
   * @since 1.0.0
   */
  (m: Matrix2x2, v: Vector2): Vector2
  /**
   * Computes `M · v`: the matrix on the left, the vector as a column.
   *
   * @param v - The vector to transform.
   * @returns A function that takes a matrix and returns `M · v`.
   * @since 1.0.0
   */
  (v: Vector2): (m: Matrix2x2) => Vector2
} = internal.vectorProductLeft

export const vectorProductRight: {
  /**
   * Computes `vᵀ · M`: the vector as a row, the matrix on the right.
   * Component `k` of the result is the dot product of column `k` with `v`.
   *
   * @param m - The matrix to multiply by.
   * @param v - The vector to transform.
   * @returns The vector `vᵀ · M`.
   * @example
   * ```ts
   * const m = Matrix2x2.make(1, 2, 3, 4)
   * const v = Vector2.make(5, 6)
   *
   * // x = 1 * 5 + 3 * 6 = 23
   * // y = 2 * 5 + 4 * 6 = 34
   * Matrix2x2.vectorProductRight(m, v) // (23, 34)
   * ```
   * @since 1.0.0
   */
  (m: Matrix2x2, v: Vector2): Vector2
  /**
   * Computes `vᵀ · M`: the vector as a row, the matrix on the right.
   *
   * @param v - The vector to transform.
   * @returns A function that takes a matrix and returns `vᵀ · M`.
   * @since 1.0.0
   */
  (v: Vector2): (m: Matrix2x2) => Vector2
} = internal.vectorProductRight

export const solveSystem: {
  /**
   * Solves the linear system `M · x = v` for `x`.
   *
   * Rejects only exact singularity. A determinant of exactly `0` throws.
   * A nearly singular system returns a result whose error grows with the
   * system's conditioning — the honest outcome for a construction (see
   * `PRECISION.md`).
   *
   * @param m - The coefficient matrix.
   * @param v - The constants of the system.
   * @returns The solution vector `x`.
   * @throws `Error` when the determinant is exactly `0`.
   * @example
   * ```ts
   * // 1x + 2y = 5
   * // 3x + 4y = 6
   * Matrix2x2.solveSystem(Matrix2x2.make(1, 2, 3, 4), Vector2.make(5, 6))
   * // (-4, 4.5)
   * ```
   * @since 1.0.0
   */
  (m: Matrix2x2, v: Vector2): Vector2
  /**
   * Solves the linear system `M · x = v` for `x`.
   *
   * @param v - The constants of the system.
   * @returns A function that takes the coefficient matrix and returns the solution vector.
   * @throws `Error` when the determinant is exactly `0`.
   * @since 1.0.0
   */
  (v: Vector2): (m: Matrix2x2) => Vector2
} = internal.solveSystem

/**
 * Returns the rows of a matrix as an array of vectors.
 *
 * @param m - The matrix to convert.
 * @returns An array of vectors representing the rows of the matrix.
 * @since 1.0.0
 */
export const toRows: (m: Matrix2x2) => [Vector2, Vector2] = internal.toRows

/**
 * Returns the columns of a matrix as an array of vectors.
 *
 * @param m - The matrix to convert.
 * @returns An array of vectors representing the columns of the matrix.
 * @since 1.0.0
 */
export const toColumns: (m: Matrix2x2) => [Vector2, Vector2] = internal.toColumns

/**
 * Returns the specified row of a matrix as a vector.
 *
 * @param m - The matrix to get the row from.
 * @param row - The row to read: `0`/`'x'` or `1`/`'y'`.
 * @returns A vector representing the specified row of the matrix.
 * @since 1.0.0
 */
export const rowVector: (m: Matrix2x2, row: Matrix2x2Coordinate) => Vector2 = internal.rowVector

/**
 * Returns the specified column of a matrix as a vector.
 *
 * @param m - The matrix to get the column from.
 * @param column - The column to read: `0`/`'x'` or `1`/`'y'`.
 * @returns A vector representing the specified column of the matrix.
 * @since 1.0.0
 */
export const columnVector: (m: Matrix2x2, column: Matrix2x2Coordinate) => Vector2 =
  internal.columnVector

/**
 * Transposes a matrix.
 *
 * @param m - The matrix to transpose.
 * @returns A new `Matrix2x2` instance representing the transposed matrix.
 * @since 1.0.0
 */
export const transpose: (m: Matrix2x2) => Matrix2x2 = internal.transpose

/**
 * Swaps the two rows of a matrix.
 *
 * @param m - The matrix to reverse the rows of.
 * @returns A new `Matrix2x2` instance with the rows swapped.
 * @since 1.0.0
 */
export const reverseRows: (m: Matrix2x2) => Matrix2x2 = internal.reverseRows

/**
 * Swaps the two columns of a matrix.
 *
 * @param m - The matrix to reverse the columns of.
 * @returns A new `Matrix2x2` instance with the columns swapped.
 * @since 1.0.0
 */
export const reverseColumns: (m: Matrix2x2) => Matrix2x2 = internal.reverseColumns
