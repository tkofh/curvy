import type { QuadraticCurve2d } from '../curve/quadratic2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { QuadraticPath2dTypeId } from './quadratic2d.internal'
import * as internal from './quadratic2d.internal'

/**
 * A quadratic path in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface QuadraticPath2d extends Pipeable, Iterable<QuadraticCurve2d> {
  readonly [QuadraticPath2dTypeId]: QuadraticPath2dTypeId
}

/**
 * Creates a new `QuadraticPath2d` instance from curve parameters.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `QuadraticPath2d` instance.
 * @since 1.0.0
 */
export const fromCurves: (...curves: ReadonlyArray<QuadraticCurve2d>) => QuadraticPath2d =
  internal.fromCurves

/**
 * Creates a new `QuadraticPath2d` instance from an array of curves.
 *
 * @param curves - The curves to create the path from.
 * @returns A new `QuadraticPath2d` instance.
 * @since 1.0.0
 */
export const fromCurveArray: (curves: ReadonlyArray<QuadraticCurve2d>) => QuadraticPath2d =
  internal.fromCurveArray

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
 * Calculates the length of a quadratic path.
 *
 * @param p - The quadratic path to calculate the length of.
 * @returns The length of the path.
 */
export const length: (p: QuadraticPath2d) => number = internal.length

export const solve: {
  /**
   * Solves a quadratic path at a given parameter.
   *
   * @param u - The parameter to solve for.
   * @returns A function that takes a quadratic path and returns the solved point.
   * @since 1.0.0
   */
  (u: number): (p: QuadraticPath2d) => Vector2
  /**
   * Solves a quadratic path at a given parameter.
   *
   * @param p - The quadratic path to solve.
   * @param u - The parameter to solve for.
   * @returns The solved point.
   * @since 1.0.0
   */
  (p: QuadraticPath2d, u: number): Vector2
} = internal.solve
