import type { Pipeable } from '../pipe'
import type { CubicPolynomial } from '../polynomial/cubic'
import type { Increasing, Monotonic } from '../polynomial/traits'
import type * as Solution from '../solution'
import type { Vector2, Weighted } from '../vector/vector2'
import type { RationalCubicCurve2dTypeId, RationalCurveTraits } from './rationalCubic2d.internal'
import * as internal from './rationalCubic2d.internal'

export type { Decreasing, Increasing, Monotonic } from '../polynomial/traits'
export { RationalCurveTraits } from './rationalCubic2d.internal'

/**
 * A rational cubic curve in 2D space.
 *
 * Represented as three cubic polynomials in the parameter `t`: per-axis
 * numerators `x`, `y`, and a shared denominator `w`. Evaluation is
 * `(x(t)/w(t), y(t)/w(t))` — the projection from homogeneous coordinates
 * back to the plane. With all weights equal at the source (e.g. produced
 * from a non-rational Bézier with unit weights), `w` is constant and the
 * curve coincides with a polynomial cubic.
 *
 * The two type parameters carry per-axis monotonicity trait brands attached
 * to the rational functions `x(t)/w(t)` and `y(t)/w(t)`. Unlike
 * `CubicCurve2d`, traits do not flow through to the underlying polynomials —
 * monotonicity of a ratio of cubics is not the same property as monotonicity
 * of either cubic alone, so the brand lives on the curve itself. Constructors
 * with construction-time monotonicity guarantees (e.g. {@link makeMonotonicEasing})
 * return curves with `Increasing` brands attached, narrowing downstream
 * operations like {@link solveAtX} to single-solution returns.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 2.1.0
 */
export interface RationalCubicCurve2d<
  out XTraits = unknown,
  out YTraits = unknown,
> extends Pipeable {
  readonly [RationalCubicCurve2dTypeId]: RationalCubicCurve2dTypeId
  readonly [RationalCurveTraits]: [XTraits, YTraits]
  readonly x: CubicPolynomial
  readonly y: CubicPolynomial
  readonly w: CubicPolynomial
}

/**
 * Checks if a value is a `RationalCubicCurve2d`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `RationalCubicCurve2d`, `false` otherwise.
 * @since 2.1.0
 */
export const isRationalCubicCurve2d: (c: unknown) => c is RationalCubicCurve2d =
  internal.isRationalCubicCurve2d

/**
 * Creates a new `RationalCubicCurve2d` from per-axis numerator polynomials
 * and a shared denominator polynomial.
 *
 * @param x - The x numerator polynomial.
 * @param y - The y numerator polynomial.
 * @param w - The shared denominator polynomial (must be non-zero on `[0, 1]`).
 * @returns A new `RationalCubicCurve2d` instance.
 * @since 2.1.0
 */
export const fromPolynomials: (
  x: CubicPolynomial,
  y: CubicPolynomial,
  w: CubicPolynomial,
) => RationalCubicCurve2d = internal.fromPolynomials

/**
 * Creates a new `RationalCubicCurve2d` from four weighted cubic Bézier
 * control points. The four control points are lifted to homogeneous form
 * `(w·x, w·y, w)` and the cubic Bernstein basis is expanded into per-channel
 * monomial coefficients, yielding the curve's `x`, `y`, and `w` polynomials.
 *
 * @param p0 - The first weighted control point (curve start).
 * @param p1 - The second weighted control point (start handle).
 * @param p2 - The third weighted control point (end handle).
 * @param p3 - The fourth weighted control point (curve end).
 * @returns A new `RationalCubicCurve2d` instance.
 * @since 2.1.0
 */
export const fromBezierPoints: (
  p0: Weighted,
  p1: Weighted,
  p2: Weighted,
  p3: Weighted,
) => RationalCubicCurve2d = internal.fromBezierPoints

/**
 * Creates a guaranteed-monotonic rational cubic easing curve via Gregory-
 * Delbourgo style construction. The result interpolates `(0, 0)` and
 * `(1, 1)` with the given endpoint slopes, with `x(t) = t` pinned linearly
 * and a rational cubic numerator for `y(t)`. Monotonicity of `y(t)` is
 * verified rigorously at construction (degree-3 polynomial sign analysis);
 * the returned curve is branded `<Increasing, Increasing>` so that
 * {@link solveAtX} returns `Solution.AtMostOne<number>` without further
 * trait refinement.
 *
 * For input slope combinations that the default Gregory-Delbourgo
 * construction cannot accommodate (typically when one slope is large while
 * the other is small), construction throws. Useful operating range is
 * roughly `m₀, m₁ ∈ [0, 2]` with `m₀ + m₁ ≲ 3`; smoothstep (`0, 0`) and
 * linear (`1, 1`) fall out as special cases.
 *
 * @param startSlope - The easing function's slope at the start (`dy/dx` at `x = 0`); must be finite and non-negative.
 * @param endSlope - The easing function's slope at the end (`dy/dx` at `x = 1`); must be finite and non-negative.
 * @returns A monotone-by-construction rational cubic easing curve.
 * @throws When slopes are negative, non-finite, or produce a non-monotonic curve under the default construction.
 * @since 2.1.0
 */
export const makeMonotonicEasing: (
  startSlope: number,
  endSlope: number,
) => RationalCubicCurve2d<Increasing, Increasing> = internal.makeMonotonicEasing as never

export const solve: {
  /**
   * Evaluates the rational cubic curve at parameter `t`. Returns
   * `(x(t)/w(t), y(t)/w(t))` — three Horner evaluations and two divisions.
   *
   * @param c - The curve to evaluate.
   * @param t - The parameter value.
   * @returns The point on the curve at parameter `t`.
   * @since 2.1.0
   */
  (c: RationalCubicCurve2d, t: number): Vector2
  /**
   * Evaluates the rational cubic curve at parameter `t`.
   *
   * @param t - The parameter value.
   * @returns A function that takes a curve and returns the point at `t`.
   * @since 2.1.0
   */
  (t: number): (c: RationalCubicCurve2d) => Vector2
} = internal.solve

export const solveAtX: {
  /**
   * Evaluates the curve's y values at a given x. Because the curve's x axis
   * carries the `Monotonic` brand, the inverse has at most one solution.
   *
   * @param c - The rational cubic curve with monotonic x.
   * @param x - The x coordinate.
   * @returns Zero or one y values.
   * @since 2.1.0
   */
  <XT extends Monotonic, YT>(c: RationalCubicCurve2d<XT, YT>, x: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's y values at a given x. Up to three solutions —
   * `(X(t) - x·W(t))` is a cubic polynomial in `t`.
   *
   * @param c - The rational cubic curve.
   * @param x - The x coordinate.
   * @returns The y values at x, in t-ascending order.
   * @since 2.1.0
   */
  <XT, YT>(c: RationalCubicCurve2d<XT, YT>, x: number): Solution.AtMostThree<number>
  /** @since 2.1.0 */
  (x: number): {
    <XT extends Monotonic, YT>(c: RationalCubicCurve2d<XT, YT>): Solution.AtMostOne<number>
    <XT, YT>(c: RationalCubicCurve2d<XT, YT>): Solution.AtMostThree<number>
  }
} = internal.solveAtX as never

export const solveAtY: {
  /**
   * Evaluates the curve's x values at a given y. Because the curve's y axis
   * carries the `Monotonic` brand, the inverse has at most one solution.
   *
   * @param c - The rational cubic curve with monotonic y.
   * @param y - The y coordinate.
   * @returns Zero or one x values.
   * @since 2.1.0
   */
  <XT, YT extends Monotonic>(c: RationalCubicCurve2d<XT, YT>, y: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's x values at a given y. Up to three solutions.
   *
   * @param c - The rational cubic curve.
   * @param y - The y coordinate.
   * @returns The x values at y, in t-ascending order.
   * @since 2.1.0
   */
  <XT, YT>(c: RationalCubicCurve2d<XT, YT>, y: number): Solution.AtMostThree<number>
  /** @since 2.1.0 */
  (y: number): {
    <XT, YT extends Monotonic>(c: RationalCubicCurve2d<XT, YT>): Solution.AtMostOne<number>
    <XT, YT>(c: RationalCubicCurve2d<XT, YT>): Solution.AtMostThree<number>
  }
} = internal.solveAtY as never
