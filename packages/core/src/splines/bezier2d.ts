import type { CubicPath2d } from '../path/cubic2d'
import type { Pipeable } from '../utils'
import type * as Solution from '../solution/solution'
import type { Vector2 } from '../vector/vector2'
import type { Bezier2dTypeId } from './bezier2d.internal'
import * as internal from './bezier2d.internal'
import type { RationalBezier2d } from './rationalBezier2d'

/**
 * A Bézier curve in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The characteristic matrix that identifies this spline family lives in the
 * `characteristic` module as `Characteristic.cubicBezier`.
 *
 * @since 1.0.0
 */
export interface Bezier2d extends Pipeable {
  readonly [Bezier2dTypeId]: Bezier2dTypeId
  [Symbol.iterator](): IterableIterator<Vector2>
}

/**
 * Creates a new `Bezier2d` instance.
 *
 * @param p0 - The first control point.
 * @param p1 - The second control point.
 * @param p2 - The third control point.
 * @param p3 - The fourth control point.
 * @returns A new `Bezier2d` instance.
 * @since 1.0.0
 */
export const make: (p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) => Bezier2d = internal.make

/**
 * Creates a new `Bezier2d` instance from an array of control points.
 *
 * @param points - The control points.
 * @returns A new `Bezier2d` instance.
 * @since 1.0.0
 */
export const fromArray: (points: ReadonlyArray<Vector2>) => Bezier2d = internal.fromArray

/**
 * Creates a new `Bezier2d` from an array of `[x, y]` tuples. Convenient for
 * data sourced from JSON, CSV, or other tuple-shaped formats.
 *
 * @param tuples - The control points as `[x, y]` tuples.
 * @returns A new `Bezier2d` instance.
 * @since 2.0.0
 */
export const fromTuples: (tuples: ReadonlyArray<readonly [number, number]>) => Bezier2d =
  internal.fromTuples

/**
 * Checks if a value is a `Bezier2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `Bezier2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isCubicBezier2d: (p: unknown) => p is Bezier2d = internal.isCubicBezier2d

export const append: {
  /**
   * Appends control points to a `Bezier2d`.
   *
   * @param p1 - The second control point (first tangent).
   * @param p2 - The third control point (second tangent).
   * @param p3 - The fourth control point (end point).
   * @returns A function that takes a `Bezier2d` and returns a new `Bezier2d` instance with the appended control points.
   */
  (p1: Vector2, p2: Vector2, p3: Vector2): (p: Bezier2d) => Bezier2d
  /**
   * Appends control points to a `Bezier2d`.
   *
   * @param p - The `Bezier2d` to append the control points to.
   * @param p1 - The second control point (first tangent).
   * @param p2 - The third control point (second tangent).
   * @param p3 - The fourth control point (end point).
   * @returns A new `Bezier2d` instance with the appended control points.
   */
  (p: Bezier2d, p1: Vector2, p2: Vector2, p3: Vector2): Bezier2d
} = internal.append

export const appendTangentAligned: {
  /**
   * Appends control points to a `Bezier2d` with aligned tangents.
   *
   * @param ratio - The ratio of the tangents.
   * @param p2 - The third control point (second tangent).
   * @param p3 - The fourth control point (end point).
   * @returns A function that takes a `Bezier2d` and returns a new `Bezier2d` instance with the appended control points.
   */
  (ratio: number, p2: Vector2, p3: Vector2): (p: Bezier2d) => Bezier2d
  /**
   * Appends control points to a `Bezier2d` with aligned tangents.
   *
   * @param p - The `Bezier2d` to append the control points to.
   * @param ratio - The ratio of the tangents.
   * @param p2 - The third control point (second tangent).
   * @param p3 - The fourth control point (end point).
   * @returns A new `Bezier2d` instance with the appended control points.
   */
  (p: Bezier2d, ratio: number, p2: Vector2, p3: Vector2): Bezier2d
} = internal.appendTangentAligned

export const appendCurvatureAligned: {
  /**
   * Appends control points to a `Bezier2d` with aligned curvature (G² continuity).
   *
   * @param a - The first curvature parameter.
   * @param b - The second curvature parameter.
   * @param p6 - The sixth control point (end point).
   * @returns A function that takes a `Bezier2d` and returns a new `Bezier2d` instance with the appended control points.
   */
  (a: number, b: number, p6: Vector2): (p: Bezier2d) => Bezier2d
  /**
   * Appends control points to a `Bezier2d` with aligned curvature (G² continuity).
   *
   * @param p - The `Bezier2d` to append the control points to.
   * @param a - The first curvature parameter.
   * @param b - The second curvature parameter.
   * @param p6 - The sixth control point (end point).
   * @returns A new `Bezier2d` instance with the appended control points.
   */
  (p: Bezier2d, a: number, b: number, p6: Vector2): Bezier2d
} = internal.appendCurvatureAligned

export const appendVelocityAligned: {
  /**
   * Appends control points to a `Bezier2d` with aligned velocity.
   *
   * @param p2 - The second control point (first tangent).
   * @param p3 - The third control point (second tangent).
   * @returns A function that takes a `Bezier2d` and returns a new `Bezier2d` instance with the appended control points.
   */
  (p2: Vector2, p3: Vector2): (p: Bezier2d) => Bezier2d
  /**
   * Appends control points to a `Bezier2d` with aligned velocity.
   *
   * @param p - The `Bezier2d` to append the control points to.
   * @param p2 - The second control point (first tangent).
   * @param p3 - The third control point (second tangent).
   * @returns A new `Bezier2d` instance with the appended control points.
   */
  (p: Bezier2d, p2: Vector2, p3: Vector2): Bezier2d
} = internal.appendVelocityAligned

export const appendAccelerationAligned: {
  /**
   * Appends control points to a `Bezier2d` with aligned acceleration.
   *
   * @param p3 - The third control point (second tangent).
   * @returns A function that takes a `Bezier2d` and returns a new `Bezier2d` instance with the appended control points.
   */
  (p3: Vector2): (p: Bezier2d) => Bezier2d
  /**
   * Appends control points to a `Bezier2d` with aligned acceleration.
   *
   * @param p - The `Bezier2d` to append the control points to.
   * @param p3 - The third control point (second tangent).
   * @returns A new `Bezier2d` instance with the appended control points.
   */
  (p: Bezier2d, p3: Vector2): Bezier2d
} = internal.appendAccelerationAligned

/**
 * Converts a `Bezier2d` to a `CubicPath2d`.
 *
 * @param p - The `Bezier2d` to convert.
 * @returns A new `CubicPath2d` instance representing the same curve as the `Bezier2d`.
 * @since 1.0.0
 */
export const toPath: (p: Bezier2d) => CubicPath2d = internal.toPath

/**
 * Attempts to lower a `RationalBezier2d` to a non-rational `Bezier2d`.
 *
 * Succeeds with `Solution.one(bezier)` when the rational curve's weights are
 * uniform (the curve is mathematically a polynomial Bézier) and returns
 * `Solution.none` otherwise — the rational curve cannot be represented
 * exactly by a non-rational cubic Bézier.
 *
 * @param r - The rational bezier to convert.
 * @returns Either a `Bezier2d` instance or `Solution.none`.
 * @since 2.0.0
 */
export const fromRational: (r: RationalBezier2d) => Solution.AtMostOne<Bezier2d> =
  internal.fromRational

export const subdivide: {
  /**
   * Splits a `Bezier2d` at the given global parameter `u ∈ (0, 1)` using
   * de Casteljau's algorithm. The two returned beziers together trace the
   * same curve as the input — the left covers `[0, u]`, the right covers
   * `[u, 1]`.
   *
   * @param b - The bezier to split.
   * @param u - The split parameter in the open interval `(0, 1)`.
   * @returns A two-element tuple of the left and right halves.
   * @since 1.1.0
   */
  (b: Bezier2d, u: number): [Bezier2d, Bezier2d]
  /**
   * Splits a `Bezier2d` at the given global parameter `u ∈ (0, 1)`.
   *
   * @param u - The split parameter in the open interval `(0, 1)`.
   * @returns A function that takes a bezier and returns the two halves.
   * @since 1.1.0
   */
  (u: number): (b: Bezier2d) => [Bezier2d, Bezier2d]
} = internal.subdivide
