import type { Matrix4x4 } from '../matrix/matrix4x4'
import type { CubicPath2d } from '../path/cubic2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { Bezier2d } from './bezier2d'
import type { Cardinal2dTypeId } from './cardinal2d.internal'
import * as internal from './cardinal2d.internal'

/**
 * A Cardinal spline in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface Cardinal2d extends Pipeable {
  readonly [Cardinal2dTypeId]: Cardinal2dTypeId
  [Symbol.iterator](): IterableIterator<Vector2>
}

/**
 * The characteristic matrix of a Cardinal spline.
 *
 * The characteristic matrix is a 4x4 matrix that defines the shape of the spline.
 *
 * @param scale - The tension of the spline.
 * @returns The characteristic matrix.
 * @since 1.0.0
 */
export const characteristic: (scale: number) => Matrix4x4 = internal.characteristic

/**
 * The characteristic matrix of a Catmull-Rom spline.
 *
 * The characteristic matrix is a 4x4 matrix that defines the shape of the spline.
 *
 * @since 1.0.0
 */
export const catRomCharacteristic: Matrix4x4 = internal.catRomCharacteristic

/**
 * Checks if a value is a `Cardinal2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `Cardinal2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isCardinal2d: (p: unknown) => p is Cardinal2d = internal.isCardinal2d

/**
 * Creates a new `Cardinal2d` instance.
 *
 * @param p0 - The first control point.
 * @param p1 - The second control point.
 * @param points - The remaining control points.
 * @returns A new `Cardinal2d` instance.
 * @since 1.0.0
 */
export const make: (p0: Vector2, p1: Vector2, ...points: ReadonlyArray<Vector2>) => Cardinal2d =
  internal.make

/**
 * Creates a new `Cardinal2d` instance from an array of control points.
 *
 * @param points - The control points.
 * @returns A new `Cardinal2d` instance.
 * @since 1.0.0
 */
export const fromArray: (points: ReadonlyArray<Vector2>) => Cardinal2d = internal.fromArray

export const append: {
  /**
   * Appends control points to a `Cardinal2d`.
   *
   * @param points - The control points to append.
   * @returns A function that takes a `Cardinal2d` and returns a new `Cardinal2d` instance with the appended control points.
   * @since 1.0.0
   */
  (...points: ReadonlyArray<Vector2>): (c: Cardinal2d) => Cardinal2d
  /**
   * Appends control points to a `Cardinal2d`.
   *
   * @param c - The `Cardinal2d` to append the control points to.
   * @param points - The control points to append.
   * @returns A new `Cardinal2d` instance with the appended control points.
   * @since 1.0.0
   */
  (c: Cardinal2d, ...points: ReadonlyArray<Vector2>): Cardinal2d
} = internal.append

export const prepend: {
  /**
   * Prepends control points to a `Cardinal2d`.
   *
   * @param points - The control points to prepend.
   * @returns A function that takes a `Cardinal2d` and returns a new `Cardinal2d` instance with the prepended control points.
   * @since 1.0.0
   */
  (...points: ReadonlyArray<Vector2>): (c: Cardinal2d) => Cardinal2d
  /**
   * Prepends control points to a `Cardinal2d`.
   *
   * @param c - The `Cardinal2d` to prepend the control points to.
   * @param points - The control points to prepend.
   * @returns A new `Cardinal2d` instance with the prepended control points.
   * @since 1.0.0
   */
  (c: Cardinal2d, ...points: ReadonlyArray<Vector2>): Cardinal2d
} = internal.prepend

/**
 * Doubles the endpoints of a `Cardinal2d` spline.
 *
 * @param c - The `Cardinal2d` to duplicate the endpoints of.
 * @returns A new `Cardinal2d` instance with the duplicated endpoints.
 * @since 1.0.0
 */
export const withDuplicatedEndpoints: (c: Cardinal2d) => Cardinal2d =
  internal.withDuplicatedEndpoints

export const withReflectedEndpoints: {
  /**
   * Reflects the endpoints of a `Cardinal2d` spline.
   *
   * @param scale - The scale factor for the reflection.
   * @returns A function that takes a `Cardinal2d` and returns a new `Cardinal2d` instance with the reflected endpoints.
   * @since 1.0.0
   */
  (scale: number): (c: Cardinal2d) => Cardinal2d
  /**
   * Reflects the endpoints of a `Cardinal2d` spline.
   *
   * @param c - The `Cardinal2d` to reflect the endpoints of.
   * @param scale - The scale factor for the reflection.
   * @returns A new `Cardinal2d` instance with the reflected endpoints.
   * @since 1.0.0
   */
  (c: Cardinal2d, scale?: number): Cardinal2d
} = internal.withReflectedEndpoints

export const toPath: {
  /**
   * Converts a `Cardinal2d` to a `CubicPath2d`.
   *
   * @param scale - The scale factor for the conversion.
   * @returns A Function that takes a `Cardinal2d` and returns a new `CubicPath2d` instance.
   * @since 1.0.0
   */
  (scale: number): (c: Cardinal2d) => CubicPath2d
  /**
   * Converts a `Cardinal2d` to a `CubicPath2d`.
   *
   * @param c - The `Cardinal2d` to convert.
   * @param scale - The scale factor for the conversion.
   * @returns A new `CubicPath2d` instance representing the same curve as the `Cardinal2d`.
   * @since 1.0.0
   */
  (c: Cardinal2d, scale?: number): CubicPath2d
} = internal.toPath

export const toBezier: {
  /**
   * Converts a `Cardinal2d` to a `Bezier2d`.
   *
   * @param p - The `Cardinal2d` to convert.
   * @returns A new `Bezier2d` instance representing the same curve as the `Cardinal2d`.
   * @since 1.0.0
   */
  (p: Cardinal2d): Bezier2d
  /**
   * Converts a `Cardinal2d` to a `Bezier2d`.
   *
   * @param p - The `Cardinal2d` to convert.
   * @param scale - The scale factor for the conversion.
   * @returns A new `Bezier2d` instance representing the same curve as the `Cardinal2d`.
   * @since 1.0.0
   */
  (p: Cardinal2d, scale: number): Bezier2d
} = internal.toBezier
