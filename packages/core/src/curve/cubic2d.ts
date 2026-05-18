import type { Interval2d } from '../interval/interval2d.ts'
import type { TwoDimensional } from '../dimensions.ts'
import type { Closed, Interval } from '../interval/interval.ts'
import type { Pipeable } from '../utils.ts'
import type { CubicPolynomial } from '../polynomial/cubic.ts'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { CubicCurve2dTypeId } from './cubic2d.internal.ts'
import * as internal from './cubic2d.internal.ts'
import type { Curve2dOps } from './curve2d.ts'

export type { Monotonic, Increasing, Decreasing } from '../polynomial/traits.ts'

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
 * Evaluates the curve at `t = 0` in closed form — `(c.x.c0, c.y.c0)`.
 *
 * @param c - The cubic curve.
 * @returns The point at the start of the curve's parameter domain.
 * @since 2.0.0
 */
export const startPoint: (c: CubicCurve2d) => Vector2 = internal.startPoint

/**
 * Evaluates the curve at `t = 1` in closed form — the sum of the per-axis
 * monomial coefficients.
 *
 * @param c - The cubic curve.
 * @returns The point at the end of the curve's parameter domain.
 * @since 2.0.0
 */
export const endPoint: (c: CubicCurve2d) => Vector2 = internal.endPoint

/**
 * The tight `[min, max]` range of x over the curve's parameter domain `[0, 1]`,
 * accounting for up to two interior extrema.
 *
 * @param c - The cubic curve.
 * @returns The closed range of x over `[0, 1]`.
 * @since 2.0.0
 */
export const xRange: (c: CubicCurve2d) => Closed = internal.xRange

/**
 * The tight `[min, max]` range of y over the curve's parameter domain `[0, 1]`,
 * accounting for up to two interior extrema.
 *
 * @param c - The cubic curve.
 * @returns The closed range of y over `[0, 1]`.
 * @since 2.0.0
 */
export const yRange: (c: CubicCurve2d) => Closed = internal.yRange

/**
 * Renders the curve as a single SVG path-data drawing command — for a cubic
 * curve, `C ctrl1X,ctrl1Y ctrl2X,ctrl2Y endX,endY`. Bernstein control points
 * are recovered from the monomial coefficients in closed form. Does not
 * include a leading `M`.
 *
 * @param c - The cubic curve.
 * @returns The SVG drawing command for this segment, without a leading `M`.
 * @since 2.0.0
 */
export const toPathDataSegment: (c: CubicCurve2d) => string = internal.toPathDataSegment

/**
 * Type-narrowing predicate: refines the curve's x-axis trait to include
 * `Monotonic` when the x polynomial is strictly monotonic on the unit
 * interval `[0, 1]`. The y-axis trait is unchanged.
 *
 * @since 2.0.0
 */
export const isMonotonicX: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Monotonic, YT> = internal.isMonotonicX

/** @since 2.0.0 */
export const isIncreasingX: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Increasing, YT> = internal.isIncreasingX

/** @since 2.0.0 */
export const isDecreasingX: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Decreasing, YT> = internal.isDecreasingX

/**
 * Type-narrowing predicate: refines the curve's y-axis trait to include
 * `Monotonic`. The x-axis trait is unchanged.
 *
 * @since 2.0.0
 */
export const isMonotonicY: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT, YT & Monotonic> = internal.isMonotonicY

/** @since 2.0.0 */
export const isIncreasingY: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT, YT & Increasing> = internal.isIncreasingY

/** @since 2.0.0 */
export const isDecreasingY: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT, YT & Decreasing> = internal.isDecreasingY

/**
 * Type-narrowing predicate: refines both axes' traits to include `Monotonic`
 * when both x and y polynomials are monotonic over the unit interval `[0, 1]`.
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

export const transform: {
  /**
   * Applies an `Affine2d` transform to a `CubicCurve2d`, returning a new
   * curve whose image is the affine image of the original. Internally the
   * transformation works directly on monomial coefficients — `c0` receives
   * the full affine, `c1`/`c2`/`c3` receive only the linear part.
   *
   * @param c - The cubic curve.
   * @param a - The affine transform.
   * @returns The transformed cubic curve.
   * @since 2.0.0
   */
  (c: CubicCurve2d, a: Affine2d): CubicCurve2d
  /**
   * Applies an `Affine2d` transform to a `CubicCurve2d`.
   *
   * @param a - The affine transform.
   * @returns A function that takes a `CubicCurve2d` and returns the transformed curve.
   * @since 2.0.0
   */
  (a: Affine2d): (c: CubicCurve2d) => CubicCurve2d
} = internal.transform

/**
 * The {@link Curve2dOps} bundle for `CubicCurve2d`. Used by `CubicPath2d`
 * to wire up the path-level operation surface. The `solveAtX` / `solveAtY`
 * entries narrow the curve's potentially-3-element result to `AtMostOne` —
 * path callers enforce that via the path's `MonotonicX`/`MonotonicY` brand.
 *
 * @since 2.0.0
 */
export const Ops: Curve2dOps<CubicCurve2d> = {
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
  transform,
}
