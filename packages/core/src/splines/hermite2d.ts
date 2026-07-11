import type { CubicPath2d } from '../path/cubic2d.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Bezier2d } from './bezier2d.ts'
import * as internal from './hermite2d.internal.ts'
import type { Hermite2dTypeId } from './hermite2d.internal.ts'

/**
 * A Hermite spline in 2D space.
 *
 * All fields are readonly. No operation mutates a spline.
 *
 * The characteristic matrix that identifies this spline family lives in the
 * `characteristic` module as `Characteristic.cubicHermite`.
 *
 * @since 1.0.0
 */
export interface Hermite2d extends Pipeable {
  readonly [Hermite2dTypeId]: Hermite2dTypeId

  [Symbol.iterator](): IterableIterator<Vector2>
}

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

/**
 * Creates a new `Hermite2d` from an array of `[x, y]` tuples, alternating
 * `[position, velocity]` pairs.
 *
 * @param tuples - The point/velocity pairs as `[x, y]` tuples.
 * @returns A new `Hermite2d` instance.
 * @since 2.0.0
 */
export const fromTuples: (tuples: ReadonlyArray<readonly [number, number]>) => Hermite2d =
  internal.fromTuples

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

export const mapPoints: {
  /**
   * Applies a per-point transform to every entry in a `Hermite2d`, preserving
   * the alternating position/velocity layout and total point count.
   *
   * The transform receives both positions and velocity vectors as plain
   * `Vector2`s: Hermite splines store them in interleaved slots without a
   * structural distinction. Linear transforms (rotation, scaling) act
   * correctly on both slot kinds, but a uniform translation will offset the
   * velocity slots as well as the positions. To translate positions only,
   * reach for `flatMap` and split the array yourself.
   *
   * @param f - The point transform.
   * @returns A function that takes a `Hermite2d` and returns the mapped spline.
   * @since 2.0.0
   */
  (f: (p: Vector2) => Vector2): (s: Hermite2d) => Hermite2d
  /**
   * Applies a per-point transform to every entry in a `Hermite2d`.
   *
   * @param s - The hermite spline.
   * @param f - The point transform.
   * @returns A new `Hermite2d` with the transform applied to each entry.
   * @since 2.0.0
   */
  (s: Hermite2d, f: (p: Vector2) => Vector2): Hermite2d
} = internal.mapPoints

export const flatMap: {
  /**
   * Hands the spline's full entry array to `f` (alternating positions and
   * velocities) and uses its returned `Hermite2d` as the result. The returned
   * spline goes through this module's builders, so the even-arity and
   * minimum-4-entry invariants are enforced at construction.
   *
   * @param f - The bulk transform.
   * @returns A function that takes a `Hermite2d` and returns the rebuilt spline.
   * @since 2.0.0
   */
  (f: (points: ReadonlyArray<Vector2>) => Hermite2d): (s: Hermite2d) => Hermite2d
  /**
   * Hands the spline's full entry array to `f` and uses its returned
   * `Hermite2d` as the result.
   *
   * @param s - The hermite spline.
   * @param f - The bulk transform.
   * @returns The `Hermite2d` returned by `f`.
   * @since 2.0.0
   */
  (s: Hermite2d, f: (points: ReadonlyArray<Vector2>) => Hermite2d): Hermite2d
} = internal.flatMap

export const transform: {
  /**
   * Applies an `Affine2d` transform to a `Hermite2d`, treating the entries
   * correctly by kind. Positions (even indices) receive the full affine, and
   * tangent vectors (odd indices) receive only the linear part. Translation
   * doesn't move tangents, only the linear map does.
   *
   * The result exactly parameterizes the affine image of the original curve.
   *
   * @param s - The hermite spline.
   * @param a - The affine transform.
   * @returns A new `Hermite2d` with positions and tangents transformed
   *   appropriately.
   * @since 2.0.0
   */
  (s: Hermite2d, a: Affine2d): Hermite2d
  /**
   * Applies an `Affine2d` transform to a `Hermite2d`.
   *
   * @param a - The affine transform.
   * @returns A function that takes a `Hermite2d` and returns the transformed spline.
   * @since 2.0.0
   */
  (a: Affine2d): (s: Hermite2d) => Hermite2d
} = internal.transform

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
