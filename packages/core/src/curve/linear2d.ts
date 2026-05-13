import type { Interval2d } from '../interval/interval2d'
import type { TwoDimensional } from '../dimensions'
import type { Closed, Interval } from '../interval/interval'
import type { Pipeable } from '../utils'
import type { LinearPolynomial } from '../polynomial/linear'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits'
import type * as Solution from '../solution/solution'
import type { Vector2 } from '../vector/vector2'
import type { LinearCurve2dTypeId } from './linear2d.internal'
import * as internal from './linear2d.internal'

export type { Monotonic, Increasing, Decreasing } from '../polynomial/traits'

/**
 * A linear curve in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The two type parameters carry the trait sets of the curve's per-axis
 * polynomials. Refiners like `isMonotonic` lift each axis's monotonicity into
 * the curve's combined trait set.
 *
 * @since 1.0.0
 */
export interface LinearCurve2d<out XTraits = unknown, out YTraits = unknown>
  extends Pipeable, TwoDimensional<LinearPolynomial<XTraits>, LinearPolynomial<YTraits>> {
  readonly [LinearCurve2dTypeId]: LinearCurve2dTypeId
}

/**
 * Creates a new `LinearCurve2d` instance from polynomial parameters.
 *
 * @param x - The x polynomial.
 * @param y - The y polynomial.
 * @returns A new `LinearCurve2d` instance.
 * @since 1.0.0
 */
export const fromPolynomials: (x: LinearPolynomial, y: LinearPolynomial) => LinearCurve2d =
  internal.fromPolynomials

/**
 * Creates a new `LinearCurve2d` instance from monomial coefficient vectors.
 *
 * Each argument bundles the per-axis coefficient at the given power: `c0`
 * holds the x⁰ term, `c1` holds the x¹ term. The resulting curve evaluates to
 * `c0 + c1·t` per axis.
 *
 * @param c0 - The x⁰ coefficients (x and y).
 * @param c1 - The x¹ coefficients (x and y).
 * @returns A new `LinearCurve2d` instance.
 * @since 2.0.0
 */
export const fromCoefficients: (c0: Vector2, c1: Vector2) => LinearCurve2d =
  internal.fromCoefficients

/**
 * Creates a new `LinearCurve2d` instance from a pair of endpoints.
 *
 * `p0` is the curve at `t = 0`, `p1` is the curve at `t = 1`. The
 * implementation converts to the curve's internal monomial form (slope-form
 * polynomial in `t`) in closed form.
 *
 * @param p0 - The curve's start point.
 * @param p1 - The curve's end point.
 * @returns A new `LinearCurve2d` instance whose curve matches the line from `p0` to `p1`.
 * @since 2.0.0
 */
export const fromBezierPoints: (p0: Vector2, p1: Vector2) => LinearCurve2d =
  internal.fromBezierPoints

/**
 * Checks if a value is a `LinearCurve2d`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `LinearCurve2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isLinearCurve2d: (c: unknown) => c is LinearCurve2d = internal.isLinearCurve2d

/**
 * Gets the derivative of a linear curve as a vector
 *
 * @param c - The linear curve to get the derivative of.
 * @returns The derivative of the linear curve as a vector.
 * @since 1.0.0
 */
export const derivative: (c: LinearCurve2d) => Vector2 = internal.derivative

export const solve: {
  /**
   * Solves the linear curve for a given parameter t.
   *
   * @param t - The parameter value.
   * @returns A function that takes a linear curve and returns the point on the curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: LinearCurve2d) => Vector2
  /**
   * Solves the linear curve for a given parameter t.
   *
   * @param c - The linear curve to solve.
   * @param t - The parameter value.
   * @returns The point on the curve at parameter t.
   * @since 1.0.0
   */
  (c: LinearCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  /**
   * Calculates (approximates) the length of a linear curve.
   *
   * @param c - The linear curve to calculate the length of.
   * @param i - The interval to calculate the length over.
   * @returns The length of the linear curve over the given interval.
   * @since 1.0.0
   */
  (c: LinearCurve2d, i: Interval): number
  /**
   * Calculates (approximates) the length of a linear curve.
   *
   * @param i - The interval to calculate the length over.
   * @returns A function that takes a linear curve and returns the length of the linear curve over the given interval.
   * @since 1.0.0
   */
  (i: Interval): (c: LinearCurve2d) => number
} = internal.length

/**
 * Computes the axis-aligned bounding box of the curve over its parameter
 * domain `[0, 1]`. For a linear curve this is the closed box enclosing the
 * two endpoints.
 *
 * @param c - The linear curve.
 * @returns A closed `Box2d` enclosing the curve.
 * @since 2.0.0
 */
export const boundingBox: (c: LinearCurve2d) => Interval2d<Closed, Closed> = internal.boundingBox

export const solveAtX: {
  /**
   * Evaluates the curve's y value at a given x. A linear curve crosses any
   * vertical line at most once (within the curve's parameter domain `[0, 1]`),
   * so the result is at most one y. Returns the empty tuple when x is outside
   * the curve's range or when the curve's x polynomial is constant.
   *
   * @param c - The linear curve.
   * @param x - The x coordinate.
   * @returns The y value at x, or empty when x is undefined for this curve.
   * @since 2.0.0
   */
  <XT, YT>(c: LinearCurve2d<XT, YT>, x: number): Solution.AtMostOne<number>
  /** @since 2.0.0 */
  (x: number): <XT, YT>(c: LinearCurve2d<XT, YT>) => Solution.AtMostOne<number>
} = internal.solveAtX as never

export const solveAtY: {
  /**
   * Evaluates the curve's x value at a given y. A linear curve crosses any
   * horizontal line at most once (within the curve's parameter domain
   * `[0, 1]`), so the result is at most one x.
   *
   * @param c - The linear curve.
   * @param y - The y coordinate.
   * @returns The x value at y, or empty when y is undefined for this curve.
   * @since 2.0.0
   */
  <XT, YT>(c: LinearCurve2d<XT, YT>, y: number): Solution.AtMostOne<number>
  /** @since 2.0.0 */
  (y: number): <XT, YT>(c: LinearCurve2d<XT, YT>) => Solution.AtMostOne<number>
} = internal.solveAtY as never

/**
 * Type-narrowing predicate: refines both axes' traits to include `Monotonic`
 * when both the x and y polynomials are strictly monotonic. When both axes
 * are monotonic, the curve is invertible in either direction.
 *
 * For checking only one axis, call the polynomial-level refiner directly:
 * `LinearPolynomial.isMonotonic(curve.x)`.
 *
 * @since 2.0.0
 */
export const isMonotonic: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT & Monotonic, YT & Monotonic> = internal.isMonotonic

/**
 * Type-narrowing predicate: refines both axes' traits to include `Increasing`.
 *
 * @since 2.0.0
 */
export const isIncreasing: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT & Increasing, YT & Increasing> = internal.isIncreasing

/**
 * Type-narrowing predicate: refines both axes' traits to include `Decreasing`.
 *
 * @since 2.0.0
 */
export const isDecreasing: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT & Decreasing, YT & Decreasing> = internal.isDecreasing

/**
 * Asserts monotonicity in both axes, throwing on failure.
 *
 * @since 2.0.0
 */
export const asMonotonic: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => LinearCurve2d<XT & Monotonic, YT & Monotonic> = internal.asMonotonic

/**
 * Asserts that both axes are strictly increasing, throwing on failure.
 *
 * @since 2.0.0
 */
export const asIncreasing: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => LinearCurve2d<XT & Increasing, YT & Increasing> = internal.asIncreasing

/**
 * Asserts that both axes are strictly decreasing, throwing on failure.
 *
 * @since 2.0.0
 */
export const asDecreasing: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => LinearCurve2d<XT & Decreasing, YT & Decreasing> = internal.asDecreasing
