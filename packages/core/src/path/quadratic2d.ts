import type { Interval2d } from '../interval/interval2d.ts'
import type { QuadraticCurve2d } from '../curve/quadratic2d.ts'
import type { Closed } from '../interval/interval.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { QuadraticPath2dTypeId } from './quadratic2d.internal.ts'
import * as internal from './quadratic2d.internal.ts'
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
 * A quadratic path in 2D space.
 *
 * All fields are readonly. No operation mutates a path.
 *
 * The `Trait` type parameter accumulates trait brands as the path is refined
 * via `isContinuous` / `asContinuous`.
 *
 * @since 1.0.0
 */
export interface QuadraticPath2d<out Trait = unknown> extends Pipeable, Iterable<QuadraticCurve2d> {
  readonly [QuadraticPath2dTypeId]: QuadraticPath2dTypeId
  readonly [PathTraits]: Trait
}

/**
 * Creates a new `QuadraticPath2d` instance from a sequence of curves.
 *
 * @param curves - The curves to create the path from. At least one is required.
 * @returns A new `QuadraticPath2d` instance.
 * @throws `Error` when called with no curves.
 * @since 2.0.0
 */
export const make: (...curves: ReadonlyArray<QuadraticCurve2d>) => QuadraticPath2d = internal.make

/**
 * Creates a new `QuadraticPath2d` instance from an array of curves.
 *
 * @param curves - The curves to create the path from. At least one is required.
 * @returns A new `QuadraticPath2d` instance.
 * @throws `Error` when the array is empty.
 * @since 2.0.0
 */
export const fromArray: (curves: ReadonlyArray<QuadraticCurve2d>) => QuadraticPath2d =
  internal.fromArray

/**
 * Checks if a value is a `QuadraticPath2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `QuadraticPath2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isQuadraticPath2d: (p: unknown) => p is QuadraticPath2d = internal.isQuadraticPath2d

export const append: {
  /**
   * Appends a quadratic curve to a quadratic path.
   *
   * @param c - The quadratic curve to append.
   * @returns A function that takes a quadratic path and returns a new quadratic path.
   * @since 1.0.0
   */
  (c: QuadraticCurve2d): (p: QuadraticPath2d) => QuadraticPath2d
  /**
   * Appends a quadratic curve to a quadratic path.
   *
   * @param p - The quadratic path to append to.
   * @param c - The quadratic curve to append.
   * @returns A new `QuadraticPath2d` instance with the appended curve.
   * @since 1.0.0
   */
  (p: QuadraticPath2d, c: QuadraticCurve2d): QuadraticPath2d
} = internal.append

/**
 * Calculates the total arc length of a quadratic path.
 *
 * @param p - The quadratic path to measure.
 * @returns The sum of the segments' arc lengths.
 * @since 1.0.0
 */
export const length: (p: QuadraticPath2d) => number = internal.length

export const solve: {
  /**
   * Evaluates the quadratic path at parameter `u ∈ [0, 1]`.
   *
   * @param u - The path parameter in `[0, 1]`.
   * @returns A function that takes a quadratic path and returns the point at `u`.
   * @throws `Error` when `u` is outside `[0, 1]` by more than `EPSILON`.
   * @since 1.0.0
   */
  (u: number): (p: QuadraticPath2d) => Vector2
  /**
   * Evaluates the quadratic path at parameter `u ∈ [0, 1]`.
   *
   * Segments split `u` uniformly. Each curve gets an equal share of the
   * parameter range, regardless of its arc length. The selected segment's
   * curve is evaluated at the corresponding local parameter.
   *
   * `u` may graze the domain by up to `EPSILON` (values in the band clamp
   * to the nearest endpoint). Beyond that the call throws.
   *
   * @param p - The quadratic path to evaluate.
   * @param u - The path parameter in `[0, 1]`.
   * @returns The point on the path at parameter `u`.
   * @throws `Error` when `u` is outside `[0, 1]` by more than `EPSILON`.
   * @since 1.0.0
   */
  (p: QuadraticPath2d, u: number): Vector2
} = internal.solve

/**
 * Serializes a quadratic path as an SVG path data string (the value of a
 * `<path>` element's `d` attribute), using `M` and `Q` commands. Discontinuities
 * between curves emit a fresh `M` command.
 *
 * @param p - The quadratic path to serialize.
 * @returns The SVG path data string.
 * @since 2.0.0
 */
export const toPathData: (p: QuadraticPath2d) => string = internal.toPathData

/**
 * Checks if adjacent curves connect at their join points (G⁰ continuity),
 * each junction compared with `coincident` tolerance (see `PRECISION.md`),
 * adding `Continuous` to the path's traits.
 *
 * @param p - The quadratic path to check.
 * @returns `true` when every junction connects, narrowing to `QuadraticPath2d<T & Continuous>`.
 * @since 2.0.0
 */
export const isContinuous: <T>(p: QuadraticPath2d<T>) => p is QuadraticPath2d<T & Continuous> =
  internal.isContinuous

/**
 * Asserts that the quadratic path is continuous, throwing on failure.
 *
 * @param p - The quadratic path to assert against.
 * @returns The same path, with `Continuous` added to its traits.
 * @throws `Error` when adjacent curves do not connect.
 * @since 2.0.0
 */
export const asContinuous: <T>(p: QuadraticPath2d<T>) => QuadraticPath2d<T & Continuous> =
  internal.asContinuous

/**
 * Checks if the path's x-coordinate increases as the path parameter
 * advances. Every segment's x polynomial is strictly increasing on
 * `[0, 1]` and adjacent segments' x-ranges don't overlap. Adds
 * `IncreasingX` to the path's traits.
 *
 * @param p - The quadratic path to check.
 * @returns `true` when x increases along the path, narrowing to `QuadraticPath2d<T & IncreasingX>`.
 * @since 2.0.0
 */
export const isIncreasingX: <T>(p: QuadraticPath2d<T>) => p is QuadraticPath2d<T & IncreasingX> =
  internal.isIncreasingX

/**
 * Checks if the path's x-coordinate decreases as the path parameter
 * advances. Every segment's x polynomial is strictly decreasing on
 * `[0, 1]` and adjacent segments' x-ranges don't overlap. Adds
 * `DecreasingX` to the path's traits.
 *
 * @param p - The quadratic path to check.
 * @returns `true` when x decreases along the path, narrowing to `QuadraticPath2d<T & DecreasingX>`.
 * @since 2.0.0
 */
export const isDecreasingX: <T>(p: QuadraticPath2d<T>) => p is QuadraticPath2d<T & DecreasingX> =
  internal.isDecreasingX

/**
 * Checks if the path's x-coordinate is monotonic (increasing or
 * decreasing) as the path parameter advances, the property the brand
 * `solveAtX` requires. Adds `MonotonicX` to the path's traits.
 *
 * @param p - The quadratic path to check.
 * @returns `true` when x is monotonic along the path, narrowing to `QuadraticPath2d<T & MonotonicX>`.
 * @since 2.0.0
 */
export const isMonotonicX: <T>(p: QuadraticPath2d<T>) => p is QuadraticPath2d<T & MonotonicX> =
  internal.isMonotonicX

/**
 * Checks if the path's y-coordinate increases as the path parameter
 * advances. Every segment's y polynomial is strictly increasing on
 * `[0, 1]` and adjacent segments' y-ranges don't overlap. Adds
 * `IncreasingY` to the path's traits.
 *
 * @param p - The quadratic path to check.
 * @returns `true` when y increases along the path, narrowing to `QuadraticPath2d<T & IncreasingY>`.
 * @since 2.0.0
 */
export const isIncreasingY: <T>(p: QuadraticPath2d<T>) => p is QuadraticPath2d<T & IncreasingY> =
  internal.isIncreasingY

/**
 * Checks if the path's y-coordinate decreases as the path parameter
 * advances. Every segment's y polynomial is strictly decreasing on
 * `[0, 1]` and adjacent segments' y-ranges don't overlap. Adds
 * `DecreasingY` to the path's traits.
 *
 * @param p - The quadratic path to check.
 * @returns `true` when y decreases along the path, narrowing to `QuadraticPath2d<T & DecreasingY>`.
 * @since 2.0.0
 */
export const isDecreasingY: <T>(p: QuadraticPath2d<T>) => p is QuadraticPath2d<T & DecreasingY> =
  internal.isDecreasingY

/**
 * Checks if the path's y-coordinate is monotonic (increasing or
 * decreasing) as the path parameter advances, the property the brand
 * `solveAtY` requires. Adds `MonotonicY` to the path's traits.
 *
 * @param p - The quadratic path to check.
 * @returns `true` when y is monotonic along the path, narrowing to `QuadraticPath2d<T & MonotonicY>`.
 * @since 2.0.0
 */
export const isMonotonicY: <T>(p: QuadraticPath2d<T>) => p is QuadraticPath2d<T & MonotonicY> =
  internal.isMonotonicY

/**
 * Asserts that the path is strictly increasing in x, throwing on failure.
 *
 * @param p - The quadratic path to assert against.
 * @returns The same path, with `IncreasingX` added to its traits.
 * @throws `Error` when the path is not strictly increasing in x.
 * @since 2.0.0
 */
export const asIncreasingX: <T>(p: QuadraticPath2d<T>) => QuadraticPath2d<T & IncreasingX> =
  internal.asIncreasingX

/**
 * Asserts that the path is strictly decreasing in x, throwing on failure.
 *
 * @param p - The quadratic path to assert against.
 * @returns The same path, with `DecreasingX` added to its traits.
 * @throws `Error` when the path is not strictly decreasing in x.
 * @since 2.0.0
 */
export const asDecreasingX: <T>(p: QuadraticPath2d<T>) => QuadraticPath2d<T & DecreasingX> =
  internal.asDecreasingX

/**
 * Asserts that the path is monotonic in x, throwing on failure.
 *
 * @param p - The quadratic path to assert against.
 * @returns The same path, with `MonotonicX` added to its traits.
 * @throws `Error` when the path is not monotonic in x.
 * @since 2.0.0
 */
export const asMonotonicX: <T>(p: QuadraticPath2d<T>) => QuadraticPath2d<T & MonotonicX> =
  internal.asMonotonicX

/**
 * Asserts that the path is strictly increasing in y, throwing on failure.
 *
 * @param p - The quadratic path to assert against.
 * @returns The same path, with `IncreasingY` added to its traits.
 * @throws `Error` when the path is not strictly increasing in y.
 * @since 2.0.0
 */
export const asIncreasingY: <T>(p: QuadraticPath2d<T>) => QuadraticPath2d<T & IncreasingY> =
  internal.asIncreasingY

/**
 * Asserts that the path is strictly decreasing in y, throwing on failure.
 *
 * @param p - The quadratic path to assert against.
 * @returns The same path, with `DecreasingY` added to its traits.
 * @throws `Error` when the path is not strictly decreasing in y.
 * @since 2.0.0
 */
export const asDecreasingY: <T>(p: QuadraticPath2d<T>) => QuadraticPath2d<T & DecreasingY> =
  internal.asDecreasingY

/**
 * Asserts that the path is monotonic in y, throwing on failure.
 *
 * @param p - The quadratic path to assert against.
 * @returns The same path, with `MonotonicY` added to its traits.
 * @throws `Error` when the path is not monotonic in y.
 * @since 2.0.0
 */
export const asMonotonicY: <T>(p: QuadraticPath2d<T>) => QuadraticPath2d<T & MonotonicY> =
  internal.asMonotonicY

export const solveAtX: {
  /**
   * Evaluates the path's y value at a given x. Requires the path to carry
   * the `MonotonicX` brand. Returns `Solution.none` when x is outside the
   * path's x-range.
   *
   * @param p - A path branded `MonotonicX`.
   * @param x - The x coordinate.
   * @returns The y value at x, or `none` when x is outside the path's range.
   * @since 2.0.0
   */
  <T extends MonotonicX>(p: QuadraticPath2d<T>, x: number): Solution.AtMostOne<number>
  /**
   * Evaluates the path's y value at a given x.
   *
   * @param x - The x coordinate.
   * @returns A function that takes a `MonotonicX`-branded path and returns the y value at `x`.
   * @since 2.0.0
   */
  (x: number): <T extends MonotonicX>(p: QuadraticPath2d<T>) => Solution.AtMostOne<number>
} = internal.solveAtX as never

export const solveAtY: {
  /**
   * Evaluates the path's x value at a given y. Requires the path to carry
   * the `MonotonicY` brand. Returns `Solution.none` when y is outside the
   * path's y-range.
   *
   * @param p - A path branded `MonotonicY`.
   * @param y - The y coordinate.
   * @returns The x value at y, or `none` when y is outside the path's range.
   * @since 2.0.0
   */
  <T extends MonotonicY>(p: QuadraticPath2d<T>, y: number): Solution.AtMostOne<number>
  /**
   * Evaluates the path's x value at a given y.
   *
   * @param y - The y coordinate.
   * @returns A function that takes a `MonotonicY`-branded path and returns the x value at `y`.
   * @since 2.0.0
   */
  (y: number): <T extends MonotonicY>(p: QuadraticPath2d<T>) => Solution.AtMostOne<number>
} = internal.solveAtY as never

/**
 * Computes the axis-aligned bounding box of the path.
 *
 * @param p - The quadratic path.
 * @returns The smallest closed `Interval2d` enclosing every segment.
 * @since 2.0.0
 */
export const boundingBox: (p: QuadraticPath2d) => Interval2d<Closed, Closed> = internal.boundingBox

export const transform: {
  /**
   * Applies an `Affine2d` transform to every curve in a `QuadraticPath2d`,
   * returning a new path whose image is the affine image of the original.
   * Trait brands are dropped.
   *
   * @param p - The quadratic path.
   * @param a - The affine transform.
   * @returns A new unbranded `QuadraticPath2d` whose curves are the affine images of the input's.
   * @since 2.0.0
   */
  (p: QuadraticPath2d, a: Affine2d): QuadraticPath2d
  /**
   * Applies an `Affine2d` transform to every curve in a `QuadraticPath2d`.
   *
   * @param a - The affine transform.
   * @returns A function that takes a `QuadraticPath2d` and returns the transformed path.
   * @since 2.0.0
   */
  (a: Affine2d): (p: QuadraticPath2d) => QuadraticPath2d
} = internal.transform
