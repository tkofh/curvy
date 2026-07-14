import type { Closed, Interval } from '../interval/interval.ts'
import type { Pipeable } from '../utils.ts'
import type * as Solution from '../solution/solution.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Vector4 } from '../vector/vector4.ts'
import * as internal from './cubic.internal.ts'
import type { CubicPolynomialTypeId } from './cubic.internal.circular.ts'
import type { Monotonicity } from '../monotonicity/monotonicity.ts'
import type { QuadraticPolynomial } from './quadratic.ts'
import type { Decreasing, Increasing, Monotonic, PolynomialTraits, Reflected } from './traits.ts'

export type { Monotonic, Increasing, Decreasing, Reflected } from './traits.ts'

/**
 * A cubic polynomial `c0 + c1*x + c2*x^2 + c3*x^3`, stored by coefficient.
 *
 * All fields are readonly. No operation mutates a polynomial. Construct
 * via `make`, `fromVector`, or `fromPoints`.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the polynomial is refined via `isMonotonic` / `asMonotonic` and
 * friends. A cubic is monotonic only over an interval that avoids both of its
 * extrema (or globally, when c2 = c3 = 0 and c1 != 0).
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
 * True only for values built by this module's constructors, which carry
 * the brand. A structural `{ c0, c1, c2, c3 }` object does not match.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a `CubicPolynomial`, `false` otherwise.
 * @since 1.0.0
 */
export const isCubicPolynomial: (value: unknown) => value is CubicPolynomial =
  internal.isCubicPolynomial

export const equals: {
  /**
   * Checks if two `CubicPolynomial` instances are approximately equal. Each
   * coefficient pair is compared with `coincident` from `curvy/number`, an
   * absolute-plus-relative band (see `PRECISION.md`).
   *
   * @param a - The first polynomial.
   * @param b - The second polynomial.
   * @returns `true` when each pair of coefficients is within tolerance.
   * @since 2.0.0
   */
  (a: CubicPolynomial, b: CubicPolynomial): boolean
  /**
   * Checks if two `CubicPolynomial` instances are approximately equal.
   *
   * @param b - The second polynomial.
   * @returns A function that takes the first polynomial and returns the comparison result.
   * @since 2.0.0
   */
  (b: CubicPolynomial): (a: CubicPolynomial) => boolean
} = internal.equals

/**
 * Creates a new `CubicPolynomial` instance. All four coefficients are
 * required.
 *
 * @param c0 - The coefficient of the x^0 term.
 * @param c1 - The coefficient of the x^1 term.
 * @param c2 - The coefficient of the x^2 term.
 * @param c3 - The coefficient of the x^3 term.
 * @returns A new `CubicPolynomial` instance.
 * @since 1.0.0
 */
export const make: (c0: number, c1: number, c2: number, c3: number) => CubicPolynomial =
  internal.make

/**
 * Creates a new `CubicPolynomial` instance from a vector. `v.x` becomes
 * `c0`, `v.y` becomes `c1`, `v.z` becomes `c2`, and `v.w` becomes `c3`.
 *
 * @param v - The coefficients as a vector, in monomial order.
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
   * Evaluates the polynomial at `x`.
   *
   * @param p - The cubic polynomial to evaluate.
   * @param x - The input value.
   * @returns The value `c0 + c1 * x + c2 * x^2 + c3 * x^3`.
   * @since 1.0.0
   */
  (p: CubicPolynomial, x: number): number
  /**
   * Evaluates the polynomial at `x`.
   *
   * @param x - The input value.
   * @returns A function that takes a `CubicPolynomial` and returns its value at `x`.
   * @since 1.0.0
   */
  (x: number): (p: CubicPolynomial) => number
} = internal.solve

/**
 * Converts a cubic polynomial to an evaluation function, the
 * single-argument form of `solve`, shaped for `pipe` and `map`.
 *
 * @param p - The cubic polynomial to convert.
 * @returns A function that takes `x` and returns the polynomial's value there.
 * @since 1.0.0
 */
export const toSolver: (p: CubicPolynomial) => (x: number) => number = internal.toSolver

export const solveInverse: {
  /**
   * Finds the inputs at which a monotonic cubic polynomial attains `y`.
   * Because the polynomial is strictly monotonic, the inverse has at most
   * one solution.
   *
   * @param p - The monotonic cubic polynomial to invert.
   * @param y - The output value to find inputs for.
   * @returns Zero or one solving inputs.
   * @since 2.0.0
   */
  <T extends Monotonic>(p: CubicPolynomial<T>, y: number): Solution.AtMostOne<number>
  /**
   * Finds the inputs at which the polynomial attains `y`, in ascending
   * order.
   *
   * The root count is tolerance-aware. The solver's branch dispatch reads
   * the depressed discriminant against a band scaled by its own terms, so
   * near-multiple roots collapse instead of splitting on rounding noise.
   * See `PRECISION.md` for the mechanics.
   *
   * @param p - The cubic polynomial to invert.
   * @param y - The output value to find inputs for.
   * @returns Up to three solving inputs, ascending. A true cubic (`c3 != 0`) always yields at least one. None can arise only for degenerate, lower-degree coefficients.
   * @since 1.0.0
   */
  <T>(p: CubicPolynomial<T>, y: number): Solution.AtMostThree<number>
  /**
   * Finds the inputs at which a cubic polynomial attains `y`.
   *
   * @param y - The output value to find inputs for.
   * @returns A function that takes a cubic polynomial and returns the
   *   solutions. Tightens to `Solution.AtMostOne<number>` for monotonic inputs.
   * @since 1.0.0
   */
  (y: number): {
    <T extends Monotonic>(p: CubicPolynomial<T>): Solution.AtMostOne<number>
    <T>(p: CubicPolynomial<T>): Solution.AtMostThree<number>
  }
} = internal.solveInverse as never

/**
 * Converts a cubic polynomial to an inverse-solving function, the
 * single-argument form of `solveInverse`, shaped for `pipe` and `map`.
 *
 * @param p - The cubic polynomial to convert.
 * @returns A function that takes `y` and returns the inverse solutions.
 * @since 1.0.0
 */
export const toInverseSolver: (p: CubicPolynomial) => (y: number) => Solution.AtMostThree<number> =
  internal.toInverseSolver

/**
 * Returns the polynomial's coefficients as a tuple `[c0, c1, c2, c3]`.
 *
 * @param p - The cubic polynomial.
 * @returns The coefficients in monomial order.
 * @since 2.0.0
 */
export const coefficients: (p: CubicPolynomial) => readonly [number, number, number, number] =
  internal.coefficients

/**
 * Calculates the derivative of a cubic polynomial.
 *
 * @param p - The cubic polynomial to differentiate.
 * @returns The derivative of the cubic polynomial.
 * @since 1.0.0
 */
export const derivative: (p: CubicPolynomial) => QuadraticPolynomial = internal.derivative

/**
 * Reflects the polynomial about the midpoint of its `[0, 1]` domain, returning
 * `q(u) = p(1 - u)` — the polynomial read right-to-left. The endpoint values
 * swap (`q(0) = p(1)`, `q(1) = p(0)`), and the monotonicity brand reverses with
 * the sense: `Increasing` becomes `Decreasing` and vice versa, while a bare
 * `Monotonic` is preserved (`Reflected`).
 *
 * @param p - The cubic polynomial to reflect.
 * @returns The reflected polynomial `p(1 - u)`, its direction brand flipped.
 * @since 2.0.0
 */
export const reflectDomain: <T>(p: CubicPolynomial<T>) => CubicPolynomial<Reflected<T>> =
  internal.reflectDomain

export const subdivide: {
  /**
   * Subdivides a cubic polynomial at parameter `t in (0, 1)` into two new
   * cubic polynomials. The first polynomial's evaluation on `[0, 1]` matches
   * the original's on `[0, t]`. The second matches the original's on
   * `[t, 1]`. Equivalent to de Casteljau subdivision in Bernstein form,
   * performed directly in monomial form.
   *
   * @param p - The cubic polynomial to subdivide.
   * @param t - The split parameter. Must be in the open interval `(0, 1)`.
   * @returns A `[left, right]` tuple of cubic polynomials.
   * @throws `Error` when `t` is outside the open interval `(0, 1)`.
   * @since 2.0.0
   */
  (p: CubicPolynomial, t: number): [CubicPolynomial, CubicPolynomial]
  /**
   * Subdivides a cubic polynomial at parameter `t in (0, 1)`.
   *
   * @param t - The split parameter. Must be in the open interval `(0, 1)`.
   * @returns A function that takes a polynomial and returns its `[left, right]` halves.
   * @throws `Error` when `t` is outside the open interval `(0, 1)`.
   * @since 2.0.0
   */
  (t: number): (p: CubicPolynomial) => [CubicPolynomial, CubicPolynomial]
} = internal.subdivide

/**
 * Calculates the roots of a cubic polynomial.
 *
 * Root count follows the tolerance-aware branch dispatch of
 * `solveInverse`.
 *
 * @param p - The cubic polynomial to find the roots of.
 * @returns Up to three inputs where `p(x) = 0`, ascending.
 * @since 1.0.0
 */
export const roots: (p: CubicPolynomial) => Solution.AtMostThree<number> = internal.roots

/**
 * Calculates the stationary points of a cubic polynomial.
 *
 * @param p - The cubic polynomial to find the extrema of.
 * @returns Zero, one, or two inputs where the derivative is zero (`x` locations, not points), ascending.
 * @since 1.0.0
 */
export const extrema: (p: CubicPolynomial) => Solution.AtMostTwo<number> = internal.extrema

export const monotonicity: {
  /**
   * Calculates the monotonicity of a cubic polynomial over an interval,
   * or globally when `i` is omitted. Throws when the interval has zero
   * width, since the question is undefined at a single point.
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
 * Checks if the polynomial is strictly monotonic over the given interval
 * (or globally, when no interval is given) — the condition under which
 * `solveInverse` has at most one solution.
 *
 * @param p - The cubic polynomial to check.
 * @param i - Optional interval over which to check monotonicity.
 * @returns `true` when monotonicity is `Increasing` or `Decreasing`, narrowing to `CubicPolynomial<T & Monotonic>`.
 * @since 2.0.0
 */
export const isMonotonic: {
  <T>(p: CubicPolynomial<T>, i?: Interval): p is CubicPolynomial<T & Monotonic>
  (i: Interval): <T>(p: CubicPolynomial<T>) => p is CubicPolynomial<T & Monotonic>
} = internal.isMonotonic

/**
 * Checks if the polynomial is strictly increasing over the given interval
 * (or globally, when no interval is given).
 *
 * @param p - The cubic polynomial to check.
 * @param i - Optional interval over which to check.
 * @returns `true` when monotonicity is `Increasing`, narrowing to `CubicPolynomial<T & Increasing>`.
 * @since 2.0.0
 */
export const isIncreasing: {
  <T>(p: CubicPolynomial<T>, i?: Interval): p is CubicPolynomial<T & Increasing>
  (i: Interval): <T>(p: CubicPolynomial<T>) => p is CubicPolynomial<T & Increasing>
} = internal.isIncreasing

/**
 * Checks if the polynomial is strictly decreasing over the given interval
 * (or globally, when no interval is given).
 *
 * @param p - The cubic polynomial to check.
 * @param i - Optional interval over which to check.
 * @returns `true` when monotonicity is `Decreasing`, narrowing to `CubicPolynomial<T & Decreasing>`.
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
 * @param p - The cubic polynomial to assert against.
 * @param i - Optional interval over which to check.
 * @returns The same polynomial, typed with the `Increasing` brand.
 * @throws `Error` when the polynomial is not increasing over the given (or global) interval.
 * @since 2.0.0
 */
export const asIncreasing: <T>(
  p: CubicPolynomial<T>,
  i?: Interval,
) => CubicPolynomial<T & Increasing> = internal.asIncreasing

/**
 * Asserts that the cubic polynomial is decreasing, throwing on failure.
 *
 * @param p - The cubic polynomial to assert against.
 * @param i - Optional interval over which to check.
 * @returns The same polynomial, typed with the `Decreasing` brand.
 * @throws `Error` when the polynomial is not decreasing over the given (or global) interval.
 * @since 2.0.0
 */
export const asDecreasing: <T>(
  p: CubicPolynomial<T>,
  i?: Interval,
) => CubicPolynomial<T & Decreasing> = internal.asDecreasing

export const domain: {
  /**
   * Computes the interval of inputs over which `p` attains the values in
   * `range`. This is the hull of every solution of `p(x) = range.start` and
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
   * @param p - The cubic polynomial to invert.
   * @param range - The output values to find inputs for.
   * @returns The enclosing preimage interval, or `Solution.none` when neither boundary value is attained.
   * @since 1.0.0
   */
  (p: CubicPolynomial, range: Interval): Solution.AtMostOne<Interval>
  /**
   * Computes the interval of inputs over which a cubic polynomial attains
   * the values in `range`.
   *
   * @param range - The output values to find inputs for.
   * @returns A function that takes a cubic polynomial and returns the enclosing preimage interval.
   * @since 1.0.0
   */
  (range: Interval): (p: CubicPolynomial) => Solution.AtMostOne<Interval>
} = internal.domain

export const range: {
  /**
   * Computes the exact values `p` attains over `domain`. The result is
   * the closed interval covering both endpoint values and any stationary
   * values inside `domain`.
   *
   * `domain` is the inverse query.
   *
   * @param p - The cubic polynomial to evaluate.
   * @param domain - The inputs to evaluate over.
   * @returns The closed interval of attained values.
   * @since 1.0.0
   */
  (p: CubicPolynomial, domain: Interval): Closed
  /**
   * Computes the values a cubic polynomial attains over `domain`.
   *
   * @param domain - The inputs to evaluate over.
   * @returns A function that takes a cubic polynomial and returns its range over `domain`.
   * @since 1.0.0
   */
  (domain: Interval): (p: CubicPolynomial) => Closed
} = internal.range

/**
 * Calculates the range of a cubic polynomial over the unit interval
 * `[0, 1]`. Equivalent to `range(p, Interval.unit)`, accounting for up to
 * two interior stationary points in `[0, 1]`.
 *
 * @param p - The cubic polynomial.
 * @returns The closed range of the polynomial over `[0, 1]`.
 * @since 2.0.0
 */
export const unitRange: (p: CubicPolynomial) => Closed = internal.unitRange

export const length: {
  /**
   * Calculates the arc length of the graph `y = p(x)` over `domain`.
   *
   * A cubic's arc length has no closed form. The value is computed by
   * numerical quadrature and is accurate to the quadrature, not exact.
   * `0` for a zero-size domain. Degenerate (lower-degree) coefficients
   * fall through to the exact lower-degree formulas.
   *
   * @param p - The cubic polynomial to measure.
   * @param domain - The inputs to measure over.
   * @returns The arc length of the graph over `domain`.
   * @since 1.0.0
   */
  (p: CubicPolynomial, domain: Interval): number
  /**
   * Calculates the arc length of a cubic polynomial's graph over
   * `domain`.
   *
   * @param domain - The inputs to measure over.
   * @returns A function that takes a cubic polynomial and returns the arc length.
   * @since 1.0.0
   */
  (domain: Interval): (p: CubicPolynomial) => number
} = internal.length

export const curvature: {
  /**
   * Calculates the unsigned curvature of the graph `y = p(x)` at `x`:
   * `|p''(x)| / (1 + p'(x)^2)^(3/2)`.
   *
   * Unsigned. Bending direction is not reported.
   *
   * @param p - The cubic polynomial to measure.
   * @param x - The input at which to measure curvature.
   * @returns The unsigned curvature at `x`.
   * @since 1.0.0
   */
  (p: CubicPolynomial, x: number): number
  /**
   * Calculates the unsigned curvature of a cubic polynomial's graph at
   * `x`.
   *
   * @param x - The input at which to measure curvature.
   * @returns A function that takes a cubic polynomial and returns the curvature at `x`.
   * @since 1.0.0
   */
  (x: number): (p: CubicPolynomial) => number
} = internal.curvature
