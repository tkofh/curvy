import type { Matrix4x4 } from '../matrix/matrix4x4'
import type { CubicPath2d } from '../path/cubic2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { Bezier2dTypeId } from './bezier2d.internal'
import * as internal from './bezier2d.internal'

/**
 * A Bézier curve in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface Bezier2d extends Pipeable {
  readonly [Bezier2dTypeId]: Bezier2dTypeId
  [Symbol.iterator](): IterableIterator<Vector2>
}

/**
 * Characteristic matrix of a Bézier curve.
 *
 * The characteristic matrix is a 4x4 matrix that defines the shape of the Bézier curve.
 *
 * @since 1.0.0
 */
export const characteristic: Matrix4x4 = internal.characteristic

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
 * Creates a new `Bezier2d` instance from an iterable of control points and the characteristic matrix associated with the control points.
 *
 * @param points - The control points.
 * @param matrix - The characteristic matrix.
 * @param stride - The stride of the control points.
 * @returns A new `Bezier2d` instance.
 * @since 1.0.0
 */
export const fromSpline: (
  points: Iterable<Vector2>,
  matrix: Matrix4x4,
  stride: 1 | 2 | 3,
) => Bezier2d = internal.fromSpline

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

export const appendCurvatureMirrored: {
  /**
   * Appends control points to a `Bezier2d` with mirrored curvature.
   *
   * @param a - The first curvature parameter.
   * @param b - The second curvature parameter.
   * @param p6 - The sixth control point (end point).
   * @returns A function that takes a `Bezier2d` and returns a new `Bezier2d` instance with the appended control points.
   */
  (a: number, b: number, p6: Vector2): (p: Bezier2d) => Bezier2d
  /**
   * Appends control points to a `Bezier2d` with mirrored curvature.
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
