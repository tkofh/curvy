import type { CubicCurve2d } from '../curve/cubic2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { CubicPath2dTypeId } from './cubic2d.internal'
import * as internal from './cubic2d.internal'

/**
 * A cubic path in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface CubicPath2d extends Pipeable, Iterable<CubicCurve2d> {
  readonly [CubicPath2dTypeId]: CubicPath2dTypeId
}

/**
 * Creates a new `CubicPath2d` instance from curve parameters.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `CubicPath2d` instance.
 * @since 1.0.0
 */
export const fromCurves: (...curves: ReadonlyArray<CubicCurve2d>) => CubicPath2d =
  internal.fromCurves

/**
 * Creates a new `CubicPath2d` instance from an array of curves.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `CubicPath2d` instance.
 * @since 1.0.0
 */
export const fromCurveArray: (curves: ReadonlyArray<CubicCurve2d>) => CubicPath2d =
  internal.fromCurveArray

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
