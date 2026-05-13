import type { Interval } from '../interval/interval'
import type { Closed } from '../interval/interval'
import type { Pipeable } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { Box2dTypeId } from './box2d.internal'
import * as internal from './box2d.internal'

/**
 * An axis-aligned 2D box — a Cartesian product of two intervals. Used as a
 * bounding box for curves and paths, and as a region for containment tests.
 *
 * The two type parameters carry the per-axis interval subtype so that a box
 * built from closed intervals stays `Box2d<Closed, Closed>` and a box with
 * mixed openness preserves that information at the type level.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 2.1.0
 */
export interface Box2d<X extends Interval = Interval, Y extends Interval = Interval>
  extends Pipeable {
  readonly [Box2dTypeId]: Box2dTypeId
  readonly x: X
  readonly y: Y
}

/**
 * Checks if a value is a `Box2d`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Box2d`, `false` otherwise.
 * @since 2.1.0
 */
export const isBox2d: (v: unknown) => v is Box2d = internal.isBox2d

/**
 * Creates a new `Box2d` from two intervals — one for the x axis, one for the
 * y axis. The returned box preserves both interval subtypes at the type level.
 *
 * @param x - The x-axis interval.
 * @param y - The y-axis interval.
 * @returns A new `Box2d` instance.
 * @since 2.1.0
 */
export const make: <X extends Interval, Y extends Interval>(x: X, y: Y) => Box2d<X, Y> =
  internal.make

/**
 * Creates a closed `Box2d` from two corner points. The corners can be in any
 * order — the axis intervals are built from the min and max of each coordinate.
 *
 * @param p0 - The first corner.
 * @param p1 - The second corner.
 * @returns A new `Box2d<Closed, Closed>` enclosing both corners.
 * @since 2.1.0
 */
export const fromCorners: (p0: Vector2, p1: Vector2) => Box2d<Closed, Closed> = internal.fromCorners

/**
 * Creates the smallest closed `Box2d` enclosing the given points. Useful for
 * computing a bounding box from a sampled curve or an arbitrary point cloud.
 *
 * @param points - One or more points to enclose.
 * @returns A new `Box2d<Closed, Closed>` enclosing all input points.
 * @throws When called with zero points.
 * @since 2.1.0
 */
export const fromVectors: (...points: ReadonlyArray<Vector2>) => Box2d<Closed, Closed> =
  internal.fromVectors

export const containsVector: {
  /**
   * Checks if a vector lies within the box. Per-axis endpoint inclusivity
   * follows each interval's `kind`.
   *
   * @param box - The box to test against.
   * @param v - The vector to test.
   * @returns `true` when the vector lies within the box on both axes.
   * @since 2.1.0
   */
  (box: Box2d, v: Vector2): boolean
  /**
   * @param v - The vector to test.
   * @returns A function that takes a box and returns the containment result.
   * @since 2.1.0
   */
  (v: Vector2): (box: Box2d) => boolean
} = internal.containsVector

export const containsBox: {
  /**
   * Checks if `inner` is a subset of `outer`. The check is per-axis interval
   * containment — for each axis, every point of the inner interval must also
   * be in the outer interval, respecting endpoint inclusivity on both sides.
   *
   * @param outer - The enclosing box.
   * @param inner - The candidate inner box.
   * @returns `true` when every point of `inner` is also in `outer`.
   * @since 2.1.0
   */
  (outer: Box2d, inner: Box2d): boolean
  /**
   * @param inner - The candidate inner box.
   * @returns A function that takes the outer box and returns the containment result.
   * @since 2.1.0
   */
  (inner: Box2d): (outer: Box2d) => boolean
} = internal.containsBox

/**
 * Returns the box's size as a vector `(width, height)`. Endpoint inclusivity
 * does not affect the size — width is always `|x.end - x.start|`.
 *
 * @param box - The box to measure.
 * @returns The size as a `Vector2`.
 * @since 2.1.0
 */
export const size: (box: Box2d) => Vector2 = internal.size

export const union: {
  /**
   * Returns the smallest closed `Box2d` enclosing both inputs.
   *
   * @param a - The first box.
   * @param b - The second box.
   * @returns A closed `Box2d` containing both.
   * @since 2.1.0
   */
  (a: Box2d, b: Box2d): Box2d<Closed, Closed>
  /**
   * @param b - The second box.
   * @returns A function that takes the first box and returns the union.
   * @since 2.1.0
   */
  (b: Box2d): (a: Box2d) => Box2d<Closed, Closed>
} = internal.union

export const equals: {
  /**
   * Checks if two boxes are approximately equal within the default absolute
   * tolerance ({@link EPSILON}). Both the numeric endpoints AND the per-axis
   * kinds must match.
   *
   * @param a - The first box.
   * @param b - The second box.
   * @returns `true` when both axis intervals are equal.
   * @since 2.1.0
   */
  (a: Box2d, b: Box2d): boolean
  /**
   * @param b - The second box.
   * @returns A function that takes the first box and returns the comparison result.
   * @since 2.1.0
   */
  (b: Box2d): (a: Box2d) => boolean
} = internal.equals
