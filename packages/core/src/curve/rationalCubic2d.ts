import type { Closed } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import type { Pipeable } from '../utils.ts'
import type { CubicPolynomial } from '../polynomial/cubic.ts'
import type { Increasing, Monotonic } from '../polynomial/traits.ts'
import type * as Solution from '../solution/solution.ts'
import type { Vector2, Weighted } from '../vector/vector2.ts'
import type { CubicCurve2d } from './cubic2d.ts'
import type { RationalCubicCurve2dTypeId, RationalCurveTraits } from './rationalCubic2d.internal.ts'
import * as internal from './rationalCubic2d.internal.ts'

export type { Decreasing, Increasing, Monotonic } from '../polynomial/traits.ts'
export { RationalCurveTraits } from './rationalCubic2d.internal.ts'

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
 * @since 2.0.0
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
 * @since 2.0.0
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
 * @since 2.0.0
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
 * @since 2.0.0
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
 * @since 2.0.0
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
   * @since 2.0.0
   */
  (c: RationalCubicCurve2d, t: number): Vector2
  /**
   * Evaluates the rational cubic curve at parameter `t`.
   *
   * @param t - The parameter value.
   * @returns A function that takes a curve and returns the point at `t`.
   * @since 2.0.0
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
   * @since 2.0.0
   */
  <XT extends Monotonic, YT>(c: RationalCubicCurve2d<XT, YT>, x: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's y values at a given x. Up to three solutions —
   * `(X(t) - x·W(t))` is a cubic polynomial in `t`.
   *
   * @param c - The rational cubic curve.
   * @param x - The x coordinate.
   * @returns The y values at x, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT>(c: RationalCubicCurve2d<XT, YT>, x: number): Solution.AtMostThree<number>
  /** @since 2.0.0 */
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
   * @since 2.0.0
   */
  <XT, YT extends Monotonic>(c: RationalCubicCurve2d<XT, YT>, y: number): Solution.AtMostOne<number>
  /**
   * Evaluates the curve's x values at a given y. Up to three solutions.
   *
   * @param c - The rational cubic curve.
   * @param y - The y coordinate.
   * @returns The x values at y, in t-ascending order.
   * @since 2.0.0
   */
  <XT, YT>(c: RationalCubicCurve2d<XT, YT>, y: number): Solution.AtMostThree<number>
  /** @since 2.0.0 */
  (y: number): {
    <XT, YT extends Monotonic>(c: RationalCubicCurve2d<XT, YT>): Solution.AtMostOne<number>
    <XT, YT>(c: RationalCubicCurve2d<XT, YT>): Solution.AtMostThree<number>
  }
} = internal.solveAtY as never

export const subdivide: {
  /**
   * Subdivides a rational cubic curve at parameter `t ∈ (0, 1)` into two new
   * rational cubic curves. The first curve's evaluation on `[0, 1]` matches
   * the original's on `[0, t]`; the second matches the original's on `[t, 1]`.
   * Equivalent to de Casteljau subdivision on the homogeneous control polygon,
   * but performed directly on the per-axis monomial polynomials.
   *
   * @param c - The rational cubic curve to subdivide.
   * @param t - The split parameter; must be in the open interval `(0, 1)`.
   * @returns A `[left, right]` tuple of rational cubic curves.
   * @since 2.0.0
   */
  (c: RationalCubicCurve2d, t: number): [RationalCubicCurve2d, RationalCubicCurve2d]
  /**
   * Subdivides a rational cubic curve at parameter `t ∈ (0, 1)`.
   *
   * @param t - The split parameter; must be in the open interval `(0, 1)`.
   * @returns A function that takes a curve and returns its `[left, right]` halves.
   * @since 2.0.0
   */
  (t: number): (c: RationalCubicCurve2d) => [RationalCubicCurve2d, RationalCubicCurve2d]
} = internal.subdivide

/**
 * Computes a closed axis-aligned bounding box for a rational cubic curve from
 * its projected control polygon. Looser than the tight extrema-based box used
 * by `CubicCurve2d.boundingBox` — finding tight extrema of `x(t)/w(t)` and
 * `y(t)/w(t)` requires solving degree-5 polynomials — but always valid: a
 * positive-weight rational Bézier curve lies inside the convex hull of its
 * projected control points, so the AABB of those points contains the curve.
 *
 * Suitable for subdivision-based geometric queries, where bound looseness is
 * compensated by recursion depth.
 *
 * @param c - The rational cubic curve.
 * @returns A closed `Interval2d` enclosing the curve.
 * @since 2.0.0
 */
export const boundingBox: (c: RationalCubicCurve2d) => Interval2d<Closed, Closed> =
  internal.boundingBox

export const approximateAsCubicCurves: {
  /**
   * Approximates the rational cubic as a sequence of polynomial cubic curves
   * via recursive subdivision. At each level a candidate polynomial cubic is
   * built by projecting the segment's homogeneous Bézier control points to
   * 2D; if the symmetric Hausdorff distance between the rational segment and
   * its candidate exceeds `tolerance` (verified via a certified subdivision
   * bound, not a single-point sample), the segment is split at `t = 0.5` and
   * the procedure recurses on each half. Returns a non-empty array; for a
   * curve that is already polynomial (uniform weights) the result is a
   * single exact segment.
   *
   * The Hausdorff guarantee means: every point on the rational lies within
   * `tolerance` of some output segment, and every point on the output lies
   * within `tolerance` of the rational — a true two-sided bound on geometric
   * deviation, not just a parametric error at one sample.
   *
   * @param c - The rational cubic curve to approximate.
   * @param tolerance - Maximum allowed Hausdorff distance; must be positive.
   * @returns A sequence of polynomial cubic curves covering the input.
   * @since 2.0.0
   */
  (c: RationalCubicCurve2d, tolerance: number): ReadonlyArray<CubicCurve2d>
  /**
   * Approximates the rational cubic as a sequence of polynomial cubic curves.
   *
   * @param tolerance - Maximum allowed Hausdorff distance; must be positive.
   * @returns A function that takes a curve and returns its polynomial approximation.
   * @since 2.0.0
   */
  (tolerance: number): (c: RationalCubicCurve2d) => ReadonlyArray<CubicCurve2d>
} = internal.approximateAsCubicCurves
