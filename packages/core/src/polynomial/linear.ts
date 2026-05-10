import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type * as Solution from '../solution'
import type { Vector2 } from '../vector/vector2'
import type { LinearPolynomialTypeId } from './linear.internal'
import * as internal from './linear.internal'
import type { GuaranteedMonotonicity } from './monotonicity'
import type { QuadraticPolynomial } from './quadratic'
import type { Decreasing, Increasing, Monotonic, PolynomialTraits } from './traits'

export type { Monotonic, Increasing, Decreasing } from './traits'

/**
 * A linear polynomial.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the polynomial is refined via `isMonotonic` / `asMonotonic` and
 * friends. The runtime value carries no trait data — `Traits` only flows
 * through the type system to enable tighter return types on operations like
 * `solveInverse`.
 *
 * @since 1.0.0
 */
export interface LinearPolynomial<out Traits = unknown> extends Pipeable {
  readonly [LinearPolynomialTypeId]: LinearPolynomialTypeId
  readonly [PolynomialTraits]: Traits

  /**
   * The coefficient of the x^0 term.
   */
  readonly c0: number

  /**
   * The coefficient of the x^1 term.
   */
  readonly c1: number
}

/**
 * Checks if a value is a `LinearPolynomial`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `LinearPolynomial`, `false` otherwise.
 * @since 1.0.0
 */
export const isLinearPolynomial: (v: unknown) => v is LinearPolynomial = internal.isLinearPolynomial

export const equals: {
  /**
   * Checks if two `LinearPolynomial` instances are approximately equal within
   * the default absolute tolerance ({@link EPSILON}).
   *
   * @param a - The first polynomial.
   * @param b - The second polynomial.
   * @returns `true` when each pair of coefficients is within tolerance.
   * @since 1.1.0
   */
  (a: LinearPolynomial, b: LinearPolynomial): boolean
  /**
   * Checks if two `LinearPolynomial` instances are approximately equal within
   * the default absolute tolerance ({@link EPSILON}).
   *
   * @param b - The second polynomial.
   * @returns A function that takes the first polynomial and returns the comparison result.
   * @since 1.1.0
   */
  (b: LinearPolynomial): (a: LinearPolynomial) => boolean
} = internal.equals

/**
 * Creates a new `LinearPolynomial` instance.
 *
 * @param c0 - The coefficient of the x^0 term. Defaults to 0.
 * @param c1 - The coefficient of the x^1 term. Defaults to 0.
 * @returns A new `LinearPolynomial` instance.
 * @since 1.0.0
 */
export const make: (c0?: number, c1?: number) => LinearPolynomial = internal.make

/**
 * Creates a new `LinearPolynomial` instance from a vector.
 *
 * @param v - The vector to create the polynomial from.
 * @returns A new `LinearPolynomial` instance.
 * @since 1.0.0
 */
export const fromVector: (v: Vector2) => LinearPolynomial = internal.fromVector

/**
 * Creates a new `LinearPolynomial` instance from a point and slope.
 *
 * @param p - The point on the line.
 * @param slope - The slope of the line.
 * @returns A new `LinearPolynomial` instance.
 * @since 1.0.0
 */
export const fromPointSlope: (p: Vector2, slope: number) => LinearPolynomial =
  internal.fromPointSlope

/**
 * Creates a new `LinearPolynomial` instance from two points.
 *
 * @param p1 - The first point.
 * @param p2 - The second point.
 * @returns A new `LinearPolynomial` instance.
 * @since 1.0.0
 */
export const fromPoints: (p1: Vector2, p2: Vector2) => LinearPolynomial = internal.fromPoints

export const solve: {
  /**
   * Solves a linear polynomial for a given value of x.
   *
   * @param p - The linear polynomial to solve.
   * @param x - The value of x to solve for.
   * @returns The result of the polynomial evaluated at x.
   * @since 1.0.0
   */
  (p: LinearPolynomial, x: number): number
  /**
   * Solves a linear polynomial for a given value of x.
   *
   * @param x - The value of x to solve for.
   * @returns A function that takes a `LinearPolynomial` and returns the result of the polynomial evaluated at x.
   * @since 1.0.0
   */
  (x: number): (p: LinearPolynomial) => number
} = internal.solve

/**
 * Converts a linear polynomial to a solver function.
 *
 * @param p - The linear polynomial to convert.
 * @returns A function that takes a value of x and returns the result of the polynomial evaluated at x.
 * @since 1.0.0
 */
export const toSolver: (p: LinearPolynomial) => (x: number) => number = internal.toSolver

// The implementation always runs the same `c1 === 0 ? Solution.none : ...`
// branch. For `Monotonic`-branded polynomials the empty branch is provably
// unreachable, but TS can't see that — the cast pairs the type-level promise
// with the runtime brand check.
export const solveInverse: {
  /**
   * Solves a monotonic linear polynomial for a given value of y. Because the
   * polynomial is strictly monotonic, the inverse always has exactly one
   * solution — wrapped in `Solution.One`.
   *
   * @param p - The monotonic linear polynomial to solve.
   * @param y - The value of y to solve for.
   * @since 2.0.0
   */
  <T extends Monotonic>(p: LinearPolynomial<T>, y: number): Solution.One<number>
  /**
   * Solves a linear polynomial for a given value of y. Returns `Solution.none`
   * for constant polynomials (no inverse).
   *
   * @param p - The linear polynomial to solve.
   * @param y - The value of y to solve for.
   * @since 1.0.0
   */
  <T>(p: LinearPolynomial<T>, y: number): Solution.AtMostOne<number>
  /** @since 1.0.0 */
  (y: number): {
    <T extends Monotonic>(p: LinearPolynomial<T>): Solution.One<number>
    <T>(p: LinearPolynomial<T>): Solution.AtMostOne<number>
  }
} = internal.solveInverse as never

/**
 * Converts a linear polynomial to an inverse solver function.
 *
 * @param p - The linear polynomial to convert.
 * @since 1.0.0
 */
export const toInverseSolver: (p: LinearPolynomial) => (y: number) => Solution.AtMostOne<number> =
  internal.toInverseSolver

/**
 * Finds the roots of a linear polynomial.
 *
 * @param p - The linear polynomial to find the roots of.
 * @since 1.0.0
 */
export const root: (p: LinearPolynomial) => Solution.AtMostOne<number> = (p) =>
  internal.solveInverse(p, 0)

/**
 * Calculates the monotonicity of a linear polynomial.
 *
 * @param p - The linear polynomial to check.
 * @returns The guaranteed monotonicity of the polynomial.
 * @since 1.0.0
 */
export const monotonicity: (p: LinearPolynomial) => GuaranteedMonotonicity = internal.monotonicity

/**
 * Type-narrowing predicate: refines a `LinearPolynomial<T>` to
 * `LinearPolynomial<T & Monotonic>` when the polynomial is strictly monotonic.
 *
 * @param p - The linear polynomial to check.
 * @returns `true` when `monotonicity(p)` is `'increasing'` or `'decreasing'`.
 * @since 2.0.0
 */
export const isMonotonic: <T>(p: LinearPolynomial<T>) => p is LinearPolynomial<T & Monotonic> =
  internal.isMonotonic

/**
 * Type-narrowing predicate: refines to `LinearPolynomial<T & Increasing>`.
 *
 * @param p - The linear polynomial to check.
 * @returns `true` when `monotonicity(p)` is `'increasing'`.
 * @since 2.0.0
 */
export const isIncreasing: <T>(p: LinearPolynomial<T>) => p is LinearPolynomial<T & Increasing> =
  internal.isIncreasing

/**
 * Type-narrowing predicate: refines to `LinearPolynomial<T & Decreasing>`.
 *
 * @param p - The linear polynomial to check.
 * @returns `true` when `monotonicity(p)` is `'decreasing'`.
 * @since 2.0.0
 */
export const isDecreasing: <T>(p: LinearPolynomial<T>) => p is LinearPolynomial<T & Decreasing> =
  internal.isDecreasing

/**
 * Asserts that the linear polynomial is monotonic, throwing on failure.
 *
 * @param p - The linear polynomial to assert against.
 * @returns The same polynomial, typed with the `Monotonic` brand.
 * @throws When `monotonicity(p)` is `'constant'`.
 * @since 2.0.0
 */
export const asMonotonic: <T>(p: LinearPolynomial<T>) => LinearPolynomial<T & Monotonic> =
  internal.asMonotonic

/**
 * Asserts that the linear polynomial is increasing, throwing on failure.
 *
 * @param p - The linear polynomial to assert against.
 * @returns The same polynomial, typed with the `Increasing` brand.
 * @throws When `monotonicity(p)` is not `'increasing'`.
 * @since 2.0.0
 */
export const asIncreasing: <T>(p: LinearPolynomial<T>) => LinearPolynomial<T & Increasing> =
  internal.asIncreasing

/**
 * Asserts that the linear polynomial is decreasing, throwing on failure.
 *
 * @param p - The linear polynomial to assert against.
 * @returns The same polynomial, typed with the `Decreasing` brand.
 * @throws When `monotonicity(p)` is not `'decreasing'`.
 * @since 2.0.0
 */
export const asDecreasing: <T>(p: LinearPolynomial<T>) => LinearPolynomial<T & Decreasing> =
  internal.asDecreasing

/**
 * Calculates the derivative of a linear polynomial.
 *
 * @param p - The linear polynomial to differentiate.
 * @returns The derivative of the linear polynomial.
 * @since 1.0.0
 */
export const derivative: (p: LinearPolynomial) => number = internal.derivative

export const antiderivative: {
  /**
   * Calculates the antiderivative of a linear polynomial.
   *
   * @param p - The linear polynomial to integrate.
   * @param constant - The constant of integration. Defaults to 0.
   * @returns The antiderivative of the linear polynomial.
   * @since 1.0.0
   */
  (p: LinearPolynomial, constant?: number): QuadraticPolynomial
  /**
   * Calculates the antiderivative of a linear polynomial.
   *
   * @param constant - The constant of integration. Defaults to 0.
   * @returns A function that takes a `LinearPolynomial` and returns the antiderivative of the polynomial.
   * @since 1.0.0
   */
  (constant: number): (p: LinearPolynomial) => QuadraticPolynomial
} = internal.antiderivative

export const domain: {
  /**
   * Calculates the domain of a linear polynomial.
   *
   * @param p - The linear polynomial to check.
   * @param range - The range to check against.
   * @returns The domain of the polynomial within the given range.
   * @since 1.0.0
   */
  (p: LinearPolynomial, range: Interval): Solution.AtMostOne<Interval>
  /**
   * Calculates the domain of a linear polynomial.
   *
   * @param range - The range to check against.
   * @returns A function that takes a `LinearPolynomial` and returns the domain of the polynomial within the given range.
   * @since 1.0.0
   */
  (range: Interval): (p: LinearPolynomial) => Solution.AtMostOne<Interval>
} = internal.domain

export const range: {
  /**
   * Calculates the range of a linear polynomial.
   *
   * @param p - The linear polynomial to check.
   * @param domain - The domain to check against.
   * @returns The range of the polynomial within the given domain.
   * @since 1.0.0
   */
  (p: LinearPolynomial, domain: Interval): Interval
  /**
   * Calculates the range of a linear polynomial.
   *
   * @param domain - The domain to check against.
   * @returns A function that takes a `LinearPolynomial` and returns the range of the polynomial within the given domain.
   * @since 1.0.0
   */
  (domain: Interval): (p: LinearPolynomial) => Interval
} = internal.range

export const length: {
  /**
   * Calculates the length of a linear polynomial within a particular domain `Interval`.
   *
   * @param p - The linear polynomial to analyze.
   * @param domain - The domain to restrict the analysis to.
   * @returns The length of the linear polynomial in the specified domain.
   * @since 1.0.0
   */
  (p: LinearPolynomial, domain: Interval): number
  /**
   * Calculates the length of a linear polynomial within a particular domain `Interval`.
   *
   * @param domain - The domain to restrict the analysis to.
   * @returns A function that takes a `LinearPolynomial` and returns the length of the polynomial in the specified domain.
   * @since 1.0.0
   */
  (domain: Interval): (p: LinearPolynomial) => number
} = internal.length
