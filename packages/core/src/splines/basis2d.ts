import type { CubicPath2d } from '../path/cubic2d.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Basis2dTypeId } from './basis2d.internal.ts'
import * as internal from './basis2d.internal.ts'
import type { Bezier2d } from './bezier2d.ts'

/**
 * A Basis Spline (uniform cubic B-spline) in 2D space.
 *
 * All fields are readonly. No operation mutates a spline.
 *
 * The characteristic matrix that identifies this spline family lives in the
 * `characteristic` module as `Characteristic.cubicBasisSpline`.
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

/**
 * Creates a new `Basis2d` from an array of `[x, y]` tuples.
 *
 * @param tuples - The control points as `[x, y]` tuples.
 * @returns A new `Basis2d` instance.
 * @since 2.0.0
 */
export const fromTuples: (tuples: ReadonlyArray<readonly [number, number]>) => Basis2d =
  internal.fromTuples

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

export const mapPoints: {
  /**
   * Applies a per-point transform to every control point in a `Basis2d`,
   * preserving point count and spline identity.
   *
   * @param f - The point transform.
   * @returns A function that takes a `Basis2d` and returns the mapped spline.
   * @since 2.0.0
   */
  (f: (p: Vector2) => Vector2): (s: Basis2d) => Basis2d
  /**
   * Applies a per-point transform to every control point in a `Basis2d`.
   *
   * @param s - The basis spline.
   * @param f - The point transform.
   * @returns A new `Basis2d` with the transform applied to each control point.
   * @since 2.0.0
   */
  (s: Basis2d, f: (p: Vector2) => Vector2): Basis2d
} = internal.mapPoints

export const flatMap: {
  /**
   * Hands the spline's full control-point array to `f` and uses its returned
   * `Basis2d` as the result. The returned spline goes through this module's
   * builders, so the 4-or-more-points invariant is enforced at construction.
   *
   * @param f - The bulk transform.
   * @returns A function that takes a `Basis2d` and returns the rebuilt spline.
   * @since 2.0.0
   */
  (f: (points: ReadonlyArray<Vector2>) => Basis2d): (s: Basis2d) => Basis2d
  /**
   * Hands the spline's full control-point array to `f` and uses its returned
   * `Basis2d` as the result.
   *
   * @param s - The basis spline.
   * @param f - The bulk transform.
   * @returns The `Basis2d` returned by `f`.
   * @since 2.0.0
   */
  (s: Basis2d, f: (points: ReadonlyArray<Vector2>) => Basis2d): Basis2d
} = internal.flatMap

export const transform: {
  /**
   * Applies an `Affine2d` transform to every control point of a `Basis2d`.
   * Affine maps commute with the B-spline basis, so the result exactly
   * parameterizes the affine image of the original curve.
   *
   * @param s - The basis spline.
   * @param a - The affine transform.
   * @returns A new `Basis2d` whose control points are the affine images of the input's.
   * @since 2.0.0
   */
  (s: Basis2d, a: Affine2d): Basis2d
  /**
   * Applies an `Affine2d` transform to every control point of a `Basis2d`.
   *
   * @param a - The affine transform.
   * @returns A function that takes a `Basis2d` and returns the transformed spline.
   * @since 2.0.0
   */
  (a: Affine2d): (s: Basis2d) => Basis2d
} = internal.transform

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
