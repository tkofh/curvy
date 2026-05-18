import type { ThreeDimensionalComponent, ThreeDimensionalIndex } from '../dimensions.ts'
import type * as Solution from '../solution/solution.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector3 } from '../vector/vector3.ts'
import type { Matrix2x2 } from './matrix2x2.ts'
import type { Matrix3x3TypeId } from './matrix3x3.internal.ts'
import * as internal from './matrix3x3.internal.ts'
import type { Invertible, MatrixTraits } from './traits.ts'

export type { Invertible } from './traits.ts'

/**
 * A coordinate in a 3x3 matrix.
 *
 * @since 1.0.0
 */
export type Matrix3x3Coordinate = ThreeDimensionalIndex | ThreeDimensionalComponent

/**
 * A 3x3 matrix.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the matrix is refined via `isInvertible` / `asInvertible`. The
 * runtime value carries no trait data — `Traits` only flows through the type
 * system to enable tighter return types on operations like {@link inverse}.
 *
 * @since 1.0.0
 */
export interface Matrix3x3<out Traits = unknown> extends Pipeable {
  readonly [Matrix3x3TypeId]: Matrix3x3TypeId
  readonly [MatrixTraits]: Traits
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
}

/**
 * Checks if a value is a `Matrix3x3`.
 *
 * @param m - The value to check.
 * @returns `true` if the value is a `Matrix3x3`, `false` otherwise.
 * @since 1.0.0
 */
export const isMatrix3x3: (m: unknown) => m is Matrix3x3 = internal.isMatrix3x3

export const equals: {
  /**
   * Checks if two `Matrix3x3` instances are approximately equal within the
   * default absolute tolerance ({@link EPSILON}).
   *
   * @param a - The first matrix.
   * @param b - The second matrix.
   * @returns `true` when each pair of components is within tolerance.
   * @since 1.1.0
   */
  (a: Matrix3x3, b: Matrix3x3): boolean
  /**
   * Checks if two `Matrix3x3` instances are approximately equal within the
   * default absolute tolerance ({@link EPSILON}).
   *
   * @param b - The second matrix.
   * @returns A function that takes the first matrix and returns the comparison result.
   * @since 1.1.0
   */
  (b: Matrix3x3): (a: Matrix3x3) => boolean
} = internal.equals

/**
 * Creates a new `Matrix3x3` instance.
 *
 * @param m00 - The value of the first row and first column.
 * @param m01 - The value of the first row and second column.
 * @param m02 - The value of the first row and third column.
 * @param m10 - The value of the second row and first column.
 * @param m11 - The value of the second row and second column.
 * @param m12 - The value of the second row and third column.
 * @param m20 - The value of the third row and first column.
 * @param m21 - The value of the third row and second column.
 * @param m22 - The value of the third row and third column.
 * @returns A new `Matrix3x3` instance.
 * @since 1.0.0
 */
export const make: (
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

/**
 * Creates a new `Matrix3x3` instance from three row vectors.
 *
 * @param v0 - The first row vector.
 * @param v1 - The second row vector.
 * @param v2 - The third row vector.
 * @returns A new `Matrix3x3` instance.
 * @since 1.0.0
 */
export const fromRows: (v0: Vector3, v1: Vector3, v2: Vector3) => Matrix3x3 = internal.fromRows

/**
 * Creates a new `Matrix3x3` instance from three column vectors.
 *
 * @param v0 - The first column vector.
 * @param v1 - The second column vector.
 * @param v2 - The third column vector.
 * @returns A new `Matrix3x3` instance.
 * @since 1.0.0
 */
export const fromColumns: (v0: Vector3, v1: Vector3, v2: Vector3) => Matrix3x3 =
  internal.fromColumns

export const setRow: {
  /**
   * Sets a row of the matrix to a new vector.
   *
   * @param m - The matrix to set the row of.
   * @param row - The row index to set.
   * @param v - The new vector for the row.
   * @returns A new matrix with the specified row set to the new vector.
   * @since 1.0.0
   */
  (m: Matrix3x3, row: Matrix3x3Coordinate, v: Vector3): Matrix3x3
  /**
   * Sets a row of the matrix to a new vector.
   *
   * @param row - The row index to set.
   * @param v - The new vector for the row.
   * @returns A function that takes a matrix and returns a new matrix with the specified row set to the new vector.
   * @since 1.0.0
   */
  (row: Matrix3x3Coordinate, v: Vector3): (m: Matrix3x3) => Matrix3x3
} = internal.setRow

export const setColumn: {
  /**
   * Sets a column of the matrix to a new vector.
   *
   * @param m - The matrix to set the column of.
   * @param column - The column index to set.
   * @param v - The new vector for the column.
   * @returns A new matrix with the specified column set to the new vector.
   * @since 1.0.0
   */
  (m: Matrix3x3, column: Matrix3x3Coordinate, v: Vector3): Matrix3x3
  /**
   * Sets a column of the matrix to a new vector.
   *
   * @param column - The column index to set.
   * @param v - The new vector for the column.
   * @returns A function that takes a matrix and returns a new matrix with the specified column set to the new vector.
   * @since 1.0.0
   */
  (column: Matrix3x3Coordinate, v: Vector3): (m: Matrix3x3) => Matrix3x3
} = internal.setColumn

/**
 * Calculates the determinant of a 3x3 matrix.
 *
 * @param m - The matrix to calculate the determinant of.
 * @returns The determinant of the matrix.
 * @since 1.0.0
 */
export const determinant: (m: Matrix3x3) => number = internal.determinant

/**
 * Calculates the minor of a 3x3 matrix.
 *
 * @param m - The matrix to calculate the minor of.
 * @param row - The row index of the element to calculate the minor for.
 * @param column - The column index of the element to calculate the minor for.
 * @returns The minor of the matrix at the specified row and column.
 * @since 1.0.0
 */
export const minor: (
  m: Matrix3x3,
  row: Matrix3x3Coordinate,
  column: Matrix3x3Coordinate,
) => Matrix2x2 = internal.minor

export const vectorProductLeft: {
  /**
   * Calculates the left vector product of a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix3x3 from 'curvy/matrix3x3'
   * import * as Vector3 from 'curvy/vector3'
   *
   * const m = Matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9)
   * const v = Vector3.vector3(10, 11, 12)
   *
   * // Performs:
   * // x = 1 * 10 + 2 * 11 + 3 * 12
   * // y = 4 * 10 + 5 * 11 + 6 * 12
   * // z = 7 * 10 + 8 * 11 + 9 * 12
   * const result = Matrix3x3.vectorProductLeft(m, v)
   * ```
   * @param m - The matrix to calculate the left vector product with.
   * @param v - The vector to calculate the left vector product with.
   * @returns The resulting vector from the left vector product.
   * @since 1.0.0
   */
  (m: Matrix3x3, v: Vector3): Vector3
  /**
   * Calculates the left vector product of a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix3x3 from 'curvy/matrix3x3'
   * import * as Vector3 from 'curvy/vector3'
   *
   * const m = Matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9)
   * const v = Vector3.vector3(10, 11, 12)
   *
   * // Performs:
   * // x = 1 * 10 + 2 * 11 + 3 * 12
   * // y = 4 * 10 + 5 * 11 + 6 * 12
   * // z = 7 * 10 + 8 * 11 + 9 * 12
   * const result = Matrix3x3.vectorProductLeft(v)(m)
   * ```
   * @param v - The vector to calculate the left vector product with.
   * @returns A function that takes a matrix and returns the resulting vector from the left vector product.
   * @since 1.0.0
   */
  (v: Vector3): (m: Matrix3x3) => Vector3
} = internal.vectorProductLeft

export const vectorProductRight: {
  /**
   * Calculates the right vector product of a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix3x3 from 'curvy/matrix3x3'
   * import * as Vector3 from 'curvy/vector3'
   *
   * const m = Matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9)
   * const v = Vector3.vector3(10, 11, 12)
   *
   * // Performs:
   * // x = 1 * 10 + 4 * 11 + 7 * 12
   * // y = 2 * 10 + 5 * 11 + 8 * 12
   * // z = 3 * 10 + 6 * 11 + 9 * 12
   * const result = Matrix3x3.vectorProductRight(m, v)
   * ```
   * @param m - The matrix to calculate the right vector product with.
   * @param v - The vector to calculate the right vector product with.
   * @returns The resulting vector from the right vector product.
   * @since 1.0.0
   */
  (m: Matrix3x3, v: Vector3): Vector3
  /**
   * Calculates the right vector product of a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix3x3 from 'curvy/matrix3x3'
   * import * as Vector3 from 'curvy/vector3'
   *
   * const m = Matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9)
   * const v = Vector3.vector3(10, 11, 12)
   *
   * // Performs:
   * // x = 1 * 10 + 4 * 11 + 7 * 12
   * // y = 2 * 10 + 5 * 11 + 8 * 12
   * // z = 3 * 10 + 6 * 11 + 9 * 12
   * const result = Matrix3x3.vectorProductRight(v)(m)
   * ```
   * @param v - The vector to calculate the right vector product with.
   * @returns A function that takes a matrix and returns the resulting vector from the right vector product.
   * @since 1.0.0
   */
  (v: Vector3): (m: Matrix3x3) => Vector3
} = internal.vectorProductRight

export const solveSystem: {
  /**
   * Solves a system of equations represented by a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix3x3 from 'curvy/matrix3x3'
   * import * as Vector3 from 'curvy/vector3'
   *
   * const m = Matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9)
   * const v = Vector3.vector3(10, 11, 12)
   *
   * // Performs:
   * // x = m00 * x + m01 * y + m02 * z
   * // y = m10 * x + m11 * y + m12 * z
   * // z = m20 * x + m21 * y + m22 * z
   * const result = Matrix3x3.solveSystem(m, v)
   * ```
   * @since 1.0.0
   */
  (m: Matrix3x3, v: Vector3): Vector3
  /**
   * Solves a system of equations represented by a matrix and a vector.
   *
   * @example
   * ```ts
   * import * as Matrix3x3 from 'curvy/matrix3x3'
   * import * as Vector3 from 'curvy/vector3'
   *
   * const m = Matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9)
   * const v = Vector3.vector3(10, 11, 12)
   *
   * // Performs:
   * // x = m00 * x + m01 * y + m02 * z
   * // y = m10 * x + m11 * y + m12 * z
   * // z = m20 * x + m21 * y + m22 * z
   * const result = Matrix3x3.solveSystem(v)(m)
   * ```
   * @since 1.0.0
   */
  (v: Vector3): (m: Matrix3x3) => Vector3
} = internal.solveSystem

/**
 * Returns the rows of a `Matrix3x3` as an array of vectors.
 *
 * @param m - The matrix to get the rows from.
 * @returns An array of vectors representing the rows of the matrix.
 * @since 1.0.0
 */
export const toRows: (m: Matrix3x3) => [Vector3, Vector3, Vector3] = internal.toRows as (
  m: Matrix3x3,
) => [Vector3, Vector3, Vector3]

/**
 * Returns the columns of a `Matrix3x3` as an array of vectors.
 *
 * @param m - The matrix to get the columns from.
 * @returns An array of vectors representing the columns of the matrix.
 * @since 1.0.0
 */
export const toColumns: (m: Matrix3x3) => [Vector3, Vector3, Vector3] = internal.toColumns as (
  m: Matrix3x3,
) => [Vector3, Vector3, Vector3]

export const rowVector: {
  /**
   * Gets a row vector from the matrix.
   *
   * @param m - The matrix to get the row vector from.
   * @param row - The row index to get the vector from.
   * @returns The row vector at the specified index.
   * @since 1.0.0
   */
  (m: Matrix3x3, row: Matrix3x3Coordinate): Vector3
  /**
   * Gets a row vector from the matrix.
   *
   * @param row - The row index to get the vector from.
   * @returns A function that takes a matrix and returns the row vector at the specified index.
   * @since 1.0.0
   */
  (row: Matrix3x3Coordinate): (m: Matrix3x3) => Vector3
} = internal.rowVector

export const columnVector: {
  /**
   * Gets a column vector from the matrix.
   *
   * @param m - The matrix to get the column vector from.
   * @param column - The column index to get the vector from.
   * @returns The column vector at the specified index.
   * @since 1.0.0
   */
  (m: Matrix3x3, column: Matrix3x3Coordinate): Vector3
  /**
   * Gets a column vector from the matrix.
   *
   * @param column - The column index to get the vector from.
   * @returns A function that takes a matrix and returns the column vector at the specified index.
   * @since 1.0.0
   */
  (column: Matrix3x3Coordinate): (m: Matrix3x3) => Vector3
} = internal.columnVector

/**
 * Transposes a `Matrix3x3`.
 *
 * @param m - The matrix to transpose.
 * @returns A new `Matrix3x3` instance that is the transpose of the input matrix.
 * @since 1.0.0
 */
export const transpose: (m: Matrix3x3) => Matrix3x3 = internal.transpose

/**
 * Reverses the rows of a `Matrix3x3`.
 *
 * @param m - The matrix to reverse the rows of.
 * @returns A new `Matrix3x3` instance with the rows reversed.
 * @since 1.0.0
 */
export const reverseRows: (m: Matrix3x3) => Matrix3x3 = internal.reverseRows

/**
 * Reverses the columns of a `Matrix3x3`.
 *
 * @param m - The matrix to reverse the columns of.
 * @returns A new `Matrix3x3` instance with the columns reversed.
 * @since 1.0.0
 */
export const reverseColumns: (m: Matrix3x3) => Matrix3x3 = internal.reverseColumns

/**
 * The 3x3 identity matrix.
 *
 * @since 2.0.0
 */
export const identity: Matrix3x3 = internal.identity

export const multiply: {
  /**
   * Multiplies two `Matrix3x3` instances. Result is `a · b`.
   *
   * @param a - The left-hand matrix.
   * @param b - The right-hand matrix.
   * @returns The product matrix.
   * @since 2.0.0
   */
  (a: Matrix3x3, b: Matrix3x3): Matrix3x3
  /**
   * Multiplies two `Matrix3x3` instances. Result is `a · b`.
   *
   * @param b - The right-hand matrix.
   * @returns A function that takes the left-hand matrix and returns the product.
   * @since 2.0.0
   */
  (b: Matrix3x3): (a: Matrix3x3) => Matrix3x3
} = internal.multiply

// The implementation always runs the same det/epsEquals branch. For
// `Invertible`-branded matrices the empty branch is provably unreachable,
// but TS can't see that — the cast pairs the type-level promise with the
// runtime brand check.
export const inverse: {
  /**
   * Returns the inverse of an `Invertible`-branded `Matrix3x3`. Because the
   * brand guarantees non-singularity, the result is always a single matrix —
   * wrapped in `Solution.One`.
   *
   * @param m - The matrix to invert.
   * @since 2.0.0
   */
  <T extends Invertible>(m: Matrix3x3<T>): Solution.One<Matrix3x3<T>>
  /**
   * Returns the inverse of a `Matrix3x3`. Returns `Solution.none` if the
   * matrix is singular (determinant approximately zero). Use {@link asInvertible}
   * or {@link isInvertible} to refine the type and tighten the return to
   * `Solution.One`, or use {@link inverseUnsafe} if you want the throwing form.
   *
   * @param m - The matrix to invert.
   * @since 2.0.0
   */
  <T>(m: Matrix3x3<T>): Solution.AtMostOne<Matrix3x3<T>>
} = internal.inverse as never

/**
 * Returns the inverse of a `Matrix3x3`. Throws when the matrix is singular
 * (determinant approximately zero). Useful when you've already validated
 * invertibility out-of-band and want the unwrapped matrix directly; otherwise
 * prefer {@link inverse}.
 *
 * @param m - The matrix to invert.
 * @returns The inverse matrix.
 * @throws If `m` is singular.
 * @since 2.0.0
 */
export const inverseUnsafe: (m: Matrix3x3) => Matrix3x3 = internal.inverseUnsafe

/**
 * Type-narrowing predicate: refines a `Matrix3x3<T>` to
 * `Matrix3x3<T & Invertible>` when the matrix's determinant is non-zero
 * (within the default absolute tolerance).
 *
 * @param m - The matrix to check.
 * @returns `true` when `m` is invertible.
 * @since 2.0.0
 */
export const isInvertible: <T>(m: Matrix3x3<T>) => m is Matrix3x3<T & Invertible> =
  internal.isInvertible

/**
 * Asserts that the matrix is invertible, throwing on a singular matrix.
 *
 * @param m - The matrix to assert against.
 * @returns The same matrix, typed with the `Invertible` brand.
 * @throws When `m` is singular.
 * @since 2.0.0
 */
export const asInvertible: <T>(m: Matrix3x3<T>) => Matrix3x3<T & Invertible> = internal.asInvertible
