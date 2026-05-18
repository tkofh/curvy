import type { RationalCubicPath2d } from '../path/rationalCubic2d.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2, Weighted } from '../vector/vector2.ts'
import type { Bezier2d } from './bezier2d.ts'
import type { RationalBezier2dTypeId } from './rationalBezier2d.internal.ts'
import * as internal from './rationalBezier2d.internal.ts'

/**
 * A piecewise rational cubic Bézier curve in 2D space.
 *
 * Each control point is a `Vector2.Weighted` carrying a positive scalar
 * weight; the curve evaluates to `Σ w_i · N_i(t) · P_i / Σ w_i · N_i(t)`,
 * where `N_i` are the cubic Bernstein basis functions. With all weights
 * equal, the curve coincides with a non-rational `Bezier2d`. With unequal
 * weights, the curve can exactly represent conic sections — circles,
 * ellipses, parabolas, and hyperbolas — that polynomial Béziers can only
 * approximate.
 *
 * Internally each control point is stored in homogeneous form `(w·x, w·y, w)`,
 * so de Casteljau evaluation is three independent linear interpolations
 * followed by a single division. Iteration projects back to `Vector2.Weighted`
 * — the same shape accepted by {@link make}.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 2.0.0
 */
export interface RationalBezier2d extends Pipeable {
  readonly [RationalBezier2dTypeId]: RationalBezier2dTypeId
  [Symbol.iterator](): IterableIterator<Weighted>
}

/**
 * Checks if a value is a `RationalBezier2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `RationalBezier2d`, `false` otherwise.
 * @since 2.0.0
 */
export const isRationalBezier2d: (p: unknown) => p is RationalBezier2d = internal.isRationalBezier2d

/**
 * Creates a new single-segment `RationalBezier2d` from four weighted control points.
 *
 * Equal weights produce a curve coincident with the corresponding polynomial
 * cubic Bézier; unequal weights produce a true rational curve capable of
 * representing conics exactly.
 *
 * @param p0 - The first weighted control point (curve start).
 * @param p1 - The second weighted control point (start handle).
 * @param p2 - The third weighted control point (end handle).
 * @param p3 - The fourth weighted control point (curve end).
 * @returns A new `RationalBezier2d` instance.
 * @since 2.0.0
 */
export const make: (p0: Weighted, p1: Weighted, p2: Weighted, p3: Weighted) => RationalBezier2d =
  internal.make

/**
 * Creates a new `RationalBezier2d` from an array of weighted control points.
 *
 * The array must contain `(n * 3) + 1` entries to describe `n` joined cubic
 * segments.
 *
 * @param points - The weighted control points.
 * @returns A new `RationalBezier2d` instance.
 * @since 2.0.0
 */
export const fromArray: (points: ReadonlyArray<Weighted>) => RationalBezier2d = internal.fromArray

/**
 * Creates a new `RationalBezier2d` from an array of `[x, y, weight]` tuples.
 * Weight is the projective denominator at each control point — `1` everywhere
 * yields the polynomial Bézier; varying weights bend the curve toward the
 * heavier control points.
 *
 * @param tuples - The weighted control points as `[x, y, weight]` tuples.
 * @returns A new `RationalBezier2d` instance.
 * @since 2.0.0
 */
export const fromTuples: (
  tuples: ReadonlyArray<readonly [number, number, number]>,
) => RationalBezier2d = internal.fromTuples

/**
 * Creates a new single-segment `RationalBezier2d` from four points with all
 * weights equal to one.
 *
 * Convenience constructor for callers who want the rational evaluator but
 * don't yet have non-unit weights — the resulting curve is mathematically
 * equivalent to the corresponding `Bezier2d.make(p0, p1, p2, p3)` and can
 * later be subdivided or recombined using the rational machinery without
 * conversion overhead.
 *
 * @param p0 - The first control point (curve start).
 * @param p1 - The second control point (start handle).
 * @param p2 - The third control point (end handle).
 * @param p3 - The fourth control point (curve end).
 * @returns A new `RationalBezier2d` with unit weights.
 * @since 2.0.0
 */
export const fromPoints: (p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) => RationalBezier2d =
  internal.fromPoints

/**
 * Lifts a non-rational `Bezier2d` into a `RationalBezier2d` by assigning
 * unit weight to every control point. The two curves trace the same path.
 *
 * @param b - The non-rational bezier to lift.
 * @returns A new `RationalBezier2d` with unit weights.
 * @since 2.0.0
 */
export const fromBezier: (b: Bezier2d) => RationalBezier2d = internal.fromBezier

/**
 * Converts a `RationalBezier2d` to a `RationalCubicPath2d`.
 *
 * Each segment's four homogeneous control points are expanded into three
 * per-segment monomial cubic polynomials — `x`, `y`, and the shared
 * denominator `w` — yielding a path whose evaluator is three Horner passes
 * plus two divisions per call.
 *
 * Mirrors `Bezier2d.toPath`: spline construction is converted to path
 * evaluation form, and forward evaluation thereafter routes through the
 * path's `solve`.
 *
 * @param r - The rational bezier to convert.
 * @returns A new `RationalCubicPath2d` instance representing the same curve.
 * @since 2.0.0
 */
export const toPath: (r: RationalBezier2d) => RationalCubicPath2d = internal.toPath

export const mapPoints: {
  /**
   * Applies a per-point transform to every weighted control point in a
   * `RationalBezier2d`, preserving point count.
   *
   * The transform sees each control point as a `Vector2.Weighted` —
   * matching the type's storage form. To lift a position-only function into
   * a weighted mapper while preserving weights, use
   * {@link Vector2.liftWithWeight}.
   *
   * @param f - The weighted-point transform.
   * @returns A function that takes a `RationalBezier2d` and returns the mapped spline.
   * @since 2.0.0
   */
  (f: (p: Weighted) => Weighted): (s: RationalBezier2d) => RationalBezier2d
  /**
   * Applies a per-point transform to every weighted control point in a
   * `RationalBezier2d`.
   *
   * @param s - The rational bezier.
   * @param f - The weighted-point transform.
   * @returns A new `RationalBezier2d` with the transform applied to each point.
   * @since 2.0.0
   */
  (s: RationalBezier2d, f: (p: Weighted) => Weighted): RationalBezier2d
} = internal.mapPoints

export const flatMap: {
  /**
   * Hands the bezier's full weighted control-point array to `f` and uses its
   * returned `RationalBezier2d` as the result. The returned bezier goes
   * through this module's builders, so the `3n + 1` point-count invariant is
   * enforced at construction.
   *
   * @param f - The bulk transform.
   * @returns A function that takes a `RationalBezier2d` and returns the rebuilt spline.
   * @since 2.0.0
   */
  (
    f: (points: ReadonlyArray<Weighted>) => RationalBezier2d,
  ): (s: RationalBezier2d) => RationalBezier2d
  /**
   * Hands the bezier's full weighted control-point array to `f` and uses its
   * returned `RationalBezier2d` as the result.
   *
   * @param s - The rational bezier.
   * @param f - The bulk transform.
   * @returns The `RationalBezier2d` returned by `f`.
   * @since 2.0.0
   */
  (s: RationalBezier2d, f: (points: ReadonlyArray<Weighted>) => RationalBezier2d): RationalBezier2d
} = internal.flatMap

export const subdivide: {
  /**
   * Splits a `RationalBezier2d` at the given global parameter `u ∈ (0, 1)`
   * using de Casteljau's algorithm in homogeneous coordinates. The two
   * returned beziers together trace the same curve as the input — the left
   * covers `[0, u]`, the right covers `[u, 1]`.
   *
   * The subdivided halves' control-point weights generally differ from the
   * original's even at unit input weights; this is expected and preserves
   * the curve shape exactly.
   *
   * @param r - The rational bezier to split.
   * @param u - The split parameter in the open interval `(0, 1)`.
   * @returns A two-element tuple of the left and right halves.
   * @since 2.0.0
   */
  (r: RationalBezier2d, u: number): [RationalBezier2d, RationalBezier2d]
  /**
   * Splits a `RationalBezier2d` at the given global parameter `u ∈ (0, 1)`.
   *
   * @param u - The split parameter in the open interval `(0, 1)`.
   * @returns A function that takes a rational bezier and returns the halves.
   * @since 2.0.0
   */
  (u: number): (r: RationalBezier2d) => [RationalBezier2d, RationalBezier2d]
} = internal.subdivide
