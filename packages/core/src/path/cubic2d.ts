import type { Interval2d } from '../interval/interval2d'
import type { CubicCurve2d } from '../curve/cubic2d'
import type { Closed } from '../interval/interval'
import type { Pipeable } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { CubicPath2dTypeId } from './cubic2d.internal'
import * as internal from './cubic2d.internal'
import type { Continuous, PathTraits } from './traits'

export type { Continuous } from './traits'

/**
 * A cubic path in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The `Trait` type parameter accumulates trait brands as the path is refined
 * via `isContinuous` / `asContinuous`.
 *
 * @since 1.0.0
 */
export interface CubicPath2d<out Trait = unknown> extends Pipeable, Iterable<CubicCurve2d> {
  readonly [CubicPath2dTypeId]: CubicPath2dTypeId
  readonly [PathTraits]: Trait
}

/**
 * Creates a new `CubicPath2d` instance from a sequence of curves.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `CubicPath2d` instance.
 * @since 2.0.0
 */
export const make: (...curves: ReadonlyArray<CubicCurve2d>) => CubicPath2d = internal.make

/**
 * Creates a new `CubicPath2d` instance from an array of curves.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `CubicPath2d` instance.
 * @since 2.0.0
 */
export const fromArray: (curves: ReadonlyArray<CubicCurve2d>) => CubicPath2d = internal.fromArray

/**
 * Checks if a value is a `CubicPath2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `CubicPath2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isCubicPath2d: (p: unknown) => p is CubicPath2d = internal.isCubicPath2d

export const append: {
  /**
   * Appends a cubic curve to a cubic path.
   *
   * @param c - The cubic curve to append.
   * @returns A function that takes a cubic path and returns a new cubic path.
   * @since 1.0.0
   */
  (c: CubicCurve2d): (p: CubicPath2d) => CubicPath2d
  /**
   * Appends a cubic curve to a cubic path.
   *
   * @param p - The cubic path to append to.
   * @param c - The cubic curve to append.
   * @returns A new cubic path.
   * @since 1.0.0
   */
  (p: CubicPath2d, c: CubicCurve2d): CubicPath2d
} = internal.append

/**
 * Calculates the length of a cubic path.
 *
 * @param p - The cubic path to calculate the length of.
 * @returns The length of the cubic path.
 * @since 1.0.0
 */
export const length: (p: CubicPath2d) => number = internal.length

export const solve: {
  /**
   * Solves a cubic path for a given parameter.
   *
   * @param u - The parameter to solve for.
   * @returns A function that takes a cubic path and returns the solved vector.
   * @since 1.0.0
   */
  (u: number): (p: CubicPath2d) => Vector2
  /**
   * Solves a cubic path for a given parameter.
   *
   * @param p - The cubic path to solve.
   * @param u - The parameter to solve for.
   * @returns The solved vector.
   * @since 1.0.0
   */
  (p: CubicPath2d, u: number): Vector2
} = internal.solve

/**
 * Serializes a cubic path as an SVG path data string (the value of a `<path>`
 * element's `d` attribute), using `M` and `C` commands. Discontinuities between
 * curves emit a fresh `M` command.
 *
 * @param p - The cubic path to serialize.
 * @returns The SVG path data string.
 * @since 2.0.0
 */
export const toPathData: (p: CubicPath2d) => string = internal.toPathData

/**
 * Type-narrowing predicate: refines `CubicPath2d<T>` to
 * `CubicPath2d<T & Continuous>` when adjacent curves connect.
 *
 * @since 2.0.0
 */
export const isContinuous: <T>(p: CubicPath2d<T>) => p is CubicPath2d<T & Continuous> =
  internal.isContinuous

/**
 * Asserts that the cubic path is continuous, throwing on failure.
 *
 * @since 2.0.0
 */
export const asContinuous: <T>(p: CubicPath2d<T>) => CubicPath2d<T & Continuous> =
  internal.asContinuous

export const solveByDistance: {
  /**
   * Solves a cubic path by normalized arc length. Unlike {@link solve}, which
   * is parameterized by curve `u`, this samples points at constant speed along
   * the path — `s = 0.5` returns the point exactly halfway along the curve by
   * arc length, regardless of how the underlying parameterization stretches.
   *
   * Cumulative segment lengths are cached by path identity so repeated calls
   * with the same path are fast.
   *
   * @param p - The cubic path to sample.
   * @param s - Normalized arc length in `[0, 1]`. Values outside the range are
   *   clamped to path endpoints.
   * @returns The point on the path at the given normalized arc length.
   * @since 1.1.0
   */
  (p: CubicPath2d, s: number): Vector2
  /**
   * Solves a cubic path by normalized arc length.
   *
   * @param s - Normalized arc length in `[0, 1]`.
   * @returns A function that takes a cubic path and returns the point at that
   *   arc length.
   * @since 1.1.0
   */
  (s: number): (p: CubicPath2d) => Vector2
} = internal.solveByDistance

/**
 * Computes the axis-aligned bounding box of the path — the smallest closed
 * `Box2d` enclosing every segment.
 *
 * @param p - The cubic path.
 * @returns A closed `Box2d` enclosing the path.
 * @since 2.1.0
 */
export const boundingBox: (p: CubicPath2d) => Interval2d<Closed, Closed> = internal.boundingBox
