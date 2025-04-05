import type { LinearCurve2d } from '../curve/linear2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { LinearPath2dTypeId } from './linear2d.internal'
import * as internal from './linear2d.internal'

/**
 * A linear path in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface LinearPath2d extends Pipeable, Iterable<LinearCurve2d> {
  readonly [LinearPath2dTypeId]: LinearPath2dTypeId
}

/**
 * Creates a new `LinearPath2d` instance from curve parameters.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `LinearPath2d` instance.
 * @since 1.0.0
 */
export const fromCurves: (...curves: ReadonlyArray<LinearCurve2d>) => LinearPath2d =
  internal.fromCurves

/**
 * Creates a new `LinearPath2d` instance from an array of curves.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `LinearPath2d` instance.
 * @since 1.0.0
 */
export const fromCurveArray: (curves: ReadonlyArray<LinearCurve2d>) => LinearPath2d =
  internal.fromCurveArray

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
