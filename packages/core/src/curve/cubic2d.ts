import type { Interval2d } from '../interval/interval2d'
import type { TwoDimensional } from '../dimensions'
import type { Closed, Interval } from '../interval/interval'
import type { Pipeable } from '../utils'
import type { CubicPolynomial } from '../polynomial/cubic'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits'
import type * as Solution from '../solution/solution'
import type { Vector2 } from '../vector/vector2'
import type { CubicCurve2dTypeId } from './cubic2d.internal'
import * as internal from './cubic2d.internal'

export type { Monotonic, Increasing, Decreasing } from '../polynomial/traits'

/**
 * A cubic curve in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The two type parameters carry the trait sets of the curve's per-axis
 * polynomials. Refiners check monotonicity over the unit interval `[0, 1]` —
 * the curve's natural parameter domain.
 *
 * @since 1.0.0
 */
export interface CubicCurve2d<out XTraits = unknown, out YTraits = unknown>
  extends Pipeable, TwoDimensional<CubicPolynomial<XTraits>, CubicPolynomial<YTraits>> {
  readonly [CubicCurve2dTypeId]: CubicCurve2dTypeId
}

/**
 * Creates a new `CubicCurve2d` instance from polynomial parameters.
 *
 * @param x - The x polynomial.
 * @param y - The y polynomial.
 * @returns A new `CubicCurve2d` instance.
 * @since 1.0.0
 */
export const fromPolynomials: (x: CubicPolynomial, y: CubicPolynomial) => CubicCurve2d =
  internal.fromPolynomials

/**
 * Creates a new `CubicCurve2d` instance from monomial coefficient vectors.
 *
 * Each argument bundles the per-axis coefficient at the given power: `c0`
 * holds the x⁰ term, `c1` holds the x¹ term, and so on. The resulting curve
 * evaluates to `c0 + c1·t + c2·t² + c3·t³` per axis.
 *
 * @param c0 - The x⁰ coefficients (x and y).
 * @param c1 - The x¹ coefficients (x and y).
 * @param c2 - The x² coefficients (x and y).
 * @param c3 - The x³ coefficients (x and y).
 * @returns A new `CubicCurve2d` instance.
 * @since 2.0.0
 */
export const fromCoefficients: (
  c0: Vector2,
  c1: Vector2,
  c2: Vector2,
  c3: Vector2,
) => CubicCurve2d = internal.fromCoefficients

/**
 * Creates a new `CubicCurve2d` instance from cubic Bézier control points.
 *
 * The four arguments are the Bernstein-basis control points: `p0` and `p3` are
 * the curve's endpoints and `p1` and `p2` are the off-curve control handles.
 * The implementation converts to the curve's internal monomial form in closed
 * form.
 *
 * @param p0 - The first control point (curve start).
 * @param p1 - The second control point (start handle).
 * @param p2 - The third control point (end handle).
 * @param p3 - The fourth control point (curve end).
 * @returns A new `CubicCurve2d` instance whose curve matches the given Bézier.
 * @since 2.0.0
 */
export const fromBezierPoints: (
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
) => CubicCurve2d = internal.fromBezierPoints

/**
 * Checks if a value is a `CubicCurve2d`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `CubicCurve2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isCubicCurve2d: (c: unknown) => c is CubicCurve2d = internal.isCubicCurve2d

export const solve: {
  /**
   * Solves the cubic curve for a given parameter t.
   *
   * @param t - The parameter value.
   * @returns A function that takes a cubic curve and returns the point on the curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: CubicCurve2d) => Vector2
  /**
   * Solves the cubic curve for a given parameter t.
   *
   * @param c - The cubic curve to solve.
   * @param t - The parameter value.
   * @returns The point on the curve at parameter t.
   * @since 1.0.0
   */
  (c: CubicCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  /**
   * Calculates (approximates) the length of a cubic curve.
   *
   * @param c - The cubic curve to calculate the length of.
   * @param i - The interval over which to calculate the length.
   * @returns The length of the cubic curve.
   * @since 1.0.0
   */
  (c: CubicCurve2d, i: Interval): number
  /**
   * Calculates (approximates) the length of a cubic curve.
   *
   * @param i - The interval over which to calculate the length.
   * @returns A function that takes a cubic curve and returns the length of the cubic curve.
   * @since 1.0.0
   */
  (i: Interval): (c: CubicCurve2d) => number
} = internal.length

export const solveAtX: {
  /**
   * Evaluates the curve's y values at a given x. Because the x polynomial is
   * `Monotonic`, the inverse has at most one solution — at most one y value.
   *
   * @param c - The cubic curve.
   * @param x - The x coordinate.
   * @returns Zero or one y values, in t-ascending order.
   * @since 2.0.0
   */
  <XT extends Monotonic, YT>(c: CubicCurve2d<XT, YT>, x: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's y values at a given x. The result is the y values
   * the curve passes through where x(t) = the given x — up to three solutions
   * for a cubic curve.
   *
   * @param c - The cubic curve.
   * @param x - The x coordinate.
   * @returns The y values at x, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT>(c: CubicCurve2d<XT, YT>, x: number): Solution.AtMostThree<number>
  /** @since 2.0.0 */
  (x: number): {
    <XT extends Monotonic, YT>(c: CubicCurve2d<XT, YT>): Solution.AtMostOne<number>
    <XT, YT>(c: CubicCurve2d<XT, YT>): Solution.AtMostThree<number>
  }
} = internal.solveAtX as never

export const solveAtY: {
  /**
   * Evaluates the curve's x values at a given y. Because the y polynomial is
   * `Monotonic`, the inverse has at most one solution.
   *
   * @param c - The cubic curve.
   * @param y - The y coordinate.
   * @returns Zero or one x values, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT extends Monotonic>(c: CubicCurve2d<XT, YT>, y: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's x values at a given y. The result is the x values
   * the curve passes through where y(t) = the given y — up to three solutions
   * for a cubic curve.
   *
   * @param c - The cubic curve.
   * @param y - The y coordinate.
   * @returns The x values at y, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT>(c: CubicCurve2d<XT, YT>, y: number): Solution.AtMostThree<number>
  /** @since 2.0.0 */
  (y: number): {
    <XT, YT extends Monotonic>(c: CubicCurve2d<XT, YT>): Solution.AtMostOne<number>
    <XT, YT>(c: CubicCurve2d<XT, YT>): Solution.AtMostThree<number>
  }
} = internal.solveAtY as never

export const curvature: {
  /**
   * Calculates the curvature of a cubic curve at a given parameter.
   *
   * @param c - The cubic curve to calculate the curvature for.
   * @param t - The parameter value.
   * @returns The curvature of the cubic curve at parameter t.
   * @since 1.0.0
   */
  (c: CubicCurve2d, t: number): number
  /**
   * Calculates the curvature of a cubic curve at a given parameter.
   *
   * @param t - The parameter value.
   * @returns A function that takes a cubic curve and returns the curvature of the cubic curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: CubicCurve2d) => number
} = internal.curvature

/**
 * Computes the axis-aligned bounding box of the curve over its parameter
 * domain `[0, 1]`. Accounts for up to two interior extrema per axis, so the
 * box is tight against the curve and not just the control polygon.
 *
 * @param c - The cubic curve.
 * @returns A closed `Box2d` enclosing the curve.
 * @since 2.0.0
 */
export const boundingBox: (c: CubicCurve2d) => Interval2d<Closed, Closed> = internal.boundingBox

/**
 * Type-narrowing predicate: refines both axes' traits to include `Monotonic`
 * when both x and y polynomials are monotonic over the unit interval `[0, 1]`.
 *
 * For checking only one axis, call the polynomial-level refiner directly:
 * `CubicPolynomial.isMonotonic(curve.x, Interval.unit)`.
 *
 * @since 2.0.0
 */
export const isMonotonic: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Monotonic, YT & Monotonic> = internal.isMonotonic

/** @since 2.0.0 */
export const isIncreasing: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Increasing, YT & Increasing> = internal.isIncreasing

/** @since 2.0.0 */
export const isDecreasing: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Decreasing, YT & Decreasing> = internal.isDecreasing

/** @since 2.0.0 */
export const asMonotonic: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => CubicCurve2d<XT & Monotonic, YT & Monotonic> = internal.asMonotonic

/** @since 2.0.0 */
export const asIncreasing: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => CubicCurve2d<XT & Increasing, YT & Increasing> = internal.asIncreasing

/** @since 2.0.0 */
export const asDecreasing: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => CubicCurve2d<XT & Decreasing, YT & Decreasing> = internal.asDecreasing
