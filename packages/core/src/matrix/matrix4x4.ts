import type { FourDimensionalComponent, FourDimensionalIndex } from '../dimensions.ts'
import type * as Solution from '../solution/solution.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector4 } from '../vector/vector4.ts'
import type { Matrix3x3 } from './matrix3x3.ts'
import type { Matrix4x4TypeId } from './matrix4x4.internal.ts'
import * as internal from './matrix4x4.internal.ts'
import type { Invertible, MatrixTraits } from './traits.ts'

export type { Invertible } from './traits.ts'

/**
 * A row or column selector for a `Matrix4x4`: a numeric index
 * (`0 | 1 | 2 | 3`) or the equivalent component name
 * (`'x' | 'y' | 'z' | 'w'`).
 *
 * @since 1.0.0
 */
export type Matrix4x4Coordinate = FourDimensionalIndex | FourDimensionalComponent

/**
 * A 4×4 matrix, stored as sixteen `m<row><column>` fields.
 *
 * All fields are readonly. No operation mutates a matrix. Construct via
 * `make`, `fromRows`, or `fromColumns`.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the matrix is refined via `isInvertible` / `asInvertible`. The
 * runtime value carries no trait data. `Traits` only flows through the type
 * system to enable tighter return types on operations like `inverse`.
 *
 * @since 1.0.0
 */
export interface Matrix4x4<out Traits = unknown> extends Pipeable {
  readonly [Matrix4x4TypeId]: Matrix4x4TypeId
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
 * True only for values built by this module's constructors, which carry
 * the brand. A structural object with `m00`…`m33` fields does not match.
 *
 * @param m - The value to check.
 * @returns `true` if the value is a `Matrix4x4`, `false` otherwise.
 * @since 1.0.0
 */
export const isMatrix4x4: (m: unknown) => m is Matrix4x4 = internal.isMatrix4x4

/**
 * The 4×4 identity matrix.
 *
 * @since 2.0.0
 */
export const identity: Matrix4x4 = internal.identity

export const equals: {
  /**
   * Checks if two `Matrix4x4` instances are approximately equal.
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
  (a: Matrix4x4, b: Matrix4x4): boolean
  /**
   * Checks if two `Matrix4x4` instances are approximately equal.
   *
   * @param b - The second matrix.
   * @returns A function that takes the first matrix and returns the comparison result.
   * @since 2.0.0
   */
  (b: Matrix4x4): (a: Matrix4x4) => boolean
} = internal.equals

/**
 * Creates a new `Matrix4x4` instance, in row-major argument order.
 *
 * Within the first row, each omitted value copies the previous argument.
 * Each later row defaults to the first row's values. So `make(1, 2, 3, 4)`
 * repeats that row four times, `make(5)` fills the matrix with `5`, and
 * `make()` is the zero matrix.
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
 * @returns A new `Matrix4x4` instance.
 * @since 1.0.0
 */
export const fromColumns: (v0: Vector4, v1: Vector4, v2: Vector4, v3: Vector4) => Matrix4x4 =
  internal.fromColumns

export const setRow: {
  /**
   * Sets a row of a `Matrix4x4` to a new vector.
   *
   * @param m - The matrix to update.
   * @param row - The row to replace: `0`–`3` or `'x'`/`'y'`/`'z'`/`'w'`.
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
   * @param m - The matrix to update.
   * @param column - The column to replace: `0`–`3` or `'x'`/`'y'`/`'z'`/`'w'`.
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
 * Returns the 3×3 submatrix obtained by deleting one row and one column.
 *
 * The submatrix itself, not its determinant: take `Matrix3x3.determinant`
 * of the result for the scalar minor.
 *
 * @param m - The matrix to extract from.
 * @param row - The row to delete: `0`–`3` or `'x'`/`'y'`/`'z'`/`'w'`.
 * @param column - The column to delete, same selectors.
 * @returns The `Matrix3x3` left after deleting the row and column.
 * @since 1.0.0
 */
export const minor: (
  m: Matrix4x4,
  row: Matrix4x4Coordinate,
  column: Matrix4x4Coordinate,
) => Matrix3x3 = internal.minor

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
   * const m = Matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
   * const v = Vector4.make(17, 18, 19, 20)
   *
   * // x = 1 * 17 + 2 * 18 + 3 * 19 + 4 * 20 = 190
   * Matrix4x4.vectorProductLeft(m, v) // (190, 486, 782, 1078)
   * ```
   * @since 1.0.0
   */
  (m: Matrix4x4, v: Vector4): Vector4
  /**
   * Computes `M · v`: the matrix on the left, the vector as a column.
   *
   * @param v - The vector to transform.
   * @returns A function that takes a matrix and returns `M · v`.
   * @since 1.0.0
   */
  (v: Vector4): (m: Matrix4x4) => Vector4
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
   * const m = Matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
   * const v = Vector4.make(17, 18, 19, 20)
   *
   * // x = 1 * 17 + 5 * 18 + 9 * 19 + 13 * 20 = 538
   * Matrix4x4.vectorProductRight(m, v) // (538, 612, 686, 760)
   * ```
   * @since 1.0.0
   */
  (m: Matrix4x4, v: Vector4): Vector4
  /**
   * Computes `vᵀ · M`: the vector as a row, the matrix on the right.
   *
   * @param v - The vector to transform.
   * @returns A function that takes a matrix and returns `vᵀ · M`.
   * @since 1.0.0
   */
  (v: Vector4): (m: Matrix4x4) => Vector4
} = internal.vectorProductRight

export const multiply: {
  /**
   * Multiplies two `Matrix4x4` instances. Result is `a · b`.
   *
   * @param a - The left-hand matrix.
   * @param b - The right-hand matrix.
   * @returns The product matrix.
   * @since 2.0.0
   */
  (a: Matrix4x4, b: Matrix4x4): Matrix4x4
  /**
   * Multiplies two `Matrix4x4` instances. Result is `a · b`.
   *
   * @param b - The right-hand matrix.
   * @returns A function that takes the left-hand matrix and returns the product.
   * @since 2.0.0
   */
  (b: Matrix4x4): (a: Matrix4x4) => Matrix4x4
} = internal.multiply

// The implementation always runs the same det/threshold branch. For
// `Invertible`-branded matrices the empty branch is provably unreachable,
// but TS can't see that — the cast pairs the type-level promise with the
// runtime brand check.
export const inverse: {
  /**
   * Returns the inverse of an `Invertible`-branded `Matrix4x4`. Because the
   * brand guarantees non-singularity, the result is always a single matrix,
   * wrapped in `Solution.One`.
   *
   * @param m - The matrix to invert.
   * @returns The inverse, wrapped in `Solution.One`.
   * @since 2.0.0
   */
  <T extends Invertible>(m: Matrix4x4<T>): Solution.One<Matrix4x4<T>>
  /**
   * Returns the inverse of a `Matrix4x4`. Returns `Solution.none` if the
   * matrix is singular: its determinant falls below `RELATIVE_TOLERANCE`
   * times the Hadamard bound (see `PRECISION.md`). Use `asInvertible` or
   * `isInvertible` to refine the type and tighten the return to
   * `Solution.One`, or `inverseUnsafe` for the throwing form.
   *
   * @param m - The matrix to invert.
   * @returns The inverse in `Solution.One`, or `Solution.none` when singular.
   * @since 2.0.0
   */
  <T>(m: Matrix4x4<T>): Solution.AtMostOne<Matrix4x4<T>>
} = internal.inverse as never

/**
 * Returns the inverse of a `Matrix4x4`, throwing when the matrix is
 * singular. Useful when you've already validated invertibility out-of-band
 * and want the unwrapped matrix directly. Otherwise prefer `inverse`.
 *
 * @param m - The matrix to invert.
 * @returns The inverse matrix.
 * @throws `Error` when `m` is singular (below the Hadamard-bound threshold).
 * @since 2.0.0
 */
export const inverseUnsafe: (m: Matrix4x4) => Matrix4x4 = internal.inverseUnsafe

/**
 * Checks if a matrix is invertible: its determinant exceeds
 * `RELATIVE_TOLERANCE` times the Hadamard bound (the product of the row
 * norms), a scale-free singularity test. See `PRECISION.md` for the
 * mechanics.
 *
 * @param m - The matrix to check.
 * @returns `true` when `m` is invertible, narrowing to `Matrix4x4<T & Invertible>`.
 * @since 2.0.0
 */
export const isInvertible: <T>(m: Matrix4x4<T>) => m is Matrix4x4<T & Invertible> =
  internal.isInvertible

/**
 * Asserts that the matrix is invertible, throwing on a singular matrix.
 *
 * @param m - The matrix to assert against.
 * @returns The same matrix, typed with the `Invertible` brand.
 * @throws `Error` when `m` is singular (below the Hadamard-bound threshold).
 * @since 2.0.0
 */
export const asInvertible: <T>(m: Matrix4x4<T>) => Matrix4x4<T & Invertible> = internal.asInvertible

export const solveSystem: {
  /**
   * Solves the linear system `M · x = v` for `x`.
   *
   * Rejects only exact singularity: a determinant of exactly `0` throws.
   * A nearly singular system returns a result whose error grows with the
   * system's conditioning — the honest outcome for a construction (see
   * `PRECISION.md`).
   *
   * @param m - The coefficient matrix.
   * @param v - The constants of the system.
   * @returns The solution vector `x`.
   * @throws `Error` when the determinant is exactly `0`.
   * @since 1.0.0
   */
  (m: Matrix4x4, v: Vector4): Vector4
  /**
   * Solves the linear system `M · x = v` for `x`.
   *
   * @param v - The constants of the system.
   * @returns A function that takes the coefficient matrix and returns the solution vector.
   * @throws `Error` when the determinant is exactly `0`.
   * @since 1.0.0
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
   * @since 1.0.0
   */
  (m: Matrix4x4, row: Matrix4x4Coordinate): Vector4
  /**
   * Returns a row vector from a `Matrix4x4`.
   *
   * @param row - The row index.
   * @returns A function that takes a matrix and returns the row vector.
   * @since 1.0.0
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
   * @since 1.0.0
   */
  (m: Matrix4x4, column: Matrix4x4Coordinate): Vector4
  /**
   * Returns a column vector from a `Matrix4x4`.
   *
   * @param column - The column index.
   * @returns A function that takes a matrix and returns the column vector.
   * @since 1.0.0
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
