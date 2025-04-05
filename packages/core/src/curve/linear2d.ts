import type { TwoDimensional } from '../dimensions'
import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type { LinearPolynomial } from '../polynomial/linear'
import type { Vector2 } from '../vector/vector2'
import type { LinearCurve2dTypeId } from './linear2d.internal'
import * as internal from './linear2d.internal'

/**
 * A linear curve in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface LinearCurve2d extends Pipeable, TwoDimensional<LinearPolynomial> {
  readonly [LinearCurve2dTypeId]: LinearCurve2dTypeId
}

/**
 * Creates a new `LinearCurve2d` instance from polynomial parameters.
 *
 * @param x - The x polynomial.
 * @param y - The y polynomial.
 * @returns A new `LinearCurve2d` instance.
 * @since 1.0.0
 */
export const fromPolynomials: (x: LinearPolynomial, y: LinearPolynomial) => LinearCurve2d =
  internal.fromPolynomials

/**
 * Creates a new `LinearCurve2d` instance from pairs of coefficients.
 *
 * @param p0 - The x^0 coefficients for the x and y polynomials.
 * @param p1 - The x^1 coefficients for the x and y polynomials.
 */
export const fromPoints: (p0: Vector2, p1: Vector2) => LinearCurve2d = internal.fromPoints

/**
 * Checks if a value is a `LinearCurve2d`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `LinearCurve2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isLinearCurve2d: (c: unknown) => c is LinearCurve2d = internal.isLinearCurve2d

/**
 * Gets the derivative of a linear curve as a vector
 *
 * @param c - The linear curve to get the derivative of.
 * @returns The derivative of the linear curve as a vector.
 * @since 1.0.0
 */
export const derivative: (c: LinearCurve2d) => Vector2 = internal.derivative

export const solve: {
  /**
   * Solves the linear curve for a given parameter t.
   *
   * @param t - The parameter value.
   * @returns A function that takes a linear curve and returns the point on the curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: LinearCurve2d) => Vector2
  /**
   * Solves the linear curve for a given parameter t.
   *
   * @param c - The linear curve to solve.
   * @param t - The parameter value.
   * @returns The point on the curve at parameter t.
   * @since 1.0.0
   */
  (c: LinearCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  /**
   * Calculates (approximates) the length of a linear curve.
   *
   * @param c - The linear curve to calculate the length of.
   * @param i - The interval to calculate the length over.
   * @returns The length of the linear curve over the given interval.
   * @since 1.0.0
   */
  (c: LinearCurve2d, i: Interval): number
  /**
   * Calculates (approximates) the length of a linear curve.
   *
   * @param i - The interval to calculate the length over.
   * @returns A function that takes a linear curve and returns the length of the linear curve over the given interval.
   * @since 1.0.0
   */
  (i: Interval): (c: LinearCurve2d) => number
} = internal.length
