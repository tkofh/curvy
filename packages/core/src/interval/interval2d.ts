import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Bounds, Closed, Interval } from './interval.ts'
import type { Interval2dTypeId } from './interval2d.internal.ts'
import * as internal from './interval2d.internal.ts'

/**
 * An axis-aligned 2D interval, the Cartesian product of two 1D intervals.
 * Used as a bounding box for curves and paths, and as a region for
 * containment tests. Construct via `make`, `fromCorners`, or
 * `fromVectors`.
 *
 * The two type parameters carry the per-axis interval subtype so that a value
 * built from closed intervals stays `Interval2d<Closed, Closed>` and a value
 * with mixed openness preserves that information at the type level.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 2.0.0
 */
export interface Interval2d<
  X extends Interval = Interval,
  Y extends Interval = Interval,
> extends Pipeable {
  readonly [Interval2dTypeId]: Interval2dTypeId
  readonly x: X
  readonly y: Y
}

/**
 * A pair of per-axis `Bounds` carrying no endpoint-inclusivity
 * information, the structural counterpart of `Interval2d`. Any value with
 * `Bounds`-shaped `x` and `y` fields satisfies it.
 *
 * Operations that never read inclusivity (`size`, `minDistance`,
 * `maxDistance`) accept `Bounds2d`.
 *
 * @since 2.0.0
 */
export interface Bounds2d {
  readonly x: Bounds
  readonly y: Bounds
}

/**
 * Checks if a value is an `Interval2d`.
 *
 * True only for values built by this module's constructors, which carry
 * the brand. A structural pair of bounds is `Bounds2d`, not an
 * `Interval2d`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is an `Interval2d`, `false` otherwise.
 * @since 2.0.0
 */
export const isInterval2d: (v: unknown) => v is Interval2d = internal.isInterval2d

/**
 * Creates a new `Interval2d` from two intervals: one for the x axis, one
 * for the y axis. Preserves both interval subtypes at the type level.
 *
 * @param x - The x-axis interval.
 * @param y - The y-axis interval.
 * @returns A new `Interval2d` instance.
 * @since 2.0.0
 */
export const make: <X extends Interval, Y extends Interval>(x: X, y: Y) => Interval2d<X, Y> =
  internal.make

/**
 * Creates a closed `Interval2d` from two corner points. The corners can be
 * in any order. Each axis is built from the min and max of the coordinate.
 *
 * @param p0 - The first corner.
 * @param p1 - The second corner.
 * @returns A new `Interval2d<Closed, Closed>` enclosing both corners.
 * @since 2.0.0
 */
export const fromCorners: (p0: Vector2, p1: Vector2) => Interval2d<Closed, Closed> =
  internal.fromCorners

/**
 * Creates the smallest closed `Interval2d` enclosing the given points. Useful
 * for computing a bounding box from sampled points.
 *
 * @param points - One or more points to enclose.
 * @returns A new `Interval2d<Closed, Closed>` enclosing all input points.
 * @throws `Error` when called with no points.
 * @since 2.0.0
 */
export const fromVectors: (...points: ReadonlyArray<Vector2>) => Interval2d<Closed, Closed> =
  internal.fromVectors

export const containsVector: {
  /**
   * Checks if a vector lies within the 2D interval. Per-axis endpoint
   * inclusivity follows each axis interval's `kind`.
   *
   * @param box - The 2D interval to test against.
   * @param v - The vector to test.
   * @returns `true` when the vector lies within the box on both axes.
   * @since 2.0.0
   */
  (box: Interval2d, v: Vector2): boolean
  /**
   * Checks if a vector lies within a 2D interval.
   *
   * @param v - The vector to test.
   * @returns A function that takes a 2D interval and returns the containment result.
   * @since 2.0.0
   */
  (v: Vector2): (box: Interval2d) => boolean
} = internal.containsVector

export const containsInterval2d: {
  /**
   * Checks if `inner` is a subset of `outer`. The check is per-axis
   * interval containment. For each axis, every point of the inner interval
   * must also be in the outer interval, respecting endpoint inclusivity on
   * both sides. Endpoint comparisons are exact — no tolerance is applied.
   *
   * @param outer - The enclosing 2D interval.
   * @param inner - The candidate inner 2D interval.
   * @returns `true` when every point of `inner` is also in `outer`.
   * @since 2.0.0
   */
  (outer: Interval2d, inner: Interval2d): boolean
  /**
   * Checks if the given 2D interval is a subset of another.
   *
   * @param inner - The candidate inner 2D interval.
   * @returns A function that takes the outer 2D interval and returns the containment result.
   * @since 2.0.0
   */
  (inner: Interval2d): (outer: Interval2d) => boolean
} = internal.containsInterval2d

/**
 * Returns the size as a vector `(width, height)`. Accepts the broader
 * `Bounds2d` type because size does not depend on endpoint inclusivity.
 *
 * @param box - The 2D interval (or bounds-shaped value) to measure.
 * @returns The per-axis absolute sizes as a `Vector2`. Never negative, even for reversed structural bounds.
 * @since 2.0.0
 */
export const size: (box: Bounds2d) => Vector2 = internal.size

export const union: {
  /**
   * Returns the smallest 2D interval enclosing both inputs.
   *
   * The per-axis return kind is determined by which input's endpoint wins on
   * each side, with the contributor's openness preserved (or unioned to
   * "closed" when endpoints are numerically equal and either is closed at
   * that point).
   *
   * When both inputs share the same kind on an axis, the result collapses
   * back to that kind. Otherwise the axis falls back to the broader
   * `Interval` type since the runtime kind depends on the values.
   *
   * @param a - The first 2D interval.
   * @param b - The second 2D interval.
   * @returns A new `Interval2d` enclosing both inputs.
   * @since 2.0.0
   */
  <AX extends Interval, AY extends Interval, BX extends Interval, BY extends Interval>(
    a: Interval2d<AX, AY>,
    b: Interval2d<BX, BY>,
  ): Interval2d<
    AX extends BX ? (BX extends AX ? AX : Interval) : Interval,
    AY extends BY ? (BY extends AY ? AY : Interval) : Interval
  >
  /**
   * Returns the smallest 2D interval enclosing both inputs.
   *
   * @param b - The second 2D interval.
   * @returns A function that takes the first 2D interval and returns the union.
   * @since 2.0.0
   */
  <BX extends Interval, BY extends Interval>(
    b: Interval2d<BX, BY>,
  ): <AX extends Interval, AY extends Interval>(
    a: Interval2d<AX, AY>,
  ) => Interval2d<
    AX extends BX ? (BX extends AX ? AX : Interval) : Interval,
    AY extends BY ? (BY extends AY ? AY : Interval) : Interval
  >
} = internal.union

export const equals: {
  /**
   * Checks if two `Interval2d` values are approximately equal. Both the
   * numeric endpoints and the per-axis kinds must match.
   *
   * Endpoints are compared per axis with `coincident` from `curvy/number`,
   * an absolute-plus-relative tolerance band. See `PRECISION.md` for the
   * mechanics.
   *
   * @param a - The first 2D interval.
   * @param b - The second 2D interval.
   * @returns `true` when both axes are equal.
   * @since 2.0.0
   */
  (a: Interval2d, b: Interval2d): boolean
  /**
   * Checks if two `Interval2d` values are approximately equal.
   *
   * @param b - The second 2D interval.
   * @returns A function that takes the first 2D interval and returns the comparison result.
   * @since 2.0.0
   */
  (b: Interval2d): (a: Interval2d) => boolean
} = internal.equals

export const minDistance: {
  /**
   * Computes the Euclidean distance between the two closest points of two
   * axis-aligned 2D intervals. Returns `0` when the boxes overlap
   * (including edge or corner touching).
   *
   * Accepts the broader `Bounds2d` type. Endpoint inclusivity is not
   * consulted, so a "touching" pair of open intervals still returns `0`
   * because the closest *points* coincide geometrically. Reversed
   * structural bounds are normalized with min/max.
   *
   * @param a - The first 2D interval.
   * @param b - The second 2D interval.
   * @returns The minimum Euclidean distance between any point of `a` and any point of `b`.
   * @since 2.0.0
   */
  (a: Bounds2d, b: Bounds2d): number
  /**
   * Computes the Euclidean distance between the two closest points of two
   * axis-aligned 2D intervals.
   *
   * @param b - The second 2D interval.
   * @returns A function that takes the first 2D interval and returns the minimum distance.
   * @since 2.0.0
   */
  (b: Bounds2d): (a: Bounds2d) => number
} = internal.minDistance

export const maxDistance: {
  /**
   * Computes the diagonal of the union AABB enclosing both inputs, which is an
   * upper bound on the Euclidean distance between any point of `a` and any
   * point of `b`.
   *
   * The bound is the exact farthest-pair distance unless, on some axis,
   * one interval's endpoints lie strictly inside the other's. There the
   * union span exceeds the farthest-pair separation. Accepts the broader
   * `Bounds2d` type. Endpoint inclusivity is not consulted, and reversed
   * structural bounds are normalized with min/max.
   *
   * @param a - The first 2D interval.
   * @param b - The second 2D interval.
   * @returns The union-AABB diagonal, at least the distance between any point of `a` and any point of `b`.
   * @since 2.0.0
   */
  (a: Bounds2d, b: Bounds2d): number
  /**
   * Computes the diagonal of the union AABB enclosing both inputs, which is an
   * upper bound on the distance between any point of `a` and any point of
   * `b`.
   *
   * @param b - The second 2D interval.
   * @returns A function that takes the first 2D interval and returns the union-AABB diagonal.
   * @since 2.0.0
   */
  (b: Bounds2d): (a: Bounds2d) => number
} = internal.maxDistance
