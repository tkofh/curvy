import type { Matrix4x4 } from '../matrix/matrix4x4'
import type { CubicPath2d } from '../path/cubic2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { Bezier2d } from './bezier2d'
import { Hermite2dTypeId } from './hermite2d.internal'
import * as internal from './hermite2d.internal'

/**
 * A Hermite spline in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface Hermite2d extends Pipeable {
  readonly [Hermite2dTypeId]: Hermite2dTypeId

  [Symbol.iterator](): IterableIterator<Vector2>
}

/**
 * The characteristic matrix of a Hermite spline.
 *
 * The characteristic matrix is a 4x4 matrix that defines the shape of the spline.
 *
 * @since 1.0.0
 */
export const characteristic: Matrix4x4 = internal.characteristic

/**
 * Checks if a value is a `Hermite2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `Hermite2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isHermite2d: (p: unknown) => p is Hermite2d = internal.isHermite2d

/**
 * Creates a new `Hermite2d` instance.
 *
 * @param p0 - The first control point.
 * @param v0 - The first tangent vector.
 * @param p1 - The second control point.
 * @param v1 - The second tangent vector.
 * @returns A new `Hermite2d` instance.
 * @since 1.0.0
 */
export const make: (p0: Vector2, v0: Vector2, p1: Vector2, v1: Vector2) => Hermite2d = internal.make

/**
 * Creates a new `Hermite2d` instance from an array of control points.
 *
 * @param points - The control points.
 * @returns A new `Hermite2d` instance.
 * @since 1.0.0
 */
export const fromArray: (points: ReadonlyArray<Vector2>) => Hermite2d = internal.fromArray

export const append: {
  /**
   * Appends a new control point and tangent vector to the Hermite spline.
   *
   * @param p1 - The new control point.
   * @param v1 - The new tangent vector.
   * @returns A new `Hermite2d` instance with the appended control point and tangent vector.
   * @since 1.0.0
   */
  (p1: Vector2, v1: Vector2): (p: Hermite2d) => Hermite2d
  /**
   * Appends a new control point and tangent vector to the Hermite spline.
   *
   * @param p - The `Hermite2d` to append the control point and tangent vector to.
   * @param p1 - The new control point.
   * @param v1 - The new tangent vector.
   * @returns A new `Hermite2d` instance with the appended control point and tangent vector.
   * @since 1.0.0
   */
  (p: Hermite2d, p1: Vector2, v1: Vector2): Hermite2d
} = internal.append

export const prepend: {
  /**
   * Prepends a new control point and tangent vector to the Hermite spline.
   *
   * @param p0 - The new control point.
   * @param v0 - The new tangent vector.
   * @returns A new `Hermite2d` instance with the prepended control point and tangent vector.
   * @since 1.0.0
   */
  (p0: Vector2, v0: Vector2): (p: Hermite2d) => Hermite2d
  /**
   * Prepends a new control point and tangent vector to the Hermite spline.
   *
   * @param p - The `Hermite2d` to prepend the control point and tangent vector to.
   * @param p0 - The new control point.
   * @param v0 - The new tangent vector.
   * @returns A new `Hermite2d` instance with the prepended control point and tangent vector.
   * @since 1.0.0
   */
  (p: Hermite2d, p0: Vector2, v0: Vector2): Hermite2d
} = internal.prepend

/**
 * Creates a new `CubicPath2d` instance from a `Hermite2d`.
 *
 * @param p - The `Hermite2d` to convert.
 * @returns A new `CubicPath2d` instance.
 * @since 1.0.0
 */
export const toPath: (p: Hermite2d) => CubicPath2d = internal.toPath

/**
 * Converts a `Hermite2d` to a `Bezier2d`.
 *
 * @param p - The `Hermite2d` to convert.
 * @returns A new `Bezier2d` instance.
 * @since 1.0.0
 */
export const toBezier: (p: Hermite2d) => Bezier2d = internal.toBezier
