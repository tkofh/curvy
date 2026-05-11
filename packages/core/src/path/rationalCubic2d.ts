import type { RationalCubicCurve2d } from '../curve/rationalCubic2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { RationalCubicPath2dTypeId } from './rationalCubic2d.internal'
import * as internal from './rationalCubic2d.internal'

/**
 * A rational cubic path in 2D space.
 *
 * Holds a non-empty sequence of `RationalCubicCurve2d` segments; iteration
 * yields the segments in order. The path parameter `u ∈ [0, 1]` is mapped
 * uniformly across segments — `u = 0` is the start of the first segment,
 * `u = 1` is the end of the last segment, and intermediate values pick a
 * segment by index and a local parameter within it.
 *
 * Counterpart to `CubicPath2d` for curves whose evaluation includes the
 * homogeneous-to-plane projection.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 2.1.0
 */
export interface RationalCubicPath2d extends Pipeable, Iterable<RationalCubicCurve2d> {
  readonly [RationalCubicPath2dTypeId]: RationalCubicPath2dTypeId
}

/**
 * Checks if a value is a `RationalCubicPath2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `RationalCubicPath2d`, `false` otherwise.
 * @since 2.1.0
 */
export const isRationalCubicPath2d: (p: unknown) => p is RationalCubicPath2d =
  internal.isRationalCubicPath2d

/**
 * Creates a new `RationalCubicPath2d` from a sequence of curves.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `RationalCubicPath2d` instance.
 * @since 2.1.0
 */
export const make: (...curves: ReadonlyArray<RationalCubicCurve2d>) => RationalCubicPath2d =
  internal.make

/**
 * Creates a new `RationalCubicPath2d` from an array of curves.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `RationalCubicPath2d` instance.
 * @since 2.1.0
 */
export const fromArray: (curves: ReadonlyArray<RationalCubicCurve2d>) => RationalCubicPath2d =
  internal.fromArray

export const append: {
  /**
   * Appends a curve to a `RationalCubicPath2d`.
   *
   * @param c - The curve to append.
   * @returns A function that takes a path and returns a new path with the appended curve.
   * @since 2.1.0
   */
  (c: RationalCubicCurve2d): (p: RationalCubicPath2d) => RationalCubicPath2d
  /**
   * Appends a curve to a `RationalCubicPath2d`.
   *
   * @param p - The path to append to.
   * @param c - The curve to append.
   * @returns A new path with the appended curve.
   * @since 2.1.0
   */
  (p: RationalCubicPath2d, c: RationalCubicCurve2d): RationalCubicPath2d
} = internal.append

export const solve: {
  /**
   * Evaluates the rational cubic path at parameter `u ∈ [0, 1]`.
   *
   * Picks the segment containing `u` (uniform mapping across segments) and
   * delegates to `RationalCubicCurve2d.solve` on that segment with the local
   * parameter.
   *
   * @param p - The path to evaluate.
   * @param u - The path parameter in `[0, 1]`.
   * @returns The point on the path at parameter `u`.
   * @since 2.1.0
   */
  (p: RationalCubicPath2d, u: number): Vector2
  /**
   * Evaluates the rational cubic path at parameter `u ∈ [0, 1]`.
   *
   * @param u - The path parameter in `[0, 1]`.
   * @returns A function that takes a path and returns the point at `u`.
   * @since 2.1.0
   */
  (u: number): (p: RationalCubicPath2d) => Vector2
} = internal.solve
