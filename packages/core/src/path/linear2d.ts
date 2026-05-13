import type { Interval2d } from '../interval/interval2d'
import type { LinearCurve2d } from '../curve/linear2d'
import type { Closed } from '../interval/interval'
import type { Pipeable } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { LinearPath2dTypeId } from './linear2d.internal'
import * as internal from './linear2d.internal'
import type { Continuous, PathTraits } from './traits'

export type { Continuous } from './traits'

/**
 * A linear path in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The `Trait` type parameter accumulates trait brands as the path is refined
 * via `isContinuous` / `asContinuous`. A `Continuous` path's `toPathData`
 * skips the per-segment discontinuity check.
 *
 * @since 1.0.0
 */
export interface LinearPath2d<out Trait = unknown> extends Pipeable, Iterable<LinearCurve2d> {
  readonly [LinearPath2dTypeId]: LinearPath2dTypeId
  readonly [PathTraits]: Trait
}

/**
 * Creates a new `LinearPath2d` instance from a sequence of curves.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `LinearPath2d` instance.
 * @since 2.0.0
 */
export const make: (...curves: ReadonlyArray<LinearCurve2d>) => LinearPath2d = internal.make

/**
 * Creates a new `LinearPath2d` instance from an array of curves.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `LinearPath2d` instance.
 * @since 2.0.0
 */
export const fromArray: (curves: ReadonlyArray<LinearCurve2d>) => LinearPath2d = internal.fromArray

/**
 * Checks if a value is a `LinearPath2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `LinearPath2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isLinearPath2d: (p: unknown) => p is LinearPath2d = internal.isLinearPath2d

export const append: {
  /**
   * Appends a linear curve to a linear path.
   *
   * @param c - The linear curve to append.
   * @returns A function that takes a linear path and returns a new linear path.
   * @since 1.0.0
   */
  (c: LinearCurve2d): (p: LinearPath2d) => LinearPath2d
  /**
   * Appends a linear curve to a linear path.
   *
   * @param p - The linear path to append to.
   * @param c - The linear curve to append.
   * @returns A new `LinearPath2d` instance with the appended curve.
   * @since 1.0.0
   */
  (p: LinearPath2d, c: LinearCurve2d): LinearPath2d
} = internal.append

/**
 * Calculates the length of a linear path.
 *
 * @param p - The linear path to calculate the length of.
 * @returns The length of the linear path.
 * @since 1.0.0
 */
export const length: (p: LinearPath2d) => number = internal.length

export const solve: {
  /**
   * Solves a linear path for a given parameter.
   *
   * @param u - The parameter to solve for.
   * @returns A function that takes a linear path and returns the solved point.
   * @since 1.0.0
   */
  (u: number): (p: LinearPath2d) => Vector2
  /**
   * Solves a linear path for a given parameter.
   *
   * @param p - The linear path to solve.
   * @param u - The parameter to solve for.
   * @returns The solved point on the linear path.
   * @since 1.0.0
   */
  (p: LinearPath2d, u: number): Vector2
} = internal.solve

/**
 * Serializes a linear path as an SVG path data string (the value of a `<path>`
 * element's `d` attribute), using `M` and `L` commands. Discontinuities between
 * curves emit a fresh `M` command.
 *
 * @param p - The linear path to serialize.
 * @returns The SVG path data string.
 * @since 2.0.0
 */
export const toPathData: (p: LinearPath2d) => string = internal.toPathData

/**
 * Type-narrowing predicate: refines `LinearPath2d<T>` to
 * `LinearPath2d<T & Continuous>` when adjacent curves connect at their join
 * points.
 *
 * @param p - The linear path to check.
 * @returns `true` when the path is continuous (G⁰).
 * @since 2.0.0
 */
export const isContinuous: <T>(p: LinearPath2d<T>) => p is LinearPath2d<T & Continuous> =
  internal.isContinuous

/**
 * Asserts that the linear path is continuous, throwing on failure.
 *
 * @param p - The linear path to assert against.
 * @returns The same path, typed with the `Continuous` brand.
 * @throws When the path has a discontinuity between adjacent curves.
 * @since 2.0.0
 */
export const asContinuous: <T>(p: LinearPath2d<T>) => LinearPath2d<T & Continuous> =
  internal.asContinuous

/**
 * Computes the axis-aligned bounding box of the path — the smallest closed
 * `Box2d` enclosing every segment.
 *
 * @param p - The linear path.
 * @returns A closed `Box2d` enclosing the path.
 * @since 2.1.0
 */
export const boundingBox: (p: LinearPath2d) => Interval2d<Closed, Closed> = internal.boundingBox
