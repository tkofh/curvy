import type { Interval2d } from '../interval/interval2d.ts'
import type { TwoDimensional } from '../dimensions.ts'
import type { Closed, Interval } from '../interval/interval.ts'
import type { Pipeable } from '../utils.ts'
import type { LinearPolynomial } from '../polynomial/linear.ts'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { LinearCurve2dTypeId } from './linear2d.internal.ts'
import * as internal from './linear2d.internal.ts'

export type { Monotonic, Increasing, Decreasing } from '../polynomial/traits.ts'

/**
 * A linear curve in 2D space, a straight segment parameterized over
 * `t ∈ [0, 1]` by one `LinearPolynomial` per axis.
 *
 * All fields are readonly. No operation mutates a curve. Construct via
 * `fromPolynomials`, `fromCoefficients`, or `fromEndpoints`.
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
 * Each argument bundles the per-axis coefficient at the given power. `c0`
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
export const fromEndpoints: (p0: Vector2, p1: Vector2) => LinearCurve2d = internal.fromEndpoints

/**
 * Checks if a value is a `LinearCurve2d`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `LinearCurve2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isLinearCurve2d: (c: unknown) => c is LinearCurve2d = internal.isLinearCurve2d

/**
 * Gets the derivative of a linear curve.
 *
 * @param c - The linear curve to get the derivative of.
 * @returns The constant velocity `(x.c1, y.c1)`.
 * @since 1.0.0
 */
export const derivative: (c: LinearCurve2d) => Vector2 = internal.derivative

export const solve: {
  /**
   * Evaluates the curve at parameter `t`.
   *
   * @param t - The curve parameter, conventionally in `[0, 1]`.
   * @returns A function that takes a linear curve and returns the point at `t`.
   * @since 1.0.0
   */
  (t: number): (c: LinearCurve2d) => Vector2
  /**
   * Evaluates the curve at parameter `t`.
   *
   * `t` is not clamped. Values outside `[0, 1]` extrapolate along the same
   * line.
   *
   * @param c - The linear curve to evaluate.
   * @param t - The curve parameter, conventionally in `[0, 1]`.
   * @returns The point on the curve at parameter `t`.
   * @since 1.0.0
   */
  (c: LinearCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  /**
   * Calculates the arc length of a linear curve over an interval of its
   * parameter domain.
   *
   * For a straight segment the length is exact:
   * `|velocity| * size(interval)`.
   *
   * @param c - The linear curve to measure.
   * @param i - The parameter interval to measure over.
   * @returns The arc length over the interval.
   * @since 1.0.0
   */
  (c: LinearCurve2d, i: Interval): number
  /**
   * Calculates the arc length of a linear curve over an interval of its
   * parameter domain.
   *
   * @param i - The parameter interval to measure over.
   * @returns A function that takes a linear curve and returns the arc length.
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
 * @returns A closed `Interval2d` enclosing the curve.
 * @since 2.0.0
 */
export const boundingBox: (c: LinearCurve2d) => Interval2d<Closed, Closed> = internal.boundingBox

/**
 * Evaluates the curve at `t = 0` in closed form: `(c.x.c0, c.y.c0)`.
 *
 * @param c - The linear curve.
 * @returns The point at the start of the curve's parameter domain.
 * @since 2.0.0
 */
export const startPoint: (c: LinearCurve2d) => Vector2 = internal.startPoint

/**
 * Evaluates the curve at `t = 1` in closed form: `(c.x.c0 + c.x.c1, c.y.c0 + c.y.c1)`.
 *
 * @param c - The linear curve.
 * @returns The point at the end of the curve's parameter domain.
 * @since 2.0.0
 */
export const endPoint: (c: LinearCurve2d) => Vector2 = internal.endPoint

/**
 * The tight `[min, max]` range of x over the curve's parameter domain `[0, 1]`.
 * For a linear curve this is the closed interval bounded by the two endpoints'
 * x coordinates.
 *
 * @param c - The linear curve.
 * @returns The closed range of x over `[0, 1]`.
 * @since 2.0.0
 */
export const xRange: (c: LinearCurve2d) => Closed = internal.xRange

/**
 * The tight `[min, max]` range of y over the curve's parameter domain `[0, 1]`.
 * For a linear curve this is the closed interval bounded by the two endpoints'
 * y coordinates.
 *
 * @param c - The linear curve.
 * @returns The closed range of y over `[0, 1]`.
 * @since 2.0.0
 */
export const yRange: (c: LinearCurve2d) => Closed = internal.yRange

/**
 * Renders the curve as a single SVG path-data drawing command. For a linear
 * curve, `L endX,endY`. Does not include a leading `M`. Callers (typically a
 * path-level `toPathData`) decide whether to emit a move based on continuity
 * with the previous segment.
 *
 * @param c - The linear curve.
 * @returns The SVG drawing command for this segment, without a leading `M`.
 * @since 2.0.0
 */
export const toPathDataSegment: (c: LinearCurve2d) => string = internal.toPathDataSegment

export const solveAtX: {
  /**
   * Evaluates the curve's y value at a given x. A linear curve crosses any
   * vertical line at most once within the parameter domain `[0, 1]`, so
   * the result is at most one y. Returns `Solution.none` when the curve
   * never reaches `x` inside `[0, 1]` or when the curve's x polynomial is
   * constant.
   *
   * @param c - The linear curve.
   * @param x - The x coordinate.
   * @returns The y value at `x`, or `Solution.none` when the curve never reaches it.
   * @since 2.0.0
   */
  <XT, YT>(c: LinearCurve2d<XT, YT>, x: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's y value at a given x.
   *
   * @param x - The x coordinate.
   * @returns A function that takes a linear curve and returns the y value at `x`.
   * @since 2.0.0
   */
  (x: number): <XT, YT>(c: LinearCurve2d<XT, YT>) => Solution.AtMostOne<number>
} = internal.solveAtX as never

export const solveAtY: {
  /**
   * Evaluates the curve's x value at a given y. A linear curve crosses any
   * horizontal line at most once within the parameter domain `[0, 1]`, so
   * the result is at most one x. Returns `Solution.none` when the curve
   * never reaches `y` inside `[0, 1]` or when the curve's y polynomial is
   * constant.
   *
   * @param c - The linear curve.
   * @param y - The y coordinate.
   * @returns The x value at `y`, or `Solution.none` when the curve never reaches it.
   * @since 2.0.0
   */
  <XT, YT>(c: LinearCurve2d<XT, YT>, y: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's x value at a given y.
   *
   * @param y - The y coordinate.
   * @returns A function that takes a linear curve and returns the x value at `y`.
   * @since 2.0.0
   */
  (y: number): <XT, YT>(c: LinearCurve2d<XT, YT>) => Solution.AtMostOne<number>
} = internal.solveAtY as never

/**
 * Checks if the curve's x polynomial is strictly monotonic, adding
 * `Monotonic` to the x-axis trait. The y-axis trait is unchanged.
 *
 * @param c - The linear curve to check.
 * @returns `true` when x is strictly monotonic, narrowing the x-axis trait.
 * @since 2.0.0
 */
export const isMonotonicX: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT & Monotonic, YT> = internal.isMonotonicX

/**
 * Checks if the curve's x polynomial is strictly increasing, adding
 * `Increasing` to the x-axis trait.
 *
 * @param c - The linear curve to check.
 * @returns `true` when x is strictly increasing, narrowing the x-axis trait.
 * @since 2.0.0
 */
export const isIncreasingX: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT & Increasing, YT> = internal.isIncreasingX

/**
 * Checks if the curve's x polynomial is strictly decreasing, adding
 * `Decreasing` to the x-axis trait.
 *
 * @param c - The linear curve to check.
 * @returns `true` when x is strictly decreasing, narrowing the x-axis trait.
 * @since 2.0.0
 */
export const isDecreasingX: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT & Decreasing, YT> = internal.isDecreasingX

/**
 * Checks if the curve's y polynomial is strictly monotonic, adding
 * `Monotonic` to the y-axis trait. The x-axis trait is unchanged.
 *
 * @param c - The linear curve to check.
 * @returns `true` when y is strictly monotonic, narrowing the y-axis trait.
 * @since 2.0.0
 */
export const isMonotonicY: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT, YT & Monotonic> = internal.isMonotonicY

/**
 * Checks if the curve's y polynomial is strictly increasing, adding
 * `Increasing` to the y-axis trait.
 *
 * @param c - The linear curve to check.
 * @returns `true` when y is strictly increasing, narrowing the y-axis trait.
 * @since 2.0.0
 */
export const isIncreasingY: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT, YT & Increasing> = internal.isIncreasingY

/**
 * Checks if the curve's y polynomial is strictly decreasing, adding
 * `Decreasing` to the y-axis trait.
 *
 * @param c - The linear curve to check.
 * @returns `true` when y is strictly decreasing, narrowing the y-axis trait.
 * @since 2.0.0
 */
export const isDecreasingY: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT, YT & Decreasing> = internal.isDecreasingY

/**
 * Checks if both the x and y polynomials are strictly monotonic, adding
 * `Monotonic` to both axes' traits. A curve monotonic in both axes is
 * invertible in either direction.
 *
 * @param c - The linear curve to check.
 * @returns `true` when both axes are strictly monotonic, narrowing both traits.
 * @since 2.0.0
 */
export const isMonotonic: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT & Monotonic, YT & Monotonic> = internal.isMonotonic

/**
 * Checks if both the x and y polynomials are strictly increasing, adding
 * `Increasing` to both axes' traits.
 *
 * @param c - The linear curve to check.
 * @returns `true` when both axes are strictly increasing, narrowing both traits.
 * @since 2.0.0
 */
export const isIncreasing: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT & Increasing, YT & Increasing> = internal.isIncreasing

/**
 * Checks if both the x and y polynomials are strictly decreasing, adding
 * `Decreasing` to both axes' traits.
 *
 * @param c - The linear curve to check.
 * @returns `true` when both axes are strictly decreasing, narrowing both traits.
 * @since 2.0.0
 */
export const isDecreasing: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => c is LinearCurve2d<XT & Decreasing, YT & Decreasing> = internal.isDecreasing

/**
 * Asserts monotonicity in both axes, throwing on failure.
 *
 * @param c - The linear curve to assert against.
 * @returns The same curve, with `Monotonic` on both axes' traits.
 * @throws `Error` when either axis is not strictly monotonic.
 * @since 2.0.0
 */
export const asMonotonic: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => LinearCurve2d<XT & Monotonic, YT & Monotonic> = internal.asMonotonic

/**
 * Asserts that both axes are strictly increasing, throwing on failure.
 *
 * @param c - The linear curve to assert against.
 * @returns The same curve, with `Increasing` on both axes' traits.
 * @throws `Error` when either axis is not strictly increasing.
 * @since 2.0.0
 */
export const asIncreasing: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => LinearCurve2d<XT & Increasing, YT & Increasing> = internal.asIncreasing

/**
 * Asserts that both axes are strictly decreasing, throwing on failure.
 *
 * @param c - The linear curve to assert against.
 * @returns The same curve, with `Decreasing` on both axes' traits.
 * @throws `Error` when either axis is not strictly decreasing.
 * @since 2.0.0
 */
export const asDecreasing: <XT, YT>(
  c: LinearCurve2d<XT, YT>,
) => LinearCurve2d<XT & Decreasing, YT & Decreasing> = internal.asDecreasing

export const transform: {
  /**
   * Applies an `Affine2d` transform to a `LinearCurve2d`, returning a new
   * curve whose image is the affine image of the original. The transformation
   * is exact. Linear curves are degree-1 in every basis, and affine maps
   * commute with the basis.
   *
   * @param c - The linear curve.
   * @param a - The affine transform.
   * @returns The transformed linear curve.
   * @since 2.0.0
   */
  (c: LinearCurve2d, a: Affine2d): LinearCurve2d
  /**
   * Applies an `Affine2d` transform to a `LinearCurve2d`.
   *
   * @param a - The affine transform.
   * @returns A function that takes a `LinearCurve2d` and returns the transformed curve.
   * @since 2.0.0
   */
  (a: Affine2d): (c: LinearCurve2d) => LinearCurve2d
} = internal.transform
