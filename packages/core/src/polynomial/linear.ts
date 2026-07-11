import type { Closed, Interval } from '../interval/interval.ts'
import type { Pipeable } from '../utils.ts'
import type * as Solution from '../solution/solution.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { LinearPolynomialTypeId } from './linear.internal.ts'
import * as internal from './linear.internal.ts'
import type { GuaranteedMonotonicity } from '../monotonicity/monotonicity.ts'
import type { QuadraticPolynomial } from './quadratic.ts'
import type { Decreasing, Increasing, Monotonic, PolynomialTraits } from './traits.ts'

export type { Monotonic, Increasing, Decreasing } from './traits.ts'

/**
 * A linear polynomial `c0 + c1·x`, stored by coefficient.
 *
 * All fields are readonly. No operation mutates a polynomial. Construct
 * via `make`, `fromVector`, `fromPointSlope`, or `fromPoints`.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the polynomial is refined via `isMonotonic` / `asMonotonic` and
 * friends. The runtime value carries no trait data. `Traits` only flows
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
 * True only for values built by this module's constructors, which carry
 * the brand. A structural `{ c0, c1 }` object does not match.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `LinearPolynomial`, `false` otherwise.
 * @since 1.0.0
 */
export const isLinearPolynomial: (v: unknown) => v is LinearPolynomial = internal.isLinearPolynomial

export const equals: {
  /**
   * Checks if two `LinearPolynomial` instances are approximately equal.
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
  (a: LinearPolynomial, b: LinearPolynomial): boolean
  /**
   * Checks if two `LinearPolynomial` instances are approximately equal.
   *
   * @param b - The second polynomial.
   * @returns A function that takes the first polynomial and returns the comparison result.
   * @since 2.0.0
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
 * Creates a new `LinearPolynomial` instance from a vector: `v.x` becomes
 * `c0` and `v.y` becomes `c1`.
 *
 * @param v - The coefficients as a vector, in monomial order.
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
 * Creates a new `LinearPolynomial` instance through two points.
 *
 * Vertically aligned points (`p1.x === p2.x`) divide by zero: the slope
 * is a vertical line's, and the coefficients come out non-finite.
 *
 * @param p1 - The first point.
 * @param p2 - The second point.
 * @returns A new `LinearPolynomial` whose graph passes through both points.
 * @since 1.0.0
 */
export const fromPoints: (p1: Vector2, p2: Vector2) => LinearPolynomial = internal.fromPoints

export const solve: {
  /**
   * Evaluates the polynomial at `x`.
   *
   * @param p - The linear polynomial to evaluate.
   * @param x - The input value.
   * @returns The value `c0 + c1 * x`.
   * @since 1.0.0
   */
  (p: LinearPolynomial, x: number): number
  /**
   * Evaluates the polynomial at `x`.
   *
   * @param x - The input value.
   * @returns A function that takes a `LinearPolynomial` and returns its value at `x`.
   * @since 1.0.0
   */
  (x: number): (p: LinearPolynomial) => number
} = internal.solve

/**
 * Converts a linear polynomial to an evaluation function: the
 * single-argument form of `solve`, shaped for `pipe` and `map`.
 *
 * @param p - The linear polynomial to convert.
 * @returns A function that takes `x` and returns the polynomial's value there.
 * @since 1.0.0
 */
export const toSolver: (p: LinearPolynomial) => (x: number) => number = internal.toSolver

// The implementation always runs the same `c1 === 0 ? Solution.none : ...`
// branch. For `Monotonic`-branded polynomials the empty branch is provably
// unreachable, but TS can't see that — the cast pairs the type-level promise
// with the runtime brand check.
export const solveInverse: {
  /**
   * Finds the input `x` at which a monotonic linear polynomial attains
   * `y`. Because the polynomial is strictly monotonic, the inverse always
   * has exactly one solution, wrapped in `Solution.One`.
   *
   * @param p - The monotonic linear polynomial to invert.
   * @param y - The output value to find the input for.
   * @returns The solving `x`, wrapped in `Solution.One`.
   * @since 2.0.0
   */
  <T extends Monotonic>(p: LinearPolynomial<T>, y: number): Solution.One<number>
  /**
   * Finds the input `x` at which the polynomial attains `y`. Returns
   * `Solution.none` for constant polynomials (no inverse).
   *
   * @param p - The linear polynomial to invert.
   * @param y - The output value to find the input for.
   * @returns The solving `x` in `Solution.One`, or `Solution.none` when `p` is constant.
   * @since 1.0.0
   */
  <T>(p: LinearPolynomial<T>, y: number): Solution.AtMostOne<number>
  /**
   * Finds the input at which a linear polynomial attains `y`.
   *
   * @param y - The output value to find the input for.
   * @returns A function that takes a polynomial and returns the inverse solution.
   * @since 1.0.0
   */
  (y: number): {
    <T extends Monotonic>(p: LinearPolynomial<T>): Solution.One<number>
    <T>(p: LinearPolynomial<T>): Solution.AtMostOne<number>
  }
} = internal.solveInverse as never

/**
 * Converts a linear polynomial to an inverse-solving function: the
 * single-argument form of `solveInverse`, shaped for `pipe` and `map`.
 *
 * @param p - The linear polynomial to convert.
 * @returns A function that takes `y` and returns the inverse solution.
 * @since 1.0.0
 */
export const toInverseSolver: (p: LinearPolynomial) => (y: number) => Solution.AtMostOne<number> =
  internal.toInverseSolver

/**
 * Finds the root of a linear polynomial: the `x` where `p(x) = 0`.
 *
 * @param p - The linear polynomial to find the root of.
 * @returns The root in `Solution.One`, or `Solution.none` for constant polynomials — including the zero polynomial, where every `x` is a root.
 * @since 1.0.0
 */
export const root: (p: LinearPolynomial) => Solution.AtMostOne<number> = (p) =>
  internal.solveInverse(p, 0)

/**
 * Calculates the monotonicity of a linear polynomial from the sign of
 * `c1`.
 *
 * The test is exact: any nonzero `c1`, however small, classifies as
 * increasing or decreasing. Only `c1 === 0` is `Constant`.
 *
 * @param p - The linear polynomial to check.
 * @returns `Increasing`, `Decreasing`, or `Constant` (never `None`: a line cannot change direction).
 * @since 1.0.0
 */
export const monotonicity: (p: LinearPolynomial) => GuaranteedMonotonicity = internal.monotonicity

/**
 * Checks if the polynomial is strictly monotonic (`c1 !== 0`), the
 * condition under which `solveInverse` always has exactly one solution.
 *
 * @param p - The linear polynomial to check.
 * @returns `true` when `monotonicity(p)` is `Increasing` or `Decreasing`, narrowing to `LinearPolynomial<T & Monotonic>`.
 * @since 2.0.0
 */
export const isMonotonic: <T>(p: LinearPolynomial<T>) => p is LinearPolynomial<T & Monotonic> =
  internal.isMonotonic

/**
 * Checks if the polynomial is strictly increasing (`c1 > 0`).
 *
 * @param p - The linear polynomial to check.
 * @returns `true` when `monotonicity(p)` is `Increasing`, narrowing to `LinearPolynomial<T & Increasing>`.
 * @since 2.0.0
 */
export const isIncreasing: <T>(p: LinearPolynomial<T>) => p is LinearPolynomial<T & Increasing> =
  internal.isIncreasing

/**
 * Checks if the polynomial is strictly decreasing (`c1 < 0`).
 *
 * @param p - The linear polynomial to check.
 * @returns `true` when `monotonicity(p)` is `Decreasing`, narrowing to `LinearPolynomial<T & Decreasing>`.
 * @since 2.0.0
 */
export const isDecreasing: <T>(p: LinearPolynomial<T>) => p is LinearPolynomial<T & Decreasing> =
  internal.isDecreasing

/**
 * Asserts that the linear polynomial is monotonic, throwing on failure.
 *
 * @param p - The linear polynomial to assert against.
 * @returns The same polynomial, typed with the `Monotonic` brand.
 * @throws When `monotonicity(p)` is `Constant`.
 * @since 2.0.0
 */
export const asMonotonic: <T>(p: LinearPolynomial<T>) => LinearPolynomial<T & Monotonic> =
  internal.asMonotonic

/**
 * Asserts that the linear polynomial is increasing, throwing on failure.
 *
 * @param p - The linear polynomial to assert against.
 * @returns The same polynomial, typed with the `Increasing` brand.
 * @throws When `monotonicity(p)` is not `Increasing`.
 * @since 2.0.0
 */
export const asIncreasing: <T>(p: LinearPolynomial<T>) => LinearPolynomial<T & Increasing> =
  internal.asIncreasing

/**
 * Asserts that the linear polynomial is decreasing, throwing on failure.
 *
 * @param p - The linear polynomial to assert against.
 * @returns The same polynomial, typed with the `Decreasing` brand.
 * @throws When `monotonicity(p)` is not `Decreasing`.
 * @since 2.0.0
 */
export const asDecreasing: <T>(p: LinearPolynomial<T>) => LinearPolynomial<T & Decreasing> =
  internal.asDecreasing

/**
 * Returns the polynomial's coefficients as a tuple `[c0, c1]`.
 *
 * @param p - The linear polynomial.
 * @returns The coefficients in monomial order.
 * @since 2.0.0
 */
export const coefficients: (p: LinearPolynomial) => readonly [number, number] =
  internal.coefficients

/**
 * Calculates the derivative of a linear polynomial.
 *
 * @param p - The linear polynomial to differentiate.
 * @returns The constant derivative `c1`, as a plain number.
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
   * Computes the interval of inputs over which `p` attains the values in
   * `range`: for an increasing polynomial, the exact preimage
   * `[x(range.start), x(range.end)]`.
   *
   * A constant polynomial yields the full line `[-Infinity, Infinity]`
   * only when `range` is exactly the degenerate interval `[c0, c0]`. Any
   * other range yields `Solution.none`, including ranges that contain
   * `c0`.
   *
   * `range` is the forward query.
   *
   * @param p - The linear polynomial to invert.
   * @param range - The output values to find inputs for.
   * @returns The preimage interval in `Solution.One`, or `Solution.none` for constant polynomials.
   * @throws `Error` when `p` is decreasing: the preimage endpoints are built in descending order, which the interval constructor rejects.
   * @since 1.0.0
   */
  (p: LinearPolynomial, range: Interval): Solution.AtMostOne<Interval>
  /**
   * Computes the interval of inputs over which a linear polynomial
   * attains the values in `range`.
   *
   * @param range - The output values to find inputs for.
   * @returns A function that takes a `LinearPolynomial` and returns the preimage interval.
   * @throws `Error` when the polynomial is decreasing: the preimage endpoints are built in descending order, which the interval constructor rejects.
   * @since 1.0.0
   */
  (range: Interval): (p: LinearPolynomial) => Solution.AtMostOne<Interval>
} = internal.domain

export const range: {
  /**
   * Computes the values `p` attains over `domain`: the closed interval
   * between the two endpoint values, in either order.
   *
   * `domain` is the inverse query.
   *
   * @param p - The linear polynomial to evaluate.
   * @param domain - The inputs to evaluate over.
   * @returns The closed interval between `p(domain.start)` and `p(domain.end)`.
   * @since 1.0.0
   */
  (p: LinearPolynomial, domain: Interval): Closed
  /**
   * Computes the values a linear polynomial attains over `domain`.
   *
   * @param domain - The inputs to evaluate over.
   * @returns A function that takes a `LinearPolynomial` and returns its range over `domain`.
   * @since 1.0.0
   */
  (domain: Interval): (p: LinearPolynomial) => Closed
} = internal.range

/**
 * Calculates the range of a linear polynomial over the unit interval
 * `[0, 1]`: the closed interval between `c0` and `c0 + c1`. Equivalent to
 * `range(p, Interval.unit)`.
 *
 * @param p - The linear polynomial.
 * @returns The closed range of the polynomial over `[0, 1]`.
 * @since 2.0.0
 */
export const unitRange: (p: LinearPolynomial) => Closed = internal.unitRange

export const length: {
  /**
   * Calculates the arc length of the graph `y = p(x)` over `domain`.
   *
   * For a line the arc length is exact:
   * `size(domain) * sqrt(1 + c1²)`.
   *
   * @param p - The linear polynomial to measure.
   * @param domain - The inputs to measure over.
   * @returns The arc length. `0` for a zero-size domain.
   * @since 1.0.0
   */
  (p: LinearPolynomial, domain: Interval): number
  /**
   * Calculates the arc length of a linear polynomial's graph over
   * `domain`.
   *
   * @param domain - The inputs to measure over.
   * @returns A function that takes a `LinearPolynomial` and returns the arc length.
   * @since 1.0.0
   */
  (domain: Interval): (p: LinearPolynomial) => number
} = internal.length
