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
 * Creates a new `LinearCurve2d` instance from monomial coefficient vectors.
 *
 * Each argument bundles the per-axis coefficient at the given power: `c0`
 * holds the x⁰ term, `c1` holds the x¹ term. The resulting curve evaluates to
 * `c0 + c1·t` per axis.
 *
 * @param c0 - The x⁰ coefficients (x and y).
 * @param c1 - The x¹ coefficients (x and y).
 * @returns A new `LinearCurve2d` instance.
 * @since 2.0.0
 */
export const fromCoefficients: (c0: Vector2, c1: Vector2) => LinearCurve2d =
  internal.fromCoefficients

/**
 * Creates a new `LinearCurve2d` instance from a pair of endpoints.
 *
 * `p0` is the curve at `t = 0`, `p1` is the curve at `t = 1`. The
 * implementation converts to the curve's internal monomial form (slope-form
 * polynomial in `t`) in closed form.
 *
 * @param p0 - The curve's start point.
 * @param p1 - The curve's end point.
 * @returns A new `LinearCurve2d` instance whose curve matches the line from `p0` to `p1`.
 * @since 2.0.0
 */
export const fromBezierPoints: (p0: Vector2, p1: Vector2) => LinearCurve2d =
  internal.fromBezierPoints

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
