import type { RationalCubicCurve2d } from '../curve/rationalCubic2d.ts'
import type { Closed } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { CubicPath2d } from './cubic2d.ts'
import type { RationalCubicPath2dTypeId } from './rationalCubic2d.internal.ts'
import * as internal from './rationalCubic2d.internal.ts'

/**
 * A rational cubic path in 2D space.
 *
 * Holds a non-empty sequence of `RationalCubicCurve2d` segments. Iteration
 * yields the segments in order. The path parameter `u ∈ [0, 1]` is mapped
 * uniformly across segments: `u = 0` is the start of the first segment,
 * `u = 1` is the end of the last segment, and intermediate values pick a
 * segment by index and a local parameter within it.
 *
 * Counterpart to `CubicPath2d` for curves whose evaluation includes the
 * homogeneous-to-plane projection.
 *
 * All fields are readonly. No operation mutates a path.
 *
 * @since 2.0.0
 */
export interface RationalCubicPath2d extends Pipeable, Iterable<RationalCubicCurve2d> {
  readonly [RationalCubicPath2dTypeId]: RationalCubicPath2dTypeId
}

/**
 * Checks if a value is a `RationalCubicPath2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `RationalCubicPath2d`, `false` otherwise.
 * @since 2.0.0
 */
export const isRationalCubicPath2d: (p: unknown) => p is RationalCubicPath2d =
  internal.isRationalCubicPath2d

/**
 * Creates a new `RationalCubicPath2d` from a sequence of curves.
 *
 * @param curves - The curves to create the path from. At least one is required.
 * @returns A new `RationalCubicPath2d` instance.
 * @throws `Error` when called with no curves.
 * @since 2.0.0
 */
export const make: (...curves: ReadonlyArray<RationalCubicCurve2d>) => RationalCubicPath2d =
  internal.make

/**
 * Creates a new `RationalCubicPath2d` from an array of curves.
 *
 * @param curves - The curves to create the path from. At least one is required.
 * @returns A new `RationalCubicPath2d` instance.
 * @throws `Error` when the array is empty.
 * @since 2.0.0
 */
export const fromArray: (curves: ReadonlyArray<RationalCubicCurve2d>) => RationalCubicPath2d =
  internal.fromArray

export const append: {
  /**
   * Appends a curve to a `RationalCubicPath2d`.
   *
   * @param c - The curve to append.
   * @returns A function that takes a path and returns a new path with the appended curve.
   * @since 2.0.0
   */
  (c: RationalCubicCurve2d): (p: RationalCubicPath2d) => RationalCubicPath2d
  /**
   * Appends a curve to a `RationalCubicPath2d`.
   *
   * @param p - The path to append to.
   * @param c - The curve to append.
   * @returns A new path with the appended curve.
   * @since 2.0.0
   */
  (p: RationalCubicPath2d, c: RationalCubicCurve2d): RationalCubicPath2d
} = internal.append

export const solve: {
  /**
   * Evaluates the rational cubic path at parameter `u ∈ [0, 1]`.
   *
   * Segments split `u` uniformly: each curve gets an equal share of the
   * parameter range, regardless of its arc length. The selected segment's
   * curve is evaluated at the corresponding local parameter.
   *
   * `u` is not range-checked. Values outside `[0, 1]` index past the
   * segment array and fail.
   *
   * @param p - The path to evaluate.
   * @param u - The path parameter in `[0, 1]`.
   * @returns The point on the path at parameter `u`.
   * @since 2.0.0
   */
  (p: RationalCubicPath2d, u: number): Vector2
  /**
   * Evaluates the rational cubic path at parameter `u ∈ [0, 1]`.
   *
   * @param u - The path parameter in `[0, 1]`.
   * @returns A function that takes a path and returns the point at `u`.
   * @since 2.0.0
   */
  (u: number): (p: RationalCubicPath2d) => Vector2
} = internal.solve

export const boundingBox: {
  /**
   * Computes a closed axis-aligned bounding box for a rational cubic path,
   * tight to within `tolerance` per side.
   *
   * Each segment's box is `RationalCubicCurve2d.boundingBox` at the same
   * `tolerance`: recursive subdivision producing a hull-AABB union. The
   * path box is the union of segment boxes. Since each segment box has
   * slack ≤ `tolerance` per side, so does the union.
   *
   * @param p - The rational cubic path.
   * @param tolerance - Maximum allowed slack per side. Must be positive.
   * @returns A closed `Interval2d` enclosing the path, tight to within `tolerance`.
   * @since 2.0.0
   */
  (p: RationalCubicPath2d, tolerance: number): Interval2d<Closed, Closed>
  /**
   * Computes a closed axis-aligned bounding box for a rational cubic path.
   *
   * @param tolerance - Maximum allowed slack per side. Must be positive.
   * @returns A function that takes a path and returns its bounding box.
   * @since 2.0.0
   */
  (tolerance: number): (p: RationalCubicPath2d) => Interval2d<Closed, Closed>
} = internal.boundingBox

export const approximateAsCubicPath: {
  /**
   * Approximates the rational cubic path as a `CubicPath2d` via per-segment
   * recursive subdivision. Each input segment is split until its midpoint
   * deviates from a polynomial-cubic candidate by at most `tolerance`. The
   * surviving candidates are concatenated into a new path.
   *
   * Lossy in general: only exact when every input segment has uniform
   * weights, in which case segment count is preserved. Tighter tolerance
   * produces more segments.
   *
   * @param p - The rational cubic path to approximate.
   * @param tolerance - Maximum allowed midpoint deviation per segment. Must be positive.
   * @returns A new `CubicPath2d` approximating the input.
   * @since 2.0.0
   */
  (p: RationalCubicPath2d, tolerance: number): CubicPath2d
  /**
   * Approximates the rational cubic path as a `CubicPath2d`.
   *
   * @param tolerance - Maximum allowed midpoint deviation per segment. Must be positive.
   * @returns A function that takes a rational path and returns its approximation.
   * @since 2.0.0
   */
  (tolerance: number): (p: RationalCubicPath2d) => CubicPath2d
} = internal.approximateAsCubicPath

export const transform: {
  /**
   * Applies an `Affine2d` transform to every curve in a `RationalCubicPath2d`,
   * returning a new path whose image is the affine image of the original.
   *
   * @param p - The rational cubic path.
   * @param a - The affine transform.
   * @returns A new `RationalCubicPath2d` whose curves are the affine images of the input's.
   * @since 2.0.0
   */
  (p: RationalCubicPath2d, a: Affine2d): RationalCubicPath2d
  /**
   * Applies an `Affine2d` transform to every curve in a `RationalCubicPath2d`.
   *
   * @param a - The affine transform.
   * @returns A function that takes a `RationalCubicPath2d` and returns the transformed path.
   * @since 2.0.0
   */
  (a: Affine2d): (p: RationalCubicPath2d) => RationalCubicPath2d
} = internal.transform
