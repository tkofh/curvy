import type { Matrix4x4 } from '../matrix/matrix4x4'
import type { CubicPath2d } from '../path/cubic2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { Basis2dTypeId } from './basis2d.internal'
import * as internal from './basis2d.internal'
import type { Bezier2d } from './bezier2d'

/**
 * Characteristic matrix of a Basis Spline.
 *
 * The characteristic matrix is a 4x4 matrix that defines the shape of the spline.
 *
 * @since 1.0.0
 */
export const characteristic: Matrix4x4 = internal.characteristic

/**
 * A Basis Spline in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface Basis2d extends Pipeable {
  readonly [Basis2dTypeId]: Basis2dTypeId
  [Symbol.iterator](): Iterator<Vector2>
}

/**
 * Checks if a value is a `Basis2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `Basis2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isBasis2d: (p: unknown) => p is Basis2d = internal.isBasis2d

/**
 * Creates a new `Basis2d` instance.
 *
 * @param p0 - The first control point.
 * @param p1 - The second control point.
 * @param p2 - The third control point.
 * @param p3 - The fourth control point.
 * @returns A new `Basis2d` instance.
 * @since 1.0.0
 */
export const make: (p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) => Basis2d = internal.make

/**
 * Creates a new `Basis2d` instance from an array of control points.
 *
 * @param points - The control points.
 * @returns A new `Basis2d` instance.
 * @since 1.0.0
 */
export const fromArray: (points: ReadonlyArray<Vector2>) => Basis2d = internal.fromArray

export const append: {
  /**
   * Appends control points to a `Basis2d`.
   *
   * @param points - The control points to append.
   * @returns A function that takes a `Basis2d` and returns a new `Basis2d` instance with the appended control points.
   * @since 1.0.0
   */
  (...points: ReadonlyArray<Vector2>): (p: Basis2d) => Basis2d
  /**
   * Appends control points to a `Basis2d`.
   *
   * @param p - The `Basis2d` to append the control points to.
   * @param points - The control points to append.
   * @returns A new `Basis2d` instance with the appended control points.
   * @since 1.0.0
   */
  (p: Basis2d, ...points: ReadonlyArray<Vector2>): Basis2d
} = internal.append

export const prepend: {
  /**
   * Prepends control points to a `Basis2d`.
   *
   * @param points - The control points to prepend.
   * @returns A function that takes a `Basis2d` and returns a new `Basis2d` instance with the prepended control points.
   * @since 1.0.0
   */
  (...points: ReadonlyArray<Vector2>): (p: Basis2d) => Basis2d
  /**
   * Prepends control points to a `Basis2d`.
   *
   * @param p - The `Basis2d` to prepend the control points to.
   * @param points - The control points to prepend.
   * @returns A new `Basis2d` instance with the prepended control points.
   * @since 1.0.0
   */
  (p: Basis2d, ...points: ReadonlyArray<Vector2>): Basis2d
} = internal.prepend

/**
 * Triplicates the endpoints of a `Basis2d`.
 *
 * This is useful for creating a closed loop spline.
 *
 * @param p - The `Basis2d` to triplicate the endpoints of.
 * @returns A new `Basis2d` instance with the triplicated endpoints.
 * @since 1.0.0
 */
export const withTriplicatedEndpoints: (p: Basis2d) => Basis2d = internal.withTriplicatedEndpoints

/**
 * Creates a new `Path2d` from a `Basis2d`.
 *
 * @param p - The `Basis2d` to convert to a `Path2d`.
 * @returns A new `Path2d` instance.
 * @since 1.0.0
 */
export const toPath: (p: Basis2d) => CubicPath2d = internal.toPath

/**
 * Converts a `Basis2d` to a `Bezier2d`.
 *
 * @param p - The `Basis2d` to convert.
 * @returns A new `Bezier2d` instance.
 * @since 1.0.0
 */
export const toBezier: (p: Basis2d) => Bezier2d = internal.toBezier
