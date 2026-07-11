import type { Closed } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import type { Monotonicity } from '../monotonicity/monotonicity.ts'
import type { Pipeable } from '../utils.ts'
import type { CubicPolynomial } from '../polynomial/cubic.ts'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine2d } from '../transform/affine2d.ts'
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
 * `(x(t)/w(t), y(t)/w(t))`: the projection from homogeneous coordinates
 * back to the plane. With all weights equal at the source (e.g. produced
 * from a non-rational Bézier with unit weights), `w` is constant and the
 * curve coincides with a polynomial cubic.
 *
 * The two type parameters carry per-axis monotonicity trait brands attached
 * to the rational functions `x(t)/w(t)` and `y(t)/w(t)`. Unlike
 * `CubicCurve2d`, traits do not flow through to the underlying polynomials:
 * monotonicity of a ratio of cubics is not the same property as monotonicity
 * of either cubic alone, so the brand lives on the curve itself. Brands are
 * attached after construction via the `asMonotonic`, `asIncreasing`, and
 * `asDecreasing` families, which verify the property rigorously
 * (Bernstein sign convexity on the derivative-numerator quartic).
 *
 * All fields are readonly; no operation mutates a curve.
 *
 * @since 2.0.0
 */
export interface RationalCubicCurve2d<
  out XTraits = unknown,
  out YTraits = unknown,
> extends Pipeable {
  readonly [RationalCubicCurve2dTypeId]: RationalCubicCurve2dTypeId
  readonly [RationalCurveTraits]: [XTraits, YTraits]
  /**
   * The x numerator. The curve's x coordinate at `t` is `x(t) / w(t)`.
   */
  readonly x: CubicPolynomial
  /**
   * The y numerator. The curve's y coordinate at `t` is `y(t) / w(t)`.
   */
  readonly y: CubicPolynomial
  /**
   * The denominator shared by both axes. Constant when the source weights
   * are all equal, in which case the curve coincides with a polynomial
   * cubic.
   */
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

export const fromBezierPoints: {
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
  (p0: Weighted, p1: Weighted, p2: Weighted, p3: Weighted): RationalCubicCurve2d
  /**
   * Creates a new `RationalCubicCurve2d` from two interior weighted Bézier
   * handles, with endpoints pinned at `(0, 0, w=1)` and `(1, 1, w=1)`.
   *
   * Rational analog of CSS's `cubic-bezier(x1, y1, x2, y2)`: same fixed
   * endpoints, same two interior handles, plus per-handle weights for true
   * rational shapes (the polynomial case is recovered with unit weights).
   * The curve interpolates `(0, 0)` at `t = 0` and `(1, 1)` at `t = 1`.
   *
   * @param p1 - The second weighted control point (start handle).
   * @param p2 - The third weighted control point (end handle).
   * @returns A new `RationalCubicCurve2d` instance with pinned endpoints.
   * @since 2.0.0
   */
  (p1: Weighted, p2: Weighted): RationalCubicCurve2d
} = internal.fromBezierPoints

/**
 * Creates a rational cubic easing curve from endpoint slopes and signed
 * curvatures. The result interpolates `(0, 0)` and `(1, 1)` with `x(t) = t`
 * pinned linearly; the y-axis projection `y(t) = Y(t)/W(t)` uses a cubic
 * numerator over a quadratic denominator, giving six free parameters that
 * exactly match the six endpoint constraints (two values, two slopes, two
 * curvatures).
 *
 * Curvatures are the signed differential-geometric curvatures `κ = y''(x) /
 * (1 + y'(x)²)^(3/2)`: the parameterization-invariant "bend" of the easing
 * graph. Positive κ is concave-up. Smoothstep is `(0, 0, 6, -6)`; linear is
 * `(1, 1, 0, 0)` (taken as a redundant-system special case).
 *
 * Monotonicity is not enforced. Callers needing the `Increasing` brand for
 * narrowed inverse-solve returns should follow construction with
 * `asIncreasing`, which verifies monotonicity rigorously.
 *
 * @param startSlope - The easing function's slope at the start (`dy/dx` at `x = 0`).
 * @param endSlope - The easing function's slope at the end (`dy/dx` at `x = 1`).
 * @param startCurvature - The signed differential curvature at the start.
 * @param endCurvature - The signed differential curvature at the end.
 * @returns A rational cubic easing curve.
 * @throws When inputs are non-finite, the constraint system is singular, or the resulting denominator vanishes on `[0, 1]`.
 * @since 2.0.0
 */
export const fromSlopesAndCurvatures: (
  startSlope: number,
  endSlope: number,
  startCurvature: number,
  endCurvature: number,
) => RationalCubicCurve2d = internal.fromSlopesAndCurvatures

export const solve: {
  /**
   * Evaluates the rational cubic curve at parameter `t`. Returns
   * `(x(t)/w(t), y(t)/w(t))`: three Horner evaluations and two divisions.
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

/**
 * Evaluates the curve at `t = 0` in closed form:
 * `(c.x.c0 / c.w.c0, c.y.c0 / c.w.c0)`.
 *
 * @param c - The rational cubic curve.
 * @returns The point at the start of the curve's parameter domain.
 * @since 2.0.0
 */
export const startPoint: (c: RationalCubicCurve2d) => Vector2 = internal.startPoint

/**
 * Evaluates the curve at `t = 1` in closed form. Both numerator and denominator
 * Horner evaluations at `t = 1` collapse to the sum of their monomial
 * coefficients, so the projection is `(Σxᵢ / Σwᵢ, Σyᵢ / Σwᵢ)`.
 *
 * @param c - The rational cubic curve.
 * @returns The point at the end of the curve's parameter domain.
 * @since 2.0.0
 */
export const endPoint: (c: RationalCubicCurve2d) => Vector2 = internal.endPoint

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
  /**
   * Evaluates the curve's y values at a given x.
   *
   * @param x - The x coordinate.
   * @returns A function that takes a rational cubic curve and returns the y values at `x`.
   * @since 2.0.0
   */
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
  /**
   * Evaluates the curve's x values at a given y.
   *
   * @param y - The y coordinate.
   * @returns A function that takes a rational cubic curve and returns the x values at `y`.
   * @since 2.0.0
   */
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

export const boundingBox: {
  /**
   * Computes a closed axis-aligned bounding box for a rational cubic curve,
   * tight to within `tolerance` per side.
   *
   * Implemented as recursive subdivision: at each leaf the curve segment's
   * loose hull AABB (cheap, always valid) is compared against the segment's
   * endpoint AABB (which the curve provably visits). When the per-side gap
   * between them is ≤ `tolerance`, the leaf returns its hull; otherwise the
   * segment is split at `t = 0.5` and the procedure recurses, unioning the
   * halves.
   *
   * The returned box is provably within `tolerance` of the true tight box on
   * every side, and contains the curve since each leaf hull does. The
   * polynomial cubic case (uniform weights) is handled by a fast path that
   * computes the exact box from per-axis cubic extrema, with no subdivision.
   *
   * @param c - The rational cubic curve.
   * @param tolerance - Maximum allowed slack per side; must be positive.
   * @returns A closed `Interval2d` enclosing the curve, tight to within `tolerance`.
   * @since 2.0.0
   */
  (c: RationalCubicCurve2d, tolerance: number): Interval2d<Closed, Closed>
  /**
   * Computes a closed axis-aligned bounding box for a rational cubic curve.
   *
   * @param tolerance - Maximum allowed slack per side; must be positive.
   * @returns A function that takes a curve and returns its bounding box.
   * @since 2.0.0
   */
  (tolerance: number): (c: RationalCubicCurve2d) => Interval2d<Closed, Closed>
} = internal.boundingBox

/**
 * Classifies the monotonicity of the curve's `x(t) = X(t)/W(t)` projection on
 * the unit interval `[0, 1]`.
 *
 * Decided via Bernstein sign convexity on the derivative-numerator polynomial
 * `q(t) = X'·W − X·W'`. Since `W² > 0` wherever the curve is well-defined,
 * the sign of `dx/dt` equals the sign of `q`. Although `q` is a difference of
 * degree-5 products, the leading terms cancel and `q` is in fact a quartic —
 * its 5 Bernstein coefficients on `[0, 1]` are evaluated for uniform sign,
 * with de Casteljau subdivision to resolve mixed-sign cases. The procedure is
 * exact except at tangential zeros, where it conservatively reports `None`.
 *
 * Returning `Increasing` or `Decreasing` is the trigger for
 * `asMonotonic` / `asIncreasing` / `asDecreasing`.
 *
 * @param c - The rational cubic curve.
 * @returns The monotonicity of the curve's x projection on `[0, 1]`.
 * @since 2.0.0
 */
export const xMonotonicity: (c: RationalCubicCurve2d) => Monotonicity = internal.xMonotonicity

/**
 * Classifies the monotonicity of the curve's `y(t) = Y(t)/W(t)` projection on
 * the unit interval `[0, 1]`. See `xMonotonicity` for the method.
 *
 * @param c - The rational cubic curve.
 * @returns The monotonicity of the curve's y projection on `[0, 1]`.
 * @since 2.0.0
 */
export const yMonotonicity: (c: RationalCubicCurve2d) => Monotonicity = internal.yMonotonicity

/**
 * Checks if `x(t)/w(t)` is strictly monotonic on `[0, 1]`, adding
 * `Monotonic` to the x-axis trait. The y-axis trait is unchanged.
 *
 * Use this when only x-axis monotonicity is required (e.g. to make
 * `solveAtX` narrow to `AtMostOne` without also asserting y-axis
 * monotonicity).
 *
 * @param c - The rational cubic curve.
 * @returns `true` when the x projection is strictly monotonic on `[0, 1]`, narrowing the x-axis trait.
 * @since 2.0.0
 */
export const isMonotonicX: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => c is RationalCubicCurve2d<XT & Monotonic, YT> = internal.isMonotonicX

/**
 * Checks if `x(t)/w(t)` is strictly increasing on `[0, 1]`, adding
 * `Increasing` to the x-axis trait.
 *
 * @param c - The rational cubic curve.
 * @returns `true` when the x projection is strictly increasing on `[0, 1]`, narrowing the x-axis trait.
 * @since 2.0.0
 */
export const isIncreasingX: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => c is RationalCubicCurve2d<XT & Increasing, YT> = internal.isIncreasingX

/**
 * Checks if `x(t)/w(t)` is strictly decreasing on `[0, 1]`, adding
 * `Decreasing` to the x-axis trait.
 *
 * @param c - The rational cubic curve.
 * @returns `true` when the x projection is strictly decreasing on `[0, 1]`, narrowing the x-axis trait.
 * @since 2.0.0
 */
export const isDecreasingX: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => c is RationalCubicCurve2d<XT & Decreasing, YT> = internal.isDecreasingX

/**
 * Checks if `y(t)/w(t)` is strictly monotonic on `[0, 1]`, adding
 * `Monotonic` to the y-axis trait. The x-axis trait is unchanged.
 *
 * @param c - The rational cubic curve.
 * @returns `true` when the y projection is strictly monotonic on `[0, 1]`, narrowing the y-axis trait.
 * @since 2.0.0
 */
export const isMonotonicY: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => c is RationalCubicCurve2d<XT, YT & Monotonic> = internal.isMonotonicY

/**
 * Checks if `y(t)/w(t)` is strictly increasing on `[0, 1]`, adding
 * `Increasing` to the y-axis trait.
 *
 * @param c - The rational cubic curve.
 * @returns `true` when the y projection is strictly increasing on `[0, 1]`, narrowing the y-axis trait.
 * @since 2.0.0
 */
export const isIncreasingY: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => c is RationalCubicCurve2d<XT, YT & Increasing> = internal.isIncreasingY

/**
 * Checks if `y(t)/w(t)` is strictly decreasing on `[0, 1]`, adding
 * `Decreasing` to the y-axis trait.
 *
 * @param c - The rational cubic curve.
 * @returns `true` when the y projection is strictly decreasing on `[0, 1]`, narrowing the y-axis trait.
 * @since 2.0.0
 */
export const isDecreasingY: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => c is RationalCubicCurve2d<XT, YT & Decreasing> = internal.isDecreasingY

/**
 * Checks if both `x(t)/w(t)` and `y(t)/w(t)` are strictly monotonic on
 * `[0, 1]`, adding `Monotonic` to both axes' traits.
 *
 * The constant case is excluded: `Monotonic` is the *strict* brand.
 *
 * @param c - The rational cubic curve.
 * @returns `true` when both axes are strictly monotonic on `[0, 1]`, narrowing both traits.
 * @since 2.0.0
 */
export const isMonotonic: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => c is RationalCubicCurve2d<XT & Monotonic, YT & Monotonic> = internal.isMonotonic

/**
 * Checks if both `x(t)/w(t)` and `y(t)/w(t)` are strictly increasing on
 * `[0, 1]`, adding `Increasing` to both axes' traits.
 *
 * @param c - The rational cubic curve.
 * @returns `true` when both axes are strictly increasing on `[0, 1]`, narrowing both traits.
 * @since 2.0.0
 */
export const isIncreasing: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => c is RationalCubicCurve2d<XT & Increasing, YT & Increasing> = internal.isIncreasing

/**
 * Checks if both `x(t)/w(t)` and `y(t)/w(t)` are strictly decreasing on
 * `[0, 1]`, adding `Decreasing` to both axes' traits.
 *
 * @param c - The rational cubic curve.
 * @returns `true` when both axes are strictly decreasing on `[0, 1]`, narrowing both traits.
 * @since 2.0.0
 */
export const isDecreasing: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => c is RationalCubicCurve2d<XT & Decreasing, YT & Decreasing> = internal.isDecreasing

/**
 * Asserts that the curve is strictly monotonic in x on `[0, 1]`, returning
 * the same curve with the x-axis trait branded `Monotonic`.
 *
 * @param c - The rational cubic curve.
 * @returns The same curve, refined with the `Monotonic` brand on x.
 * @throws When the x projection is not strictly monotonic on `[0, 1]`.
 * @since 2.0.0
 */
export const asMonotonicX: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => RationalCubicCurve2d<XT & Monotonic, YT> = internal.asMonotonicX

/**
 * Asserts that the curve is strictly increasing in x on `[0, 1]`.
 *
 * @since 2.0.0
 */
export const asIncreasingX: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => RationalCubicCurve2d<XT & Increasing, YT> = internal.asIncreasingX

/**
 * Asserts that the curve is strictly decreasing in x on `[0, 1]`.
 *
 * @since 2.0.0
 */
export const asDecreasingX: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => RationalCubicCurve2d<XT & Decreasing, YT> = internal.asDecreasingX

/**
 * Asserts that the curve is strictly monotonic in y on `[0, 1]`. y analog of
 * `asMonotonicX`.
 *
 * @since 2.0.0
 */
export const asMonotonicY: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => RationalCubicCurve2d<XT, YT & Monotonic> = internal.asMonotonicY

/**
 * Asserts that the curve is strictly increasing in y on `[0, 1]`.
 *
 * @since 2.0.0
 */
export const asIncreasingY: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => RationalCubicCurve2d<XT, YT & Increasing> = internal.asIncreasingY

/**
 * Asserts that the curve is strictly decreasing in y on `[0, 1]`.
 *
 * @since 2.0.0
 */
export const asDecreasingY: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => RationalCubicCurve2d<XT, YT & Decreasing> = internal.asDecreasingY

/**
 * Asserts that the curve is strictly monotonic in both axes on `[0, 1]`,
 * returning the same curve with both axes branded `Monotonic`.
 *
 * @param c - The rational cubic curve.
 * @returns The same curve, refined with the `Monotonic` brand on both axes.
 * @throws When either axis is not strictly monotonic on `[0, 1]`.
 * @since 2.0.0
 */
export const asMonotonic: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => RationalCubicCurve2d<XT & Monotonic, YT & Monotonic> = internal.asMonotonic

/**
 * Asserts that the curve is strictly increasing in both axes on `[0, 1]`,
 * returning the same curve with both axes branded `Increasing`.
 *
 * @since 2.0.0
 */
export const asIncreasing: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => RationalCubicCurve2d<XT & Increasing, YT & Increasing> = internal.asIncreasing

/**
 * Asserts that the curve is strictly decreasing in both axes on `[0, 1]`,
 * returning the same curve with both axes branded `Decreasing`.
 *
 * @since 2.0.0
 */
export const asDecreasing: <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
) => RationalCubicCurve2d<XT & Decreasing, YT & Decreasing> = internal.asDecreasing

export const transform: {
  /**
   * Applies an `Affine2d` transform to a `RationalCubicCurve2d`, returning a
   * new curve whose image is the affine image of the original. The denominator
   * polynomial is preserved; each numerator pulls in a translation term
   * weighted by the denominator so the projected curve matches `A · R(s) + t`
   * pointwise.
   *
   * @param c - The rational cubic curve.
   * @param a - The affine transform.
   * @returns The transformed rational cubic curve.
   * @since 2.0.0
   */
  (c: RationalCubicCurve2d, a: Affine2d): RationalCubicCurve2d
  /**
   * Applies an `Affine2d` transform to a `RationalCubicCurve2d`.
   *
   * @param a - The affine transform.
   * @returns A function that takes a `RationalCubicCurve2d` and returns the transformed curve.
   * @since 2.0.0
   */
  (a: Affine2d): (c: RationalCubicCurve2d) => RationalCubicCurve2d
} = internal.transform

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
   * within `tolerance` of the rational: a true two-sided bound on geometric
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
