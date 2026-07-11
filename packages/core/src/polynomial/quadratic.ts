import type { Closed, Interval } from '../interval/interval.ts'
import type { Pipeable } from '../utils.ts'
import type * as Solution from '../solution/solution.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Vector3 } from '../vector/vector3.ts'
import type { CubicPolynomial } from './cubic.ts'
import type { LinearPolynomial } from './linear.ts'
import type { Monotonicity } from '../monotonicity/monotonicity.ts'
import * as internal from './quadratic.internal.ts'
import type { QuadraticPolynomialTypeId } from './quadratic.internal.circular.ts'
import type { Decreasing, Increasing, Monotonic, PolynomialTraits } from './traits.ts'

export type { Monotonic, Increasing, Decreasing } from './traits.ts'

/**
 * A quadratic polynomial `c0 + c1·x + c2·x²`, stored by coefficient.
 *
 * All fields are readonly. No operation mutates a polynomial. Construct
 * via `make`, `fromVector`, or `fromPoints`.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the polynomial is refined via `isMonotonic` / `asMonotonic` and
 * friends. Refinements may be parameterized by an `Interval`: a quadratic is
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
 * True only for values built by this module's constructors, which carry
 * the brand. A structural `{ c0, c1, c2 }` object does not match.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `QuadraticPolynomial`, `false` otherwise.
 * @since 1.0.0
 */
export const isQuadraticPolynomial: (v: unknown) => v is QuadraticPolynomial =
  internal.isQuadraticPolynomial

export const equals: {
  /**
   * Checks if two `QuadraticPolynomial` instances are approximately equal.
   *
   * Each pair of coefficients is compared with `coincident` from
   * `curvy/number`, an absolute-plus-relative tolerance band. See
   * `PRECISION.md` for the mechanics.
   *
   * @param a - The first polynomial.
   * @param b - The second polynomial.
   * @returns `true` when each pair of coefficients is within tolerance.
   * @since 2.0.0
   */
  (a: QuadraticPolynomial, b: QuadraticPolynomial): boolean
  /**
   * Checks if two `QuadraticPolynomial` instances are approximately equal.
   *
   * @param b - The second polynomial.
   * @returns A function that takes the first polynomial and returns the comparison result.
   * @since 2.0.0
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
 * Creates a new `QuadraticPolynomial` instance from a vector: `v.x`
 * becomes `c0`, `v.y` becomes `c1`, and `v.z` becomes `c2`.
 *
 * @param v - The coefficients as a vector, in monomial order.
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
   * Evaluates the polynomial at `x`.
   *
   * @param p - The quadratic polynomial to evaluate.
   * @param x - The input value.
   * @returns The value `c0 + c1 * x + c2 * x²`.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, x: number): number
  /**
   * Evaluates the polynomial at `x`.
   *
   * @param x - The input value.
   * @returns A function that takes a `QuadraticPolynomial` and returns its value at `x`.
   * @since 1.0.0
   */
  (x: number): (p: QuadraticPolynomial) => number
} = internal.solve

/**
 * Converts a quadratic polynomial to an evaluation function: the
 * single-argument form of `solve`, shaped for `pipe` and `map`.
 *
 * @param p - The quadratic polynomial to convert.
 * @returns A function that takes `x` and returns the polynomial's value there.
 * @since 1.0.0
 */
export const toSolver: (p: QuadraticPolynomial) => (x: number) => number = internal.toSolver

export const solveInverse: {
  /**
   * Finds the inputs at which a monotonic quadratic polynomial attains
   * `y`. Because the polynomial is strictly monotonic (either globally, or
   * over the interval the `Monotonic` brand was attached for), the inverse
   * has at most one solution.
   *
   * @param p - The monotonic quadratic polynomial to invert.
   * @param y - The output value to find inputs for.
   * @returns Zero or one solving inputs.
   * @since 2.0.0
   */
  <T extends Monotonic>(p: QuadraticPolynomial<T>, y: number): Solution.AtMostOne<number>
  /**
   * Finds the inputs at which the polynomial attains `y`, in ascending
   * order.
   *
   * The root count is tolerance-aware: a discriminant within rounding
   * distance of zero, relative to its own terms, counts as a double root
   * and yields one solution. See `PRECISION.md` for the mechanics.
   *
   * @param p - The quadratic polynomial to invert.
   * @param y - The output value to find inputs for.
   * @returns Zero, one, or two solving inputs, ascending.
   * @since 1.0.0
   */
  <T>(p: QuadraticPolynomial<T>, y: number): Solution.AtMostTwo<number>
  /**
   * Finds the inputs at which a quadratic polynomial attains `y`.
   *
   * @param y - The output value to find inputs for.
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
 * Converts a quadratic polynomial to an inverse-solving function: the
 * single-argument form of `solveInverse`, shaped for `pipe` and `map`.
 *
 * @param p - The quadratic polynomial to convert.
 * @returns A function that takes `y` and returns the inverse solutions.
 * @since 1.0.0
 */
export const toInverseSolver: (
  p: QuadraticPolynomial,
) => (y: number) => Solution.AtMostTwo<number> = internal.toInverseSolver

/**
 * Returns the polynomial's coefficients as a tuple `[c0, c1, c2]`.
 *
 * @param p - The quadratic polynomial.
 * @returns The coefficients in monomial order.
 * @since 2.0.0
 */
export const coefficients: (p: QuadraticPolynomial) => readonly [number, number, number] =
  internal.coefficients

/**
 * Computes the derivative of the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns The derivative of the polynomial as a linear polynomial.
 * @since 1.0.0
 */
export const derivative: (p: QuadraticPolynomial) => LinearPolynomial = internal.derivative

/**
 * Finds the roots of the quadratic polynomial: the inputs where
 * `p(x) = 0`, in ascending order.
 *
 * Root count follows the tolerance-aware discriminant test of
 * `solveInverse`.
 *
 * @param p - The quadratic polynomial.
 * @returns Zero, one, or two roots, ascending.
 * @since 1.0.0
 */
export const roots: (p: QuadraticPolynomial) => Solution.AtMostTwo<number> = internal.roots

/**
 * Finds the vertex of the quadratic polynomial: the point `(x, p(x))`
 * where the derivative is zero.
 *
 * @param p - The quadratic polynomial.
 * @returns The vertex as a `Vector2`, or `null` when the polynomial is degenerate (`c2` exactly `0`) and has none.
 * @since 1.0.0
 */
export const extreme: (p: QuadraticPolynomial) => Vector2 | null = internal.extreme

export const monotonicity: {
  /**
   * Computes the monotonicity of the quadratic polynomial over a given
   * interval, or globally when `i` is omitted. Throws when the interval
   * has zero width: the question is undefined at a single point.
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
 * Checks if the polynomial is strictly monotonic over the given interval
 * (or globally, when no interval is given) — the condition under which
 * `solveInverse` has at most one solution.
 *
 * @param p - The quadratic polynomial to check.
 * @param i - Optional interval over which to check monotonicity.
 * @returns `true` when monotonicity is `Increasing` or `Decreasing`, narrowing to `QuadraticPolynomial<T & Monotonic>`.
 * @since 2.0.0
 */
export const isMonotonic: {
  <T>(p: QuadraticPolynomial<T>, i?: Interval): p is QuadraticPolynomial<T & Monotonic>
  (i: Interval): <T>(p: QuadraticPolynomial<T>) => p is QuadraticPolynomial<T & Monotonic>
} = internal.isMonotonic

/**
 * Checks if the polynomial is strictly increasing over the given interval
 * (or globally, when no interval is given).
 *
 * @param p - The quadratic polynomial to check.
 * @param i - Optional interval over which to check.
 * @returns `true` when monotonicity is `Increasing`, narrowing to `QuadraticPolynomial<T & Increasing>`.
 * @since 2.0.0
 */
export const isIncreasing: {
  <T>(p: QuadraticPolynomial<T>, i?: Interval): p is QuadraticPolynomial<T & Increasing>
  (i: Interval): <T>(p: QuadraticPolynomial<T>) => p is QuadraticPolynomial<T & Increasing>
} = internal.isIncreasing

/**
 * Checks if the polynomial is strictly decreasing over the given interval
 * (or globally, when no interval is given).
 *
 * @param p - The quadratic polynomial to check.
 * @param i - Optional interval over which to check.
 * @returns `true` when monotonicity is `Decreasing`, narrowing to `QuadraticPolynomial<T & Decreasing>`.
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
 * @param p - The quadratic polynomial to assert against.
 * @param i - Optional interval over which to check.
 * @returns The same polynomial, typed with the `Increasing` brand.
 * @throws `Error` when the polynomial is not increasing over the given (or global) interval.
 * @since 2.0.0
 */
export const asIncreasing: <T>(
  p: QuadraticPolynomial<T>,
  i?: Interval,
) => QuadraticPolynomial<T & Increasing> = internal.asIncreasing

/**
 * Asserts that the quadratic polynomial is decreasing, throwing on failure.
 *
 * @param p - The quadratic polynomial to assert against.
 * @param i - Optional interval over which to check.
 * @returns The same polynomial, typed with the `Decreasing` brand.
 * @throws `Error` when the polynomial is not decreasing over the given (or global) interval.
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
   * Computes the interval of inputs over which `p` attains the values in
   * `range`: the hull of every solution of `p(x) = range.start` and
   * `p(x) = range.end`.
   *
   * The result is the exact preimage when `p` is monotonic over it. When
   * it is not, the true preimage may be disjoint, and the hull encloses
   * it — possibly including inputs whose values fall outside `range`.
   * When neither boundary value is attained the result is
   * `Solution.none`. When only one is, the hull covers that side's
   * solutions.
   *
   * `range` is the forward query.
   *
   * @param p - The quadratic polynomial to invert.
   * @param range - The output values to find inputs for.
   * @returns The enclosing preimage interval, or `Solution.none` when neither boundary value is attained.
   * @example
   * ```ts
   * // x² attains 1 at ±1 and 4 at ±2; the hull is [-2, 2]
   * QuadraticPolynomial.domain(QuadraticPolynomial.make(0, 0, 1), Interval.make(1, 4))
   * // Solution.one of [-2, 2]
   * ```
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, range: Interval): Solution.AtMostOne<Interval>
  /**
   * Computes the interval of inputs over which a quadratic polynomial
   * attains the values in `range`.
   *
   * @param range - The output values to find inputs for.
   * @returns A function that takes a quadratic polynomial and returns the enclosing preimage interval.
   * @since 1.0.0
   */
  (range: Interval): (p: QuadraticPolynomial) => Solution.AtMostOne<Interval>
} = internal.domain

export const range: {
  /**
   * Computes the exact values `p` attains over `domain`: the closed
   * interval covering both endpoint values and the vertex value when the
   * vertex lies inside `domain`.
   *
   * `domain` is the inverse query.
   *
   * @param p - The quadratic polynomial to evaluate.
   * @param domain - The inputs to evaluate over.
   * @returns The closed interval of attained values.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, domain: Interval): Closed
  /**
   * Computes the values a quadratic polynomial attains over `domain`.
   *
   * @param domain - The inputs to evaluate over.
   * @returns A function that takes a quadratic polynomial and returns its range over `domain`.
   * @since 1.0.0
   */
  (domain: Interval): (p: QuadraticPolynomial) => Closed
} = internal.range

/**
 * Computes the range of the quadratic polynomial over the unit interval
 * `[0, 1]`. Equivalent to `range(p, Interval.unit)`, accounting for any
 * interior vertex in `[0, 1]`.
 *
 * @param p - The quadratic polynomial.
 * @returns The closed range of the polynomial over `[0, 1]`.
 * @since 2.0.0
 */
export const unitRange: (p: QuadraticPolynomial) => Closed = internal.unitRange

export const length: {
  /**
   * Computes the arc length of the graph `y = p(x)` over `i`.
   *
   * Uses the parabola's closed-form arc length (no numerical
   * integration). Exact up to rounding. `0` for a zero-size interval.
   *
   * @param p - The quadratic polynomial to measure.
   * @param i - The inputs to measure over.
   * @returns The arc length of the graph over `i`.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, i: Interval): number
  /**
   * Computes the arc length of a quadratic polynomial's graph over `i`.
   *
   * @param i - The inputs to measure over.
   * @returns A function that takes a quadratic polynomial and returns the arc length.
   * @since 1.0.0
   */
  (i: Interval): (p: QuadraticPolynomial) => number
} = internal.length

export const curvature: {
  /**
   * Computes the unsigned curvature of the graph `y = p(x)` at `x`.
   *
   * Unsigned: bending direction is not reported. Known deviation: the
   * implementation currently evaluates `|p''| / (1 + |p'(x)|³)` instead
   * of the standard `|p''| / (1 + p'(x)²)^(3/2)`. The two agree at the
   * vertex (`p'(x) = 0`) and drift apart away from it.
   *
   * @param p - The quadratic polynomial.
   * @param x - The input at which to measure curvature.
   * @returns The unsigned curvature at `x`.
   * @since 1.0.0
   */
  (p: QuadraticPolynomial, x: number): number
  /**
   * Computes the unsigned curvature of a quadratic polynomial's graph at
   * `x`.
   *
   * @param x - The input at which to measure curvature.
   * @returns A function that takes a quadratic polynomial and returns the curvature at `x`.
   * @since 1.0.0
   */
  (x: number): (p: QuadraticPolynomial) => number
} = internal.curvature
