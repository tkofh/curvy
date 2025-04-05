import type { TwoDimensionalComponent, TwoDimensionalIndex } from '../dimensions'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import * as internal from './matrix2x2.internal'
import type { Matrix2x2TypeId } from './matrix2x2.internal'

/**
 * A type representing the coordinate of a 2D matrix.
 *
 * @since 1.0.0
 */
export type Matrix2x2Coordinate = TwoDimensionalIndex | TwoDimensionalComponent

/**
 * A 2D matrix with 2 rows and 2 columns.
 *
 * All fields are readonly and immutable, and all operations create new instances.
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
 * @param m - The value to check.
 * @returns `true` if the value is a `Matrix2x2`, `false` otherwise.
 * @since 1.0.0
 */
export const isMatrix2x2: (m: unknown) => m is Matrix2x2 = internal.isMatrix2x2

/**
 * Creates a new `Matrix2x2` instance.
 *
 * @param m00 - The value in the first row and first column. Defaults to 0.
 * @param m01 - The value in the first row and second column. Defaults to 0.
 * @param m10 - The value in the second row and first column. Defaults to 0.
 * @param m11 - The value in the second row and second column. Defaults to 0.
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
   * @param m - The matrix to modify.
   * @param row - The row index (0 or 1).
   * @param v - The vector to set the row to.
   * @returns A new `Matrix2x2` instance with the specified row set to the given vector.
   * @since 1.0.0
   */
  (m: Matrix2x2, row: Matrix2x2Coordinate, v: Vector2): Matrix2x2
  /**
   * Sets the specified row of the matrix to the given vector.
   *
   * @param row - The row index (0 or 1).
   * @param v - The vector to set the row to.
   * @returns A function that takes a matrix and returns a new `Matrix2x2` instance with the specified row set to the given vector.
   * @since 1.0.0
   */
  (row: Matrix2x2Coordinate, v: Vector2): (m: Matrix2x2) => Matrix2x2
} = internal.setRow

export const setColumn: {
  /**
   * Sets the specified column of the matrix to the given vector.
   *
   * @param m - The matrix to modify.
   * @param column - The column index (0 or 1).
   * @param v - The vector to set the column to.
   * @returns A new `Matrix2x2` instance with the specified column set to the given vector.
   * @since 1.0.0
   */
  (m: Matrix2x2, column: Matrix2x2Coordinate, v: Vector2): Matrix2x2
  /**
   * Sets the specified column of the matrix to the given vector.
   *
   * @param column - The column index (0 or 1).
   * @param v - The vector to set the column to.
   * @returns A function that takes a matrix and returns a new `Matrix2x2` instance with the specified column set to the given vector.
   * @since 1.0.0
   */
  (column: Matrix2x2Coordinate, v: Vector2): (m: Matrix2x2) => Matrix2x2
} = internal.setColumn

/**
 * Calculates the determinant of a 2D matrix.
 *
 * @param m - The matrix to calculate the determinant for.
 * @returns The determinant of the matrix.
 * @since 1.0.0
 */
export const determinant: (m: Matrix2x2) => number = internal.determinant

export const vectorProductLeft: {
  /**
   * Calculates the left vector product of a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix2x2 from 'curvy/matrix2x2'
   * import * as Vector2 from 'curvy/vector2'
   *
   * const matrix = Matrix2x2.make(1, 2, 3, 4)
   * const vector = Vector2.make(5, 6)
   *
   * // Performs:
   * // x = 1 * 5 + 2 * 6 = 17
   * // y = 3 * 5 + 4 * 6 = 39
   * const result = Matrix2x2.vectorProductLeft(matrix, vector)
   * ```
   * @param m - The matrix to multiply.
   * @param v - The vector to multiply.
   * @returns The resulting vector after the left vector product.
   * @since 1.0.0
   */
  (m: Matrix2x2, v: Vector2): Vector2
  /**
   * Calculates the left vector product of a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix2x2 from 'curvy/matrix2x2'
   * import * as Vector2 from 'curvy/vector2'
   *
   * const matrix = Matrix2x2.make(1, 2, 3, 4)
   * const vector = Vector2.make(5, 6)
   *
   * // Performs:
   * // x = 1 * 5 + 2 * 6 = 17
   * // y = 3 * 5 + 4 * 6 = 39
   * const result = Matrix2x2.vectorProductLeft(vector)(matrix)
   * ```
   * @param v - The vector to multiply.
   * @returns A function that takes a matrix and returns the resulting vector after the left vector product.
   * @since 1.0.0
   */
  (v: Vector2): (m: Matrix2x2) => Vector2
} = internal.vectorProductLeft

export const vectorProductRight: {
  /**
   * Calculates the right vector product of a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix2x2 from 'curvy/matrix2x2'
   * import * as Vector2 from 'curvy/vector2'
   *
   * const matrix = Matrix2x2.make(1, 2, 3, 4)
   * const vector = Vector2.make(5, 6)
   *
   * // Performs:
   * // x = 1 * 5 + 3 * 6 = 33
   * // y = 2 * 5 + 4 * 6 = 62
   * const result = Matrix2x2.vectorProductRight(matrix, vector)
   * ```
   * @param m - The matrix to multiply.
   * @param v - The vector to multiply.
   * @returns The resulting vector after the right vector product.
   * @since 1.0.0
   */
  (m: Matrix2x2, v: Vector2): Vector2
  /**
   * Calculates the right vector product of a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix2x2 from 'curvy/matrix2x2'
   * import * as Vector2 from 'curvy/vector2'
   *
   * const matrix = Matrix2x2.make(1, 2, 3, 4)
   * const vector = Vector2.make(5, 6)
   *
   * // Performs:
   * // x = 1 * 5 + 3 * 6 = 33
   * // y = 2 * 5 + 4 * 6 = 62
   * const result = Matrix2x2.vectorProductRight(vector)(matrix)
   * ```
   * @param v - The vector to multiply.
   * @returns A function that takes a matrix and returns the resulting vector after the right vector product.
   * @since 1.0.0
   */
  (v: Vector2): (m: Matrix2x2) => Vector2
} = internal.vectorProductRight

export const solveSystem: {
  /**
   * Solves a system of linear equations represented by a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix2x2 from 'curvy/matrix2x2'
   * import * as Vector2 from 'curvy/vector2'
   *
   * const matrix = Matrix2x2.make(1, 2, 3, 4)
   * const vector = Vector2.make(5, 6)
   *
   * // Solves the system of equations:
   * // 1x + 2y = 5
   * // 3x + 4y = 6
   * const result = Matrix2x2.solveSystem(matrix, vector)
   * ```
   * @param m - The matrix representing the coefficients of the system.
   * @param v - The vector representing the constants of the system.
   * @returns The solution vector.
   * @since 1.0.0
   */
  (m: Matrix2x2, v: Vector2): Vector2
  /**
   * Solves a system of linear equations represented by a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix2x2 from 'curvy/matrix2x2'
   * import * as Vector2 from 'curvy/vector2'
   *
   * const matrix = Matrix2x2.make(1, 2, 3, 4)
   * const vector = Vector2.make(5, 6)
   *
   * // Solves the system of equations:
   * // 1x + 2y = 5
   * // 3x + 4y = 6
   * const result = Matrix2x2.solveSystem(vector)(matrix)
   * ```
   * @param v - The vector representing the constants of the system.
   * @returns A function that takes a matrix and returns the solution vector.
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
 * @param row - The row index (0 or 1).
 * @returns A vector representing the specified row of the matrix.
 * @since 1.0.0
 */
export const rowVector: (m: Matrix2x2, row: Matrix2x2Coordinate) => Vector2 = internal.rowVector

/**
 * Returns the specified column of a matrix as a vector.
 *
 * @param m - The matrix to get the column from.
 * @param column - The column index (0 or 1).
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
 * Reverses the rows of a matrix.
 *
 * @param m - The matrix to reverse the rows of.
 * @returns A new `Matrix2x2` instance with the rows reversed.
 * @since 1.0.0
 */
export const reverseRows: (m: Matrix2x2) => Matrix2x2 = internal.reverseRows

/**
 * Reverses the columns of a matrix.
 *
 * @param m - The matrix to reverse the columns of.
 * @returns A new `Matrix2x2` instance with the columns reversed.
 * @since 1.0.0
 */
export const reverseColumns: (m: Matrix2x2) => Matrix2x2 = internal.reverseColumns
