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

export type { Monotonic, Increasing, Decreasing } from '../polynomial/traits.ts'

/**
 * A cubic curve in 2D space.
 *
 * All fields are readonly. No operation mutates a curve.
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
 * Each argument bundles the per-axis coefficient at the given power. `c0`
 * holds the x^0 term, `c1` holds the x^1 term, and so on. The resulting curve
 * evaluates to `c0 + c1*t + c2*t^2 + c3*t^3` per axis.
 *
 * @param c0 - The x^0 coefficients (x and y).
 * @param c1 - The x^1 coefficients (x and y).
 * @param c2 - The x^2 coefficients (x and y).
 * @param c3 - The x^3 coefficients (x and y).
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
 * The four arguments are the Bernstein-basis control points. `p0` and `p3` are
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
   * Evaluates the curve at parameter `t`.
   *
   * @param t - The curve parameter, conventionally in `[0, 1]`.
   * @returns A function that takes a cubic curve and returns the point at `t`.
   * @since 1.0.0
   */
  (t: number): (c: CubicCurve2d) => Vector2
  /**
   * Evaluates the curve at parameter `t`.
   *
   * `t` is not clamped. Values outside `[0, 1]` extrapolate the curve's
   * polynomials.
   *
   * @param c - The cubic curve to evaluate.
   * @param t - The curve parameter, conventionally in `[0, 1]`.
   * @returns The point on the curve at parameter `t`.
   * @since 1.0.0
   */
  (c: CubicCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  /**
   * Calculates the arc length of a cubic curve over an interval of its
   * parameter domain, approximated by numerical quadrature.
   *
   * @param c - The cubic curve to measure.
   * @param i - The parameter interval to measure over.
   * @returns The arc length over the interval, to quadrature accuracy.
   * @since 1.0.0
   */
  (c: CubicCurve2d, i: Interval): number
  /**
   * Calculates the arc length of a cubic curve over an interval of its
   * parameter domain, approximated by numerical quadrature.
   *
   * @param i - The parameter interval to measure over.
   * @returns A function that takes a cubic curve and returns the arc length.
   * @since 1.0.0
   */
  (i: Interval): (c: CubicCurve2d) => number
} = internal.length

export const solveAtX: {
  /**
   * Evaluates the curve's y values at a given x. Because the x polynomial is
   * `Monotonic`, the inverse has at most one solution, at most one y value.
   *
   * @param c - The cubic curve.
   * @param x - The x coordinate.
   * @returns Zero or one y values, in t-ascending order.
   * @since 2.0.0
   */
  <XT extends Monotonic, YT>(c: CubicCurve2d<XT, YT>, x: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's y values at a given x. The result is the y values
   * the curve passes through where x(t) = the given x, up to three solutions
   * for a cubic curve.
   *
   * @param c - The cubic curve.
   * @param x - The x coordinate.
   * @returns The y values at x, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT>(c: CubicCurve2d<XT, YT>, x: number): Solution.AtMostThree<number>
  /**
   * Evaluates the curve's y values at a given x.
   *
   * @param x - The x coordinate.
   * @returns A function that takes a cubic curve and returns the y values at `x`.
   * @since 2.0.0
   */
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
   * the curve passes through where y(t) = the given y, up to three solutions
   * for a cubic curve.
   *
   * @param c - The cubic curve.
   * @param y - The y coordinate.
   * @returns The x values at y, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT>(c: CubicCurve2d<XT, YT>, y: number): Solution.AtMostThree<number>
  /**
   * Evaluates the curve's x values at a given y.
   *
   * @param y - The y coordinate.
   * @returns A function that takes a cubic curve and returns the x values at `y`.
   * @since 2.0.0
   */
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
 * @returns A closed `Interval2d` enclosing the curve.
 * @since 2.0.0
 */
export const boundingBox: (c: CubicCurve2d) => Interval2d<Closed, Closed> = internal.boundingBox

/**
 * Evaluates the curve at `t = 0` in closed form: `(c.x.c0, c.y.c0)`.
 *
 * @param c - The cubic curve.
 * @returns The point at the start of the curve's parameter domain.
 * @since 2.0.0
 */
export const startPoint: (c: CubicCurve2d) => Vector2 = internal.startPoint

/**
 * Evaluates the curve at `t = 1` in closed form, the sum of the per-axis
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
 * Renders the curve as a single SVG path-data drawing command. For a cubic
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
 * Checks if the curve's x polynomial is strictly monotonic on the unit
 * interval `[0, 1]`, adding `Monotonic` to the x-axis trait. The y-axis
 * trait is unchanged.
 *
 * @param c - The cubic curve to check.
 * @returns `true` when x is strictly monotonic on `[0, 1]`, narrowing the x-axis trait.
 * @since 2.0.0
 */
export const isMonotonicX: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Monotonic, YT> = internal.isMonotonicX

/**
 * Checks if the curve's x polynomial is strictly increasing on the
 * unit interval `[0, 1]`, adding `Increasing` to the x-axis trait.
 * The y-axis trait is unchanged.
 *
 * @param c - The cubic curve to check.
 * @returns `true` when x is strictly increasing on `[0, 1]`, narrowing the x-axis trait.
 * @since 2.0.0
 */
export const isIncreasingX: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Increasing, YT> = internal.isIncreasingX

/**
 * Checks if the curve's x polynomial is strictly decreasing on the
 * unit interval `[0, 1]`, adding `Decreasing` to the x-axis trait.
 * The y-axis trait is unchanged.
 *
 * @param c - The cubic curve to check.
 * @returns `true` when x is strictly decreasing on `[0, 1]`, narrowing the x-axis trait.
 * @since 2.0.0
 */
export const isDecreasingX: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Decreasing, YT> = internal.isDecreasingX

/**
 * Checks if the curve's y polynomial is strictly monotonic on the unit
 * interval `[0, 1]`, adding `Monotonic` to the y-axis trait. The x-axis
 * trait is unchanged.
 *
 * @param c - The cubic curve to check.
 * @returns `true` when y is strictly monotonic on `[0, 1]`, narrowing the y-axis trait.
 * @since 2.0.0
 */
export const isMonotonicY: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT, YT & Monotonic> = internal.isMonotonicY

/**
 * Checks if the curve's y polynomial is strictly increasing on the
 * unit interval `[0, 1]`, adding `Increasing` to the y-axis trait.
 * The x-axis trait is unchanged.
 *
 * @param c - The cubic curve to check.
 * @returns `true` when y is strictly increasing on `[0, 1]`, narrowing the y-axis trait.
 * @since 2.0.0
 */
export const isIncreasingY: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT, YT & Increasing> = internal.isIncreasingY

/**
 * Checks if the curve's y polynomial is strictly decreasing on the
 * unit interval `[0, 1]`, adding `Decreasing` to the y-axis trait.
 * The x-axis trait is unchanged.
 *
 * @param c - The cubic curve to check.
 * @returns `true` when y is strictly decreasing on `[0, 1]`, narrowing the y-axis trait.
 * @since 2.0.0
 */
export const isDecreasingY: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT, YT & Decreasing> = internal.isDecreasingY

/**
 * Checks if both the x and y polynomials are strictly monotonic on the
 * unit interval `[0, 1]`, adding `Monotonic` to both axes' traits.
 *
 * @param c - The cubic curve to check.
 * @returns `true` when both axes are strictly monotonic on `[0, 1]`, narrowing both traits.
 * @since 2.0.0
 */
export const isMonotonic: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Monotonic, YT & Monotonic> = internal.isMonotonic

/**
 * Checks if both the x and y polynomials are strictly increasing on
 * the unit interval `[0, 1]`, adding `Increasing` to both axes' traits.
 *
 * @param c - The cubic curve to check.
 * @returns `true` when both axes are strictly increasing on `[0, 1]`, narrowing both traits.
 * @since 2.0.0
 */
export const isIncreasing: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Increasing, YT & Increasing> = internal.isIncreasing

/**
 * Checks if both the x and y polynomials are strictly decreasing on
 * the unit interval `[0, 1]`, adding `Decreasing` to both axes' traits.
 *
 * @param c - The cubic curve to check.
 * @returns `true` when both axes are strictly decreasing on `[0, 1]`, narrowing both traits.
 * @since 2.0.0
 */
export const isDecreasing: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => c is CubicCurve2d<XT & Decreasing, YT & Decreasing> = internal.isDecreasing

/**
 * Asserts that both axes are strictly monotonic on the unit interval
 * `[0, 1]`, throwing on failure.
 *
 * @param c - The cubic curve to assert against.
 * @returns The same curve, with `Monotonic` on both axes' traits.
 * @throws `Error` when either axis fails the check.
 * @since 2.0.0
 */
export const asMonotonic: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => CubicCurve2d<XT & Monotonic, YT & Monotonic> = internal.asMonotonic

/**
 * Asserts that both axes are strictly increasing on the unit interval
 * `[0, 1]`, throwing on failure.
 *
 * @param c - The cubic curve to assert against.
 * @returns The same curve, with `Increasing` on both axes' traits.
 * @throws `Error` when either axis fails the check.
 * @since 2.0.0
 */
export const asIncreasing: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => CubicCurve2d<XT & Increasing, YT & Increasing> = internal.asIncreasing

/**
 * Asserts that both axes are strictly decreasing on the unit interval
 * `[0, 1]`, throwing on failure.
 *
 * @param c - The cubic curve to assert against.
 * @returns The same curve, with `Decreasing` on both axes' traits.
 * @throws `Error` when either axis fails the check.
 * @since 2.0.0
 */
export const asDecreasing: <XT, YT>(
  c: CubicCurve2d<XT, YT>,
) => CubicCurve2d<XT & Decreasing, YT & Decreasing> = internal.asDecreasing

export const transform: {
  /**
   * Applies an `Affine2d` transform to a `CubicCurve2d`, returning a new
   * curve whose image is the affine image of the original. Internally the
   * transformation works directly on monomial coefficients. `c0` receives
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
