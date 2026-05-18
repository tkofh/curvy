import type { Interval2d } from '../interval/interval2d.ts'
import type { LinearCurve2d } from '../curve/linear2d.ts'
import type { Closed } from '../interval/interval.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { LinearPath2dTypeId } from './linear2d.internal.ts'
import * as internal from './linear2d.internal.ts'
import type {
  Continuous,
  DecreasingX,
  DecreasingY,
  IncreasingX,
  IncreasingY,
  MonotonicX,
  MonotonicY,
  PathTraits,
} from './traits.ts'

export type {
  Continuous,
  DecreasingX,
  DecreasingY,
  IncreasingX,
  IncreasingY,
  MonotonicX,
  MonotonicY,
} from './traits.ts'

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
 * Type-narrowing predicate: refines `LinearPath2d<T>` to
 * `LinearPath2d<T & IncreasingX>` when every segment's x-polynomial is
 * strictly increasing and adjacent segments' x-ranges don't overlap.
 *
 * @since 2.0.0
 */
export const isIncreasingX: <T>(p: LinearPath2d<T>) => p is LinearPath2d<T & IncreasingX> =
  internal.isIncreasingX

/**
 * Type-narrowing predicate: refines `LinearPath2d<T>` to
 * `LinearPath2d<T & DecreasingX>` when every segment's x-polynomial is
 * strictly decreasing and adjacent segments' x-ranges don't overlap.
 *
 * @since 2.0.0
 */
export const isDecreasingX: <T>(p: LinearPath2d<T>) => p is LinearPath2d<T & DecreasingX> =
  internal.isDecreasingX

/**
 * Type-narrowing predicate: refines `LinearPath2d<T>` to
 * `LinearPath2d<T & MonotonicX>` when the path is either increasing or
 * decreasing in x along its full parameter domain.
 *
 * @since 2.0.0
 */
export const isMonotonicX: <T>(p: LinearPath2d<T>) => p is LinearPath2d<T & MonotonicX> =
  internal.isMonotonicX

/**
 * Type-narrowing predicate: refines `LinearPath2d<T>` to
 * `LinearPath2d<T & IncreasingY>`. The y-axis analog of {@link isIncreasingX}.
 *
 * @since 2.0.0
 */
export const isIncreasingY: <T>(p: LinearPath2d<T>) => p is LinearPath2d<T & IncreasingY> =
  internal.isIncreasingY

/**
 * Type-narrowing predicate: refines `LinearPath2d<T>` to
 * `LinearPath2d<T & DecreasingY>`. The y-axis analog of {@link isDecreasingX}.
 *
 * @since 2.0.0
 */
export const isDecreasingY: <T>(p: LinearPath2d<T>) => p is LinearPath2d<T & DecreasingY> =
  internal.isDecreasingY

/**
 * Type-narrowing predicate: refines `LinearPath2d<T>` to
 * `LinearPath2d<T & MonotonicY>`. The y-axis analog of {@link isMonotonicX}.
 *
 * @since 2.0.0
 */
export const isMonotonicY: <T>(p: LinearPath2d<T>) => p is LinearPath2d<T & MonotonicY> =
  internal.isMonotonicY

/**
 * Asserts that the path is strictly increasing in x, throwing on failure.
 *
 * @since 2.0.0
 */
export const asIncreasingX: <T>(p: LinearPath2d<T>) => LinearPath2d<T & IncreasingX> =
  internal.asIncreasingX

/**
 * Asserts that the path is strictly decreasing in x, throwing on failure.
 *
 * @since 2.0.0
 */
export const asDecreasingX: <T>(p: LinearPath2d<T>) => LinearPath2d<T & DecreasingX> =
  internal.asDecreasingX

/**
 * Asserts that the path is monotonic in x, throwing on failure.
 *
 * @since 2.0.0
 */
export const asMonotonicX: <T>(p: LinearPath2d<T>) => LinearPath2d<T & MonotonicX> =
  internal.asMonotonicX

/**
 * Asserts that the path is strictly increasing in y, throwing on failure.
 *
 * @since 2.0.0
 */
export const asIncreasingY: <T>(p: LinearPath2d<T>) => LinearPath2d<T & IncreasingY> =
  internal.asIncreasingY

/**
 * Asserts that the path is strictly decreasing in y, throwing on failure.
 *
 * @since 2.0.0
 */
export const asDecreasingY: <T>(p: LinearPath2d<T>) => LinearPath2d<T & DecreasingY> =
  internal.asDecreasingY

/**
 * Asserts that the path is monotonic in y, throwing on failure.
 *
 * @since 2.0.0
 */
export const asMonotonicY: <T>(p: LinearPath2d<T>) => LinearPath2d<T & MonotonicY> =
  internal.asMonotonicY

export const solveAtX: {
  /**
   * Evaluates the path's y value at a given x. Requires the path to carry the
   * `MonotonicX` brand — without it, an x query could match multiple
   * segments and the return cardinality would be unbounded.
   *
   * Returns `Solution.none` when x falls outside the path's x-range.
   *
   * @param p - A path branded `MonotonicX`.
   * @param x - The x coordinate.
   * @returns The y value at x, or `none` when x is outside the path's range.
   * @since 2.0.0
   */
  <T extends MonotonicX>(p: LinearPath2d<T>, x: number): Solution.AtMostOne<number>
  /** @since 2.0.0 */
  (x: number): <T extends MonotonicX>(p: LinearPath2d<T>) => Solution.AtMostOne<number>
} = internal.solveAtX as never

export const solveAtY: {
  /**
   * Evaluates the path's x value at a given y. Requires the path to carry the
   * `MonotonicY` brand. Returns `Solution.none` when y is outside the path's
   * y-range.
   *
   * @param p - A path branded `MonotonicY`.
   * @param y - The y coordinate.
   * @returns The x value at y, or `none` when y is outside the path's range.
   * @since 2.0.0
   */
  <T extends MonotonicY>(p: LinearPath2d<T>, y: number): Solution.AtMostOne<number>
  /** @since 2.0.0 */
  (y: number): <T extends MonotonicY>(p: LinearPath2d<T>) => Solution.AtMostOne<number>
} = internal.solveAtY as never

/**
 * Computes the axis-aligned bounding box of the path — the smallest closed
 * `Box2d` enclosing every segment.
 *
 * @param p - The linear path.
 * @returns A closed `Box2d` enclosing the path.
 * @since 2.0.0
 */
export const boundingBox: (p: LinearPath2d) => Interval2d<Closed, Closed> = internal.boundingBox

export const transform: {
  /**
   * Applies an `Affine2d` transform to every curve in a `LinearPath2d`,
   * returning a new path whose image is the affine image of the original.
   * Trait brands are dropped — affine maps can flip the sense of monotonicity
   * (a reflection turns `IncreasingX` into `DecreasingX`), so any brands the
   * caller still wants must be reasserted on the result.
   *
   * @param p - The linear path.
   * @param a - The affine transform.
   * @returns A new unbranded `LinearPath2d` whose curves are the affine images of the input's.
   * @since 2.0.0
   */
  (p: LinearPath2d, a: Affine2d): LinearPath2d
  /**
   * Applies an `Affine2d` transform to every curve in a `LinearPath2d`.
   *
   * @param a - The affine transform.
   * @returns A function that takes a `LinearPath2d` and returns the transformed path.
   * @since 2.0.0
   */
  (a: Affine2d): (p: LinearPath2d) => LinearPath2d
} = internal.transform
