import type { Pipeable } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { Bounds, Closed, Interval } from './interval'
import type { Interval2dTypeId } from './interval2d.internal'
import * as internal from './interval2d.internal'

/**
 * An axis-aligned 2D interval — the Cartesian product of two 1D intervals.
 * Used as a bounding box for curves and paths, and as a region for
 * containment tests.
 *
 * The two type parameters carry the per-axis interval subtype so that a value
 * built from closed intervals stays `Interval2d<Closed, Closed>` and a value
 * with mixed openness preserves that information at the type level.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 2.1.0
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
 * The structural minimum: any value with `x` and `y` fields shaped like
 * {@link Bounds}. Operations that don't read endpoint inclusivity (e.g.
 * {@link size}) accept `Bounds2d` so the signature itself documents what the
 * operation depends on. Mirrors the {@link Bounds}/{@link Interval} split in 1D.
 *
 * @since 2.1.0
 */
export interface Bounds2d {
  readonly x: Bounds
  readonly y: Bounds
}

/**
 * Checks if a value is an `Interval2d`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is an `Interval2d`, `false` otherwise.
 * @since 2.1.0
 */
export const isInterval2d: (v: unknown) => v is Interval2d = internal.isInterval2d

/**
 * Creates a new `Interval2d` from two intervals — one for the x axis, one
 * for the y axis. Preserves both interval subtypes at the type level.
 *
 * @param x - The x-axis interval.
 * @param y - The y-axis interval.
 * @returns A new `Interval2d` instance.
 * @since 2.1.0
 */
export const make: <X extends Interval, Y extends Interval>(x: X, y: Y) => Interval2d<X, Y> =
  internal.make

/**
 * Creates a closed `Interval2d` from two corner points. The corners can be in
 * any order — each axis is built from the min and max of the coordinate.
 *
 * @param p0 - The first corner.
 * @param p1 - The second corner.
 * @returns A new `Interval2d<Closed, Closed>` enclosing both corners.
 * @since 2.1.0
 */
export const fromCorners: (p0: Vector2, p1: Vector2) => Interval2d<Closed, Closed> =
  internal.fromCorners

/**
 * Creates the smallest closed `Interval2d` enclosing the given points. Useful
 * for computing a bounding box from sampled points.
 *
 * @param points - One or more points to enclose.
 * @returns A new `Interval2d<Closed, Closed>` enclosing all input points.
 * @throws When called with zero points.
 * @since 2.1.0
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
   * @since 2.1.0
   */
  (box: Interval2d, v: Vector2): boolean
  /**
   * @param v - The vector to test.
   * @returns A function that takes a 2D interval and returns the containment result.
   * @since 2.1.0
   */
  (v: Vector2): (box: Interval2d) => boolean
} = internal.containsVector

export const containsInterval2d: {
  /**
   * Checks if `inner` is a subset of `outer`. The check is per-axis interval
   * containment — for each axis, every point of the inner interval must also
   * be in the outer interval, respecting endpoint inclusivity on both sides.
   *
   * @param outer - The enclosing 2D interval.
   * @param inner - The candidate inner 2D interval.
   * @returns `true` when every point of `inner` is also in `outer`.
   * @since 2.1.0
   */
  (outer: Interval2d, inner: Interval2d): boolean
  /**
   * @param inner - The candidate inner 2D interval.
   * @returns A function that takes the outer 2D interval and returns the containment result.
   * @since 2.1.0
   */
  (inner: Interval2d): (outer: Interval2d) => boolean
} = internal.containsInterval2d

/**
 * Returns the size as a vector `(width, height)`. Accepts the broader
 * {@link Bounds2d} type because size does not depend on endpoint inclusivity.
 *
 * @param box - The 2D interval (or bounds-shaped value) to measure.
 * @returns The size as a `Vector2`.
 * @since 2.1.0
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
   * back to that kind. Otherwise the axis falls back to the open
   * {@link Interval} type since the runtime kind depends on the values.
   *
   * @param a - The first 2D interval.
   * @param b - The second 2D interval.
   * @returns A new `Interval2d` enclosing both inputs.
   * @since 2.1.0
   */
  <AX extends Interval, AY extends Interval, BX extends Interval, BY extends Interval>(
    a: Interval2d<AX, AY>,
    b: Interval2d<BX, BY>,
  ): Interval2d<
    AX extends BX ? (BX extends AX ? AX : Interval) : Interval,
    AY extends BY ? (BY extends AY ? AY : Interval) : Interval
  >
  /**
   * @param b - The second 2D interval.
   * @returns A function that takes the first 2D interval and returns the union.
   * @since 2.1.0
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
   * Checks if two `Interval2d` values are approximately equal within the
   * default absolute tolerance ({@link EPSILON}). Both the numeric endpoints
   * AND the per-axis kinds must match.
   *
   * @param a - The first 2D interval.
   * @param b - The second 2D interval.
   * @returns `true` when both axes are equal.
   * @since 2.1.0
   */
  (a: Interval2d, b: Interval2d): boolean
  /**
   * @param b - The second 2D interval.
   * @returns A function that takes the first 2D interval and returns the comparison result.
   * @since 2.1.0
   */
  (b: Interval2d): (a: Interval2d) => boolean
} = internal.equals
