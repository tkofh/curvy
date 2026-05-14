import type { LinearPath2d } from '../path/linear2d.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import * as internal from './linear2d.internal.ts'
import type { Linear2dTypeId } from './linear2d.internal.ts'

/**
 * A polyline in 2D space — an ordered list of points that converts to a
 * `LinearPath2d` by joining consecutive points with straight segments.
 *
 * Each spline requires at least 2 points (1 segment minimum). `toPath`
 * produces N-1 segments from N points.
 *
 * @since 2.0.0
 */
export interface Linear2d extends Pipeable {
  readonly [Linear2dTypeId]: Linear2dTypeId
  [Symbol.iterator](): Iterator<Vector2>
}

/**
 * Checks if a value is a `Linear2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `Linear2d`, `false` otherwise.
 * @since 2.0.0
 */
export const isLinear2d: (p: unknown) => p is Linear2d = internal.isLinear2d

/**
 * Creates a new `Linear2d` from 2 or more points.
 *
 * @param p0 - The first point.
 * @param p1 - The second point.
 * @param rest - Additional points.
 * @returns A new `Linear2d` instance.
 * @since 2.0.0
 */
export const make: (p0: Vector2, p1: Vector2, ...rest: ReadonlyArray<Vector2>) => Linear2d =
  internal.make

/**
 * Creates a new `Linear2d` from an array of points. Requires at least 2
 * points.
 *
 * @param points - The points.
 * @returns A new `Linear2d` instance.
 * @since 2.0.0
 */
export const fromArray: (points: ReadonlyArray<Vector2>) => Linear2d = internal.fromArray

/**
 * Creates a new `Linear2d` from an array of `[x, y]` tuples. Requires at
 * least 2 tuples.
 *
 * @param tuples - The points as `[x, y]` tuples.
 * @returns A new `Linear2d` instance.
 * @since 2.0.0
 */
export const fromTuples: (tuples: ReadonlyArray<readonly [number, number]>) => Linear2d =
  internal.fromTuples

export const append: {
  /**
   * Appends points to a `Linear2d`.
   *
   * @param points - The points to append.
   * @returns A function that takes a `Linear2d` and returns a new `Linear2d` with the appended points.
   * @since 2.0.0
   */
  (...points: ReadonlyArray<Vector2>): (p: Linear2d) => Linear2d
  /**
   * Appends points to a `Linear2d`.
   *
   * @param p - The `Linear2d` to append to.
   * @param points - The points to append.
   * @returns A new `Linear2d` with the appended points.
   * @since 2.0.0
   */
  (p: Linear2d, ...points: ReadonlyArray<Vector2>): Linear2d
} = internal.append

export const prepend: {
  /**
   * Prepends points to a `Linear2d`.
   *
   * @param points - The points to prepend.
   * @returns A function that takes a `Linear2d` and returns a new `Linear2d` with the prepended points.
   * @since 2.0.0
   */
  (...points: ReadonlyArray<Vector2>): (p: Linear2d) => Linear2d
  /**
   * Prepends points to a `Linear2d`.
   *
   * @param p - The `Linear2d` to prepend to.
   * @param points - The points to prepend.
   * @returns A new `Linear2d` with the prepended points.
   * @since 2.0.0
   */
  (p: Linear2d, ...points: ReadonlyArray<Vector2>): Linear2d
} = internal.prepend

/**
 * Converts a `Linear2d` to a `LinearPath2d` by joining consecutive points
 * with straight segments. The result is unbranded; assert
 * `LinearPath2d.asMonotonicX` / `asMonotonicY` afterward if the underlying
 * points warrant it.
 *
 * @param p - The `Linear2d` to convert.
 * @returns A new `LinearPath2d` with one segment per consecutive point pair.
 * @since 2.0.0
 */
export const toPath: (p: Linear2d) => LinearPath2d = internal.toPath
