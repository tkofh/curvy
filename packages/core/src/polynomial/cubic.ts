import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type * as Solution from '../solution'
import type { Vector2 } from '../vector/vector2'
import type { Vector4 } from '../vector/vector4'
import * as internal from './cubic.internal'
import type { CubicPolynomialTypeId } from './cubic.internal.circular'
import type { Monotonicity } from './monotonicity'
import type { QuadraticPolynomial } from './quadratic'
import type { Decreasing, Increasing, Monotonic, PolynomialTraits } from './traits'

export type { Monotonic, Increasing, Decreasing } from './traits'

/**
 * A cubic polynomial.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the polynomial is refined via `isMonotonic` / `asMonotonic` and
 * friends. A cubic is monotonic only over an interval that avoids both of its
 * extrema (or globally, when c2 = c3 = 0 and c1 ≠ 0).
 *
 * @since 1.0.0
 */
export interface CubicPolynomial<out Traits = unknown> extends Pipeable {
  readonly [CubicPolynomialTypeId]: CubicPolynomialTypeId
  readonly [PolynomialTraits]: Traits

  /**
   * The coefficient of the x^0 term.
   */
  readonly c0: number
  /**
   * The coefficient of the x^1 term.
   */
  readonly c1: number
  /**
   * The coefficient of the x^2 term.
   */
  readonly c2: number
  /**
   * The coefficient of the x^3 term.
   */
  readonly c3: number
}

/**
 * Checks if a value is a `CubicPolynomial`.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a `CubicPolynomial`, `false` otherwise.
 * @since 1.0.0
 */
export const isCubicPolynomial: (value: unknown) => value is CubicPolynomial =
  internal.isCubicPolynomial

export const equals: {
  /**
   * Checks if two `CubicPolynomial` instances are approximately equal within
   * the default absolute tolerance ({@link EPSILON}).
   *
   * @param a - The first polynomial.
   * @param b - The second polynomial.
   * @returns `true` when each pair of coefficients is within tolerance.
   * @since 1.1.0
   */
  (a: CubicPolynomial, b: CubicPolynomial): boolean
  /**
   * Checks if two `CubicPolynomial` instances are approximately equal within
   * the default absolute tolerance ({@link EPSILON}).
   *
   * @param b - The second polynomial.
   * @returns A function that takes the first polynomial and returns the comparison result.
   * @since 1.1.0
   */
  (b: CubicPolynomial): (a: CubicPolynomial) => boolean
} = internal.equals

/**
 * Creates a new `CubicPolynomial` instance.
 *
 * @param c0 - The coefficient of the x^0 term.
 * @param c1 - The coefficient of the x^1 term.
 * @param c2 - The coefficient of the x^2 term.
 * @param c3 - The coefficient of the x^3 term.
 */
export const make: (c0: number, c1: number, c2: number, c3: number) => CubicPolynomial =
  internal.make

/**
 * Creates a new `CubicPolynomial` instance from a vector.
 *
 * @param v - The vector to convert.
 * @returns A new `CubicPolynomial` instance.
 * @since 1.0.0
 */
export const fromVector: (v: Vector4) => CubicPolynomial = internal.fromVector

/**
 * Creates a new `CubicPolynomial` that interpolates the four given points,
 * treating each `Vector2` as an `(x, y)` pair. The four input `x` values must
 * be distinct.
 *
 * @param p0 - The first point.
 * @param p1 - The second point.
 * @param p2 - The third point.
 * @param p3 - The fourth point.
 * @returns The unique cubic polynomial passing through the four points.
 * @since 2.0.0
 */
export const fromPoints: (p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) => CubicPolynomial =
  internal.fromPoints

export const solve: {
  /**
   * Solves a cubic polynomial for a given value of x.
   *
   * @param p - The cubic polynomial to solve.
   * @param x - The value of x to solve for.
   * @returns The result of the polynomial evaluation at x.
   * @since 1.0.0
   */
  (p: CubicPolynomial, x: number): number
  /**
   * Solves a cubic polynomial for a given value of x.
   *
   * @param x - The value of x to solve for.
   * @returns A function that takes a cubic polynomial and returns the result of the polynomial evaluation at x.
   * @since 1.0.0
   */
  (x: number): (p: CubicPolynomial) => number
} = internal.solve

/**
 * Converts a cubic polynomial to a solver function.
 *
 * @param p - The cubic polynomial to convert.
 * @returns A function that takes a value of x and returns the result of the polynomial evaluation at x.
 * @since 1.0.0
 */
export const toSolver: (p: CubicPolynomial) => (x: number) => number = internal.toSolver

export const solveInverse: {
  /**
   * Solves a monotonic cubic polynomial for a given value of y. Because the
   * polynomial is strictly monotonic, the inverse has at most one solution.
   *
   * @param p - The monotonic cubic polynomial.
   * @param y - The value of y to solve for.
   * @returns Zero or one solutions.
   * @since 2.0.0
   */
  <T extends Monotonic>(p: CubicPolynomial<T>, y: number): Solution.AtMostOne<number>
  /**
   * Solves a cubic polynomial for a given value of y.
   *
   * @param p - The cubic polynomial to solve.
   * @param y - The value of y to solve for.
   * @returns The roots of the polynomial equation p(x) = y.
   * @since 1.0.0
   */
  <T>(p: CubicPolynomial<T>, y: number): Solution.AtMostThree<number>
  /**
   * Solves a cubic polynomial for a given value of y.
   *
   * @param y - The value of y to solve for.
   * @returns A function that takes a cubic polynomial and returns the roots
   *   of the polynomial equation p(x) = y. Tightens to `Solution.AtMostOne<number>` for
   *   monotonic inputs.
   * @since 1.0.0
   */
  (y: number): {
    <T extends Monotonic>(p: CubicPolynomial<T>): Solution.AtMostOne<number>
    <T>(p: CubicPolynomial<T>): Solution.AtMostThree<number>
  }
} = internal.solveInverse as never

/**
 * Converts a cubic polynomial to an inverse solver function.
 *
 * @param p - The cubic polynomial to convert.
 * @returns A function that takes a value of y and returns the roots of the polynomial equation p(x) = y.
 * @since 1.0.0
 */
export const toInverseSolver: (p: CubicPolynomial) => (y: number) => Solution.AtMostThree<number> =
  internal.toInverseSolver

/**
 * Calculates the derivative of a cubic polynomial.
 *
 * @param p - The cubic polynomial to differentiate.
 * @returns The derivative of the cubic polynomial.
 * @since 1.0.0
 */
export const derivative: (p: CubicPolynomial) => QuadraticPolynomial = internal.derivative

/**
 * Calculates the roots of a cubic polynomial.
 *
 * @param p - The cubic polynomial to find the roots of.
 * @returns The roots of the cubic polynomial.
 * @since 1.0.0
 */
export const roots: (p: CubicPolynomial) => Solution.AtMostThree<number> = internal.roots

/**
 * Calculates the extrema of a cubic polynomial.
 *
 * @param p - The cubic polynomial to find the extrema of.
 * @returns The extrema of the cubic polynomial.
 * @since 1.0.0
 */
export const extrema: (p: CubicPolynomial) => Solution.AtMostTwo<number> = internal.extrema

export const monotonicity: {
  /**
   * Calculates the monotonicity of a cubic polynomial. Throws when the
   * interval has zero width — the question is undefined at a single point.
   *
   * @param p - The cubic polynomial to analyze.
   * @param i - The interval to restrict the analysis to.
   * @returns The monotonicity of the cubic polynomial in the specified interval.
   * @since 1.0.0
   */
  (p: CubicPolynomial, i?: Interval): Monotonicity
  /**
   * Calculates the monotonicity of a cubic polynomial. Throws when the
   * interval has zero width.
   *
   * @param i - The interval to restrict the analysis to.
   * @returns A function that takes a cubic polynomial and returns the
   *   monotonicity of the cubic polynomial in the specified interval.
   * @since 1.0.0
   */
  (i: Interval): (p: CubicPolynomial) => Monotonicity
} = internal.monotonicity

/**
 * Type-narrowing predicate: refines a `CubicPolynomial<T>` to
 * `CubicPolynomial<T & Monotonic>` when the polynomial is strictly monotonic
 * over the given interval (or globally, when no interval is given).
 *
 * @param p - The cubic polynomial to check.
 * @param i - Optional interval over which to check monotonicity.
 * @returns `true` when monotonicity is `'increasing'` or `'decreasing'`.
 * @since 2.0.0
 */
export const isMonotonic: {
  <T>(p: CubicPolynomial<T>, i?: Interval): p is CubicPolynomial<T & Monotonic>
  (i: Interval): <T>(p: CubicPolynomial<T>) => p is CubicPolynomial<T & Monotonic>
} = internal.isMonotonic

/**
 * Type-narrowing predicate: refines to `CubicPolynomial<T & Increasing>`.
 *
 * @since 2.0.0
 */
export const isIncreasing: {
  <T>(p: CubicPolynomial<T>, i?: Interval): p is CubicPolynomial<T & Increasing>
  (i: Interval): <T>(p: CubicPolynomial<T>) => p is CubicPolynomial<T & Increasing>
} = internal.isIncreasing

/**
 * Type-narrowing predicate: refines to `CubicPolynomial<T & Decreasing>`.
 *
 * @since 2.0.0
 */
export const isDecreasing: {
  <T>(p: CubicPolynomial<T>, i?: Interval): p is CubicPolynomial<T & Decreasing>
  (i: Interval): <T>(p: CubicPolynomial<T>) => p is CubicPolynomial<T & Decreasing>
} = internal.isDecreasing

/**
 * Asserts that the cubic polynomial is monotonic, throwing on failure.
 *
 * @param p - The cubic polynomial to assert against.
 * @param i - Optional interval over which to check monotonicity.
 * @returns The same polynomial, typed with the `Monotonic` brand.
 * @throws When the polynomial is not monotonic over the given (or global) interval.
 * @since 2.0.0
 */
export const asMonotonic: <T>(
  p: CubicPolynomial<T>,
  i?: Interval,
) => CubicPolynomial<T & Monotonic> = internal.asMonotonic

/**
 * Asserts that the cubic polynomial is increasing, throwing on failure.
 *
 * @since 2.0.0
 */
export const asIncreasing: <T>(
  p: CubicPolynomial<T>,
  i?: Interval,
) => CubicPolynomial<T & Increasing> = internal.asIncreasing

/**
 * Asserts that the cubic polynomial is decreasing, throwing on failure.
 *
 * @since 2.0.0
 */
export const asDecreasing: <T>(
  p: CubicPolynomial<T>,
  i?: Interval,
) => CubicPolynomial<T & Decreasing> = internal.asDecreasing

export const domain: {
  /**
   * Calculates the domain of a cubic polynomial.
   *
   * @param p - The cubic polynomial to analyze.
   * @param range - The range to restrict the analysis to.
   * @returns The domain of the cubic polynomial in the specified range.
   * @since 1.0.0
   */
  (p: CubicPolynomial, range: Interval): Interval
  /**
   * Calculates the domain of a cubic polynomial.
   *
   * @param range - The range to restrict the analysis to.
   * @returns A function that takes a cubic polynomial and returns the domain of the cubic polynomial in the specified range.
   * @since 1.0.0
   */
  (range: Interval): (p: CubicPolynomial) => Interval
} = internal.domain

export const range: {
  /**
   * Calculates the range of a cubic polynomial.
   *
   * @param p - The cubic polynomial to analyze.
   * @param domain - The domain to restrict the analysis to.
   * @returns The range of the cubic polynomial in the specified domain.
   * @since 1.0.0
   */
  (p: CubicPolynomial, domain: Interval): Interval
  /**
   * Calculates the range of a cubic polynomial.
   *
   * @param domain - The domain to restrict the analysis to.
   * @returns A function that takes a cubic polynomial and returns the range of the cubic polynomial in the specified domain.
   * @since 1.0.0
   */
  (domain: Interval): (p: CubicPolynomial) => Interval
} = internal.range

export const length: {
  /**
   * Calculates the length of a cubic polynomial.
   *
   * @param p - The cubic polynomial to analyze.
   * @param domain - The domain to restrict the analysis to.
   * @returns The length of the cubic polynomial in the specified domain.
   * @since 1.0.0
   */
  (p: CubicPolynomial, domain: Interval): number
  /**
   * Calculates the length of a cubic polynomial.
   *
   * @param domain - The domain to restrict the analysis to.
   * @returns A function that takes a cubic polynomial and returns the length of the cubic polynomial in the specified domain.
   * @since 1.0.0
   */
  (domain: Interval): (p: CubicPolynomial) => number
} = internal.length

export const curvature: {
  /**
   * Calculates the curvature of a cubic polynomial.
   *
   * @param p - The cubic polynomial to analyze.
   * @param x - The value of x to calculate the curvature at.
   * @returns The curvature of the cubic polynomial at the specified value of x.
   * @since 1.0.0
   */
  (p: CubicPolynomial, x: number): number
  /**
   * Calculates the curvature of a cubic polynomial.
   *
   * @param x - The value of x to calculate the curvature at.
   * @returns A function that takes a cubic polynomial and returns the curvature of the cubic polynomial at the specified value of x.
   * @since 1.0.0
   */
  (x: number): (p: CubicPolynomial) => number
} = internal.curvature
