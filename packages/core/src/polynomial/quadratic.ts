import type { Closed, Interval } from '../interval/interval'
import type { Pipeable } from '../utils'
import type * as Solution from '../solution/solution'
import type { Vector2 } from '../vector/vector2'
import type { Vector3 } from '../vector/vector3'
import type { CubicPolynomial } from './cubic'
import type { LinearPolynomial } from './linear'
import type { Monotonicity } from './monotonicity'
import * as internal from './quadratic.internal'
import type { QuadraticPolynomialTypeId } from './quadratic.internal.circular'
import type { Decreasing, Increasing, Monotonic, PolynomialTraits } from './traits'

export type { Monotonic, Increasing, Decreasing } from './traits'

/**
 * A quadratic polynomial.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the polynomial is refined via `isMonotonic` / `asMonotonic` and
 * friends. Refinements may be parameterized by an `Interval` — a quadratic is
 * monotonic on an interval that avoids its extremum, even though it is not
 * monotonic globally.
 *
 * @since 1.0.0
 */
export interface QuadraticPolynomial<out Traits = unknown> extends Pipeable {
  readonly [QuadraticPolynomialTypeId]: QuadraticPolynomialTypeId
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
}

/**
 * Checks if a value is a `QuadraticPolynomial`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `QuadraticPolynomial`, `false` otherwise.
 * @since 1.0.0
 */
export const isQuadraticPolynomial: (v: unknown) => v is QuadraticPolynomial =
  internal.isQuadraticPolynomial

export const equals: {
  /**
   * Checks if two `QuadraticPolynomial` instances are approximately equal
   * within the default absolute tolerance ({@link EPSILON}).
   *
   * @param a - The first polynomial.
   * @param b - The second polynomial.
   * @returns `true` when each pair of coefficients is within tolerance.
   * @since 1.1.0
   */
  (a: QuadraticPolynomial, b: QuadraticPolynomial): boolean
  /**
   * Checks if two `QuadraticPolynomial` instances are approximately equal
   * within the default absolute tolerance ({@link EPSILON}).
   *
   * @param b - The second polynomial.
   * @returns A function that takes the first polynomial and returns the comparison result.
   * @since 1.1.0
   */
  (b: QuadraticPolynomial): (a: QuadraticPolynomial) => boolean
} = internal.equals

/**
 * Creates a new `QuadraticPolynomial` instance.
 *
 * @param c0 - The coefficient of the x^0 term. Defaults to 0.
 * @param c1 - The coefficient of the x^1 term. Defaults to 0.
 * @param c2 - The coefficient of the x^2 term. Defaults to 1.
 * @returns A new `QuadraticPolynomial` instance.
 * @since 1.0.0
 */
export const make: (c0?: number, c1?: number, c2?: number) => QuadraticPolynomial = internal.make

/**
 * Creates a new `QuadraticPolynomial` instance from a vector.
 *
 * @param v - The vector to create the polynomial from.
 * @returns A new `QuadraticPolynomial` instance.
 * @since 1.0.0
 */
export const fromVector: (v: Vector3) => QuadraticPolynomial = internal.fromVector

/**
 * Creates a new `QuadraticPolynomial` that interpolates the three given
 * points, treating each `Vector2` as an `(x, y)` pair. The three input `x`
 * values must be distinct.
 *
 * @param p0 - The first point.
 * @param p1 - The second point.
 * @param p2 - The third point.
 * @returns The unique quadratic polynomial passing through the three points.
 * @since 2.0.0
 */
export const fromPoints: (p0: Vector2, p1: Vector2, p2: Vector2) => QuadraticPolynomial =
  internal.fromPoints

export const solve: {
  /**
   * Solves the quadratic polynomial for a given x value.
   *
   * @param p - The quadratic polynomial.
   * @param x - The x value to solve for.
   * @returns The result of the polynomial at the given x value.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, x: number): number
  /**
   * Solves the quadratic polynomial for a given x value.
   *
   * @param x - The x value to solve for.
   * @returns A function that takes a quadratic polynomial and returns the result of the polynomial at the given x value.
   * @since 1.0.0
   */
  (x: number): (p: QuadraticPolynomial) => number
} = internal.solve

/**
 * Creates a solver function for the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns A function that takes an x value and returns the result of the polynomial at that x value.
 */
export const toSolver: (p: QuadraticPolynomial) => (x: number) => number = internal.toSolver

export const solveInverse: {
  /**
   * Solves a monotonic quadratic polynomial for a given y value. Because the
   * polynomial is strictly monotonic (either globally, or over the interval
   * the `Monotonic` brand was attached for), the inverse has at most one
   * solution.
   *
   * @param p - The monotonic quadratic polynomial.
   * @param y - The y value to solve for.
   * @returns Zero or one solutions.
   * @since 2.0.0
   */
  <T extends Monotonic>(p: QuadraticPolynomial<T>, y: number): Solution.AtMostOne<number>
  /**
   * Solves the quadratic polynomial for a given y value.
   *
   * @param p - The quadratic polynomial.
   * @param y - The y value to solve for.
   * @returns The solutions to the polynomial at the given y value.
   * @since 1.0.0
   */
  <T>(p: QuadraticPolynomial<T>, y: number): Solution.AtMostTwo<number>
  /**
   * Solves the quadratic polynomial for a given y value.
   *
   * @param y - The y value to solve for.
   * @returns A function that takes a quadratic polynomial and returns the
   *   solutions. Tightens to `Solution.AtMostOne<number>` for monotonic inputs.
   * @since 1.0.0
   */
  (y: number): {
    <T extends Monotonic>(p: QuadraticPolynomial<T>): Solution.AtMostOne<number>
    <T>(p: QuadraticPolynomial<T>): Solution.AtMostTwo<number>
  }
} = internal.solveInverse as never

/**
 * Creates an inverse solver function for the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns A function that takes a y value and returns the solutions to the polynomial at that y value.
 */
export const toInverseSolver: (
  p: QuadraticPolynomial,
) => (y: number) => Solution.AtMostTwo<number> = internal.toInverseSolver

/**
 * Computes the derivative of the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns The derivative of the polynomial as a linear polynomial.
 * @since 1.0.0
 */
export const derivative: (p: QuadraticPolynomial) => LinearPolynomial = internal.derivative

/**
 * Finds the roots of the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns The roots of the polynomial as a tuple of solutions.
 * @since 1.0.0
 */
export const roots: (p: QuadraticPolynomial) => Solution.AtMostTwo<number> = internal.roots

/**
 * Finds the extreme point of the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns The extreme point of the polynomial as a solution.
 * @since 1.0.0
 */
export const extreme: (p: QuadraticPolynomial) => Vector2 | null = internal.extreme

export const monotonicity: {
  /**
   * Computes the monotonicity of the quadratic polynomial over a given
   * interval. Throws when the interval has zero width — the question is
   * undefined at a single point.
   *
   * @param p - The quadratic polynomial.
   * @param i - The interval to compute the monotonicity over.
   * @returns The monotonicity of the polynomial over the interval.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, i?: Interval): Monotonicity
  /**
   * Computes the monotonicity of the quadratic polynomial over a given
   * interval. Throws when the interval has zero width.
   *
   * @param i - The interval to compute the monotonicity over.
   * @returns A function that takes a quadratic polynomial and returns the
   *   monotonicity of the polynomial over the interval.
   * @since 1.0.0
   */
  (i: Interval): (p: QuadraticPolynomial) => Monotonicity
} = internal.monotonicity

/**
 * Type-narrowing predicate: refines a `QuadraticPolynomial<T>` to
 * `QuadraticPolynomial<T & Monotonic>` when the polynomial is strictly
 * monotonic over the given interval (or globally, when no interval is given).
 *
 * @param p - The quadratic polynomial to check.
 * @param i - Optional interval over which to check monotonicity.
 * @returns `true` when monotonicity is `'increasing'` or `'decreasing'`.
 * @since 2.0.0
 */
export const isMonotonic: {
  <T>(p: QuadraticPolynomial<T>, i?: Interval): p is QuadraticPolynomial<T & Monotonic>
  (i: Interval): <T>(p: QuadraticPolynomial<T>) => p is QuadraticPolynomial<T & Monotonic>
} = internal.isMonotonic

/**
 * Type-narrowing predicate: refines to `QuadraticPolynomial<T & Increasing>`.
 *
 * @since 2.0.0
 */
export const isIncreasing: {
  <T>(p: QuadraticPolynomial<T>, i?: Interval): p is QuadraticPolynomial<T & Increasing>
  (i: Interval): <T>(p: QuadraticPolynomial<T>) => p is QuadraticPolynomial<T & Increasing>
} = internal.isIncreasing

/**
 * Type-narrowing predicate: refines to `QuadraticPolynomial<T & Decreasing>`.
 *
 * @since 2.0.0
 */
export const isDecreasing: {
  <T>(p: QuadraticPolynomial<T>, i?: Interval): p is QuadraticPolynomial<T & Decreasing>
  (i: Interval): <T>(p: QuadraticPolynomial<T>) => p is QuadraticPolynomial<T & Decreasing>
} = internal.isDecreasing

/**
 * Asserts that the quadratic polynomial is monotonic, throwing on failure.
 *
 * @param p - The quadratic polynomial to assert against.
 * @param i - Optional interval over which to check monotonicity.
 * @returns The same polynomial, typed with the `Monotonic` brand.
 * @throws When the polynomial is not monotonic over the given (or global) interval.
 * @since 2.0.0
 */
export const asMonotonic: <T>(
  p: QuadraticPolynomial<T>,
  i?: Interval,
) => QuadraticPolynomial<T & Monotonic> = internal.asMonotonic

/**
 * Asserts that the quadratic polynomial is increasing, throwing on failure.
 *
 * @since 2.0.0
 */
export const asIncreasing: <T>(
  p: QuadraticPolynomial<T>,
  i?: Interval,
) => QuadraticPolynomial<T & Increasing> = internal.asIncreasing

/**
 * Asserts that the quadratic polynomial is decreasing, throwing on failure.
 *
 * @since 2.0.0
 */
export const asDecreasing: <T>(
  p: QuadraticPolynomial<T>,
  i?: Interval,
) => QuadraticPolynomial<T & Decreasing> = internal.asDecreasing

export const antiderivative: {
  /**
   * Computes the antiderivative of the quadratic polynomial.
   *
   * @param p - The quadratic polynomial.
   * @param constant - The constant of integration. Defaults to 0.
   * @returns The antiderivative of the polynomial as a cubic polynomial.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, constant?: number): CubicPolynomial
  /**
   * Computes the antiderivative of the quadratic polynomial.
   *
   * @param constant - The constant of integration. Defaults to 0.
   * @returns A function that takes a quadratic polynomial and returns the antiderivative of the polynomial as a cubic polynomial.
   * @since 1.0.0
   */
  (constant: number): (p: QuadraticPolynomial) => CubicPolynomial
} = internal.antiderivative

export const domain: {
  /**
   * Computes the domain of the quadratic polynomial over a given range.
   *
   * @param p - The quadratic polynomial.
   * @param range - The range to compute the domain over.
   * @returns The domain of the polynomial over the range.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, range: Interval): Solution.AtMostOne<Interval>
  /**
   * Computes the domain of the quadratic polynomial over a given range.
   *
   * @param range - The range to compute the domain over.
   * @returns A function that takes a quadratic polynomial and returns the domain of the polynomial over the range.
   * @since 1.0.0
   */
  (range: Interval): (p: QuadraticPolynomial) => Solution.AtMostOne<Interval>
} = internal.domain

export const range: {
  /**
   * Computes the range of the quadratic polynomial over a given domain.
   *
   * @param p - The quadratic polynomial.
   * @param domain - The domain to compute the range over.
   * @returns The range of the polynomial over the domain.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, domain: Interval): Closed
  /**
   * Computes the range of the quadratic polynomial over a given domain.
   *
   * @param domain - The domain to compute the range over.
   * @returns A function that takes a quadratic polynomial and returns the range of the polynomial over the domain.
   * @since 1.0.0
   */
  (domain: Interval): (p: QuadraticPolynomial) => Closed
} = internal.range

export const length: {
  /**
   * Computes the length of the quadratic polynomial over a given interval.
   *
   * @param p - The quadratic polynomial.
   * @param i - The interval to compute the length over.
   * @returns The length of the polynomial over the interval.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, i: Interval): number
  /**
   * Computes the length of the quadratic polynomial over a given interval.
   *
   * @param i - The interval to compute the length over.
   * @returns A function that takes a quadratic polynomial and returns the length of the polynomial over the interval.
   * @since 1.0.0
   */
  (i: Interval): (p: QuadraticPolynomial) => number
} = internal.length

export const curvature: {
  /**
   * Computes the curvature of the quadratic polynomial at a given x value.
   *
   * @param p - The quadratic polynomial.
   * @param x - The x value to compute the curvature at.
   * @returns The curvature of the polynomial at the given x value.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, x: number): number
  /**
   * Computes the curvature of the quadratic polynomial at a given x value.
   *
   * @param x - The x value to compute the curvature at.
   * @returns A function that takes a quadratic polynomial and returns the curvature of the polynomial at the given x value.
   * @since 1.0.0
   */
  (x: number): (p: QuadraticPolynomial) => number
} = internal.curvature
