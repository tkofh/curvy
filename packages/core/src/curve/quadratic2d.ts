import type { Interval2d } from '../interval/interval2d.ts'
import type { TwoDimensional } from '../dimensions.ts'
import type { Closed, Interval } from '../interval/interval.ts'
import type { Pipeable } from '../utils.ts'
import type { QuadraticPolynomial } from '../polynomial/quadratic.ts'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits.ts'
import type * as Solution from '../solution/solution.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Curve2dOps } from './curve2d.ts'
import type { LinearCurve2d } from './linear2d.ts'
import type { QuadraticCurve2dTypeId } from './quadratic2d.internal.ts'
import * as internal from './quadratic2d.internal.ts'

export type { Monotonic, Increasing, Decreasing } from '../polynomial/traits.ts'

/**
 * A quadratic curve in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The two type parameters carry the trait sets of the curve's per-axis
 * polynomials. Refiners check monotonicity over the unit interval `[0, 1]` —
 * the curve's natural parameter domain.
 *
 * @since 1.0.0
 */
export interface QuadraticCurve2d<out XTraits = unknown, out YTraits = unknown>
  extends Pipeable, TwoDimensional<QuadraticPolynomial<XTraits>, QuadraticPolynomial<YTraits>> {
  readonly [QuadraticCurve2dTypeId]: QuadraticCurve2dTypeId
}

/**
 * Creates a new `QuadraticCurve2d` instance from polynomial parameters.
 *
 * @param c0 - The x polynomial.
 * @param c1 - The y polynomial.
 * @returns A new `QuadraticCurve2d` instance.
 * @since 1.0.0
 */
export const fromPolynomials: (
  c0: QuadraticPolynomial,
  c1: QuadraticPolynomial,
) => QuadraticCurve2d = internal.fromPolynomials

/**
 * Creates a new `QuadraticCurve2d` instance from monomial coefficient vectors.
 *
 * Each argument bundles the per-axis coefficient at the given power: `c0`
 * holds the x⁰ term, `c1` holds the x¹ term, and so on. The resulting curve
 * evaluates to `c0 + c1·t + c2·t²` per axis.
 *
 * @param c0 - The x⁰ coefficients (x and y).
 * @param c1 - The x¹ coefficients (x and y).
 * @param c2 - The x² coefficients (x and y).
 * @returns A new `QuadraticCurve2d` instance.
 * @since 2.0.0
 */
export const fromCoefficients: (c0: Vector2, c1: Vector2, c2: Vector2) => QuadraticCurve2d =
  internal.fromCoefficients

/**
 * Creates a new `QuadraticCurve2d` instance from quadratic Bézier control
 * points.
 *
 * The three arguments are the Bernstein-basis control points: `p0` and `p2`
 * are the curve's endpoints and `p1` is the off-curve control handle. The
 * implementation converts to the curve's internal monomial form in closed
 * form.
 *
 * @param p0 - The first control point (curve start).
 * @param p1 - The second control point (control handle).
 * @param p2 - The third control point (curve end).
 * @returns A new `QuadraticCurve2d` instance whose curve matches the given Bézier.
 * @since 2.0.0
 */
export const fromBezierPoints: (p0: Vector2, p1: Vector2, p2: Vector2) => QuadraticCurve2d =
  internal.fromBezierPoints

/**
 * Checks if a value is a `QuadraticCurve2d`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `QuadraticCurve2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isQuadraticCurve2d: (c: unknown) => c is QuadraticCurve2d = internal.isQuadraticCurve2d

export const solve: {
  /**
   * Solves the quadratic curve for a given parameter t.
   *
   * @param t - The parameter value.
   * @returns A function that takes a quadratic curve and returns the point on the curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: QuadraticCurve2d) => Vector2
  /**
   * Solves the quadratic curve for a given parameter t.
   *
   * @param c - The quadratic curve to solve.
   * @param t - The parameter value.
   * @returns The point on the curve at parameter t.
   * @since 1.0.0
   */
  (c: QuadraticCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  /**
   * Computes the length of the quadratic curve over a given interval.
   *
   * @param c - The quadratic curve to compute the length of.
   * @param i - The interval over which to compute the length.
   * @returns The length of the quadratic curve over the interval.
   * @since 1.0.0
   */
  (c: QuadraticCurve2d, i: Interval): number
  /**
   * Computes the length of the quadratic curve over a given interval.
   *
   * @param i - The interval over which to compute the length.
   * @returns A function that takes a quadratic curve and returns the length of the curve over the interval.
   * @since 1.0.0
   */
  (i: Interval): (c: QuadraticCurve2d) => number
} = internal.length

export const solveAtX: {
  /**
   * Evaluates the curve's y values at a given x. Because the x polynomial is
   * `Monotonic`, the inverse has at most one solution — at most one y value.
   *
   * @param c - The quadratic curve.
   * @param x - The x coordinate.
   * @returns Zero or one y values, in t-ascending order.
   * @since 2.0.0
   */
  <XT extends Monotonic, YT>(c: QuadraticCurve2d<XT, YT>, x: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's y values at a given x. The result is the y values
   * the curve passes through where x(t) = the given x — up to two solutions
   * for a quadratic curve.
   *
   * @param c - The quadratic curve.
   * @param x - The x coordinate.
   * @returns The y values at x, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT>(c: QuadraticCurve2d<XT, YT>, x: number): Solution.AtMostTwo<number>
  /** @since 2.0.0 */
  (x: number): {
    <XT extends Monotonic, YT>(c: QuadraticCurve2d<XT, YT>): Solution.AtMostOne<number>
    <XT, YT>(c: QuadraticCurve2d<XT, YT>): Solution.AtMostTwo<number>
  }
} = internal.solveAtX as never

export const solveAtY: {
  /**
   * Evaluates the curve's x values at a given y. Because the y polynomial is
   * `Monotonic`, the inverse has at most one solution.
   *
   * @param c - The quadratic curve.
   * @param y - The y coordinate.
   * @returns Zero or one x values, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT extends Monotonic>(c: QuadraticCurve2d<XT, YT>, y: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's x values at a given y. The result is the x values
   * the curve passes through where y(t) = the given y — up to two solutions
   * for a quadratic curve.
   *
   * @param c - The quadratic curve.
   * @param y - The y coordinate.
   * @returns The x values at y, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT>(c: QuadraticCurve2d<XT, YT>, y: number): Solution.AtMostTwo<number>
  /** @since 2.0.0 */
  (y: number): {
    <XT, YT extends Monotonic>(c: QuadraticCurve2d<XT, YT>): Solution.AtMostOne<number>
    <XT, YT>(c: QuadraticCurve2d<XT, YT>): Solution.AtMostTwo<number>
  }
} = internal.solveAtY as never

/**
 * Computes the derivative of a quadratic curve.
 *
 * @param c - The quadratic curve to compute the derivative of.
 * @returns The derivative of the quadratic curve as a linear curve.
 * @since 1.0.0
 */
export const derivative: (c: QuadraticCurve2d) => LinearCurve2d = internal.derivative

export const curvature: {
  /**
   * Computes the curvature of the quadratic curve at a given parameter t.
   *
   * @param c - The quadratic curve to compute the curvature for.
   * @param t - The parameter value.
   * @returns The curvature of the quadratic curve at parameter t.
   * @since 1.0.0
   */
  (c: QuadraticCurve2d, t: number): number
  /**
   * Computes the curvature of the quadratic curve at a given parameter t.
   *
   * @param t - The parameter value.
   * @returns A function that takes a quadratic curve and returns the curvature of the curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: QuadraticCurve2d) => number
} = internal.curvature

/**
 * Computes the axis-aligned bounding box of the curve over its parameter
 * domain `[0, 1]`. Accounts for interior extrema, so the box is tight against
 * the curve and not just the control polygon.
 *
 * @param c - The quadratic curve.
 * @returns A closed `Box2d` enclosing the curve.
 * @since 2.0.0
 */
export const boundingBox: (c: QuadraticCurve2d) => Interval2d<Closed, Closed> = internal.boundingBox

/**
 * Evaluates the curve at `t = 0` in closed form — `(c.x.c0, c.y.c0)`.
 *
 * @param c - The quadratic curve.
 * @returns The point at the start of the curve's parameter domain.
 * @since 2.0.0
 */
export const startPoint: (c: QuadraticCurve2d) => Vector2 = internal.startPoint

/**
 * Evaluates the curve at `t = 1` in closed form — the sum of the per-axis
 * monomial coefficients.
 *
 * @param c - The quadratic curve.
 * @returns The point at the end of the curve's parameter domain.
 * @since 2.0.0
 */
export const endPoint: (c: QuadraticCurve2d) => Vector2 = internal.endPoint

/**
 * The tight `[min, max]` range of x over the curve's parameter domain `[0, 1]`,
 * accounting for an interior extremum if one exists.
 *
 * @param c - The quadratic curve.
 * @returns The closed range of x over `[0, 1]`.
 * @since 2.0.0
 */
export const xRange: (c: QuadraticCurve2d) => Closed = internal.xRange

/**
 * The tight `[min, max]` range of y over the curve's parameter domain `[0, 1]`,
 * accounting for an interior extremum if one exists.
 *
 * @param c - The quadratic curve.
 * @returns The closed range of y over `[0, 1]`.
 * @since 2.0.0
 */
export const yRange: (c: QuadraticCurve2d) => Closed = internal.yRange

/**
 * Renders the curve as a single SVG path-data drawing command — for a
 * quadratic curve, `Q ctrlX,ctrlY endX,endY`, where the control point is
 * recovered from the monomial coefficients via the inverse Bernstein
 * expansion. Does not include a leading `M`.
 *
 * @param c - The quadratic curve.
 * @returns The SVG drawing command for this segment, without a leading `M`.
 * @since 2.0.0
 */
export const toPathDataSegment: (c: QuadraticCurve2d) => string = internal.toPathDataSegment

/**
 * Type-narrowing predicate: refines the curve's x-axis trait to include
 * `Monotonic` when the x polynomial is strictly monotonic on the unit
 * interval `[0, 1]`. The y-axis trait is unchanged.
 *
 * @since 2.0.0
 */
export const isMonotonicX: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => c is QuadraticCurve2d<XT & Monotonic, YT> = internal.isMonotonicX

/** @since 2.0.0 */
export const isIncreasingX: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => c is QuadraticCurve2d<XT & Increasing, YT> = internal.isIncreasingX

/** @since 2.0.0 */
export const isDecreasingX: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => c is QuadraticCurve2d<XT & Decreasing, YT> = internal.isDecreasingX

/**
 * Type-narrowing predicate: refines the curve's y-axis trait to include
 * `Monotonic`. The x-axis trait is unchanged.
 *
 * @since 2.0.0
 */
export const isMonotonicY: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => c is QuadraticCurve2d<XT, YT & Monotonic> = internal.isMonotonicY

/** @since 2.0.0 */
export const isIncreasingY: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => c is QuadraticCurve2d<XT, YT & Increasing> = internal.isIncreasingY

/** @since 2.0.0 */
export const isDecreasingY: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => c is QuadraticCurve2d<XT, YT & Decreasing> = internal.isDecreasingY

/**
 * Type-narrowing predicate: refines both axes' traits to include `Monotonic`
 * when both x and y polynomials are monotonic over the unit interval `[0, 1]`.
 *
 * @since 2.0.0
 */
export const isMonotonic: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => c is QuadraticCurve2d<XT & Monotonic, YT & Monotonic> = internal.isMonotonic

/** @since 2.0.0 */
export const isIncreasing: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => c is QuadraticCurve2d<XT & Increasing, YT & Increasing> = internal.isIncreasing

/** @since 2.0.0 */
export const isDecreasing: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => c is QuadraticCurve2d<XT & Decreasing, YT & Decreasing> = internal.isDecreasing

/** @since 2.0.0 */
export const asMonotonic: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => QuadraticCurve2d<XT & Monotonic, YT & Monotonic> = internal.asMonotonic

/** @since 2.0.0 */
export const asIncreasing: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => QuadraticCurve2d<XT & Increasing, YT & Increasing> = internal.asIncreasing

/** @since 2.0.0 */
export const asDecreasing: <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
) => QuadraticCurve2d<XT & Decreasing, YT & Decreasing> = internal.asDecreasing

/**
 * The {@link Curve2dOps} bundle for `QuadraticCurve2d`. Used by
 * `QuadraticPath2d` to wire up the path-level operation surface. The
 * `solveAtX` / `solveAtY` entries narrow the curve's potentially-2-element
 * result to `AtMostOne` — path callers enforce that via the path's
 * `MonotonicX`/`MonotonicY` brand.
 *
 * @since 2.0.0
 */
export const Ops: Curve2dOps<QuadraticCurve2d> = {
  solve,
  startPoint,
  endPoint,
  length,
  boundingBox,
  solveAtX: (c, x) => internal.solveAtX(c, x) as Solution.AtMostOne<number>,
  solveAtY: (c, y) => internal.solveAtY(c, y) as Solution.AtMostOne<number>,
  toPathDataSegment,
  isIncreasingX,
  isDecreasingX,
  isIncreasingY,
  isDecreasingY,
}
