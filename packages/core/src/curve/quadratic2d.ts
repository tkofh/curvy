import type { TwoDimensional } from '../dimensions'
import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type { QuadraticPolynomial } from '../polynomial/quadratic'
import type { Vector2 } from '../vector/vector2'
import type { LinearCurve2d } from './linear2d'
import type { QuadraticCurve2dTypeId } from './quadratic2d.internal'
import * as internal from './quadratic2d.internal'

/**
 * A quadratic curve in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface QuadraticCurve2d extends Pipeable, TwoDimensional<QuadraticPolynomial> {
  readonly [QuadraticCurve2dTypeId]: QuadraticCurve2dTypeId
}

/**
 * Creates a new `QuadraticCurve2d` instance from polynomial parameters.
 *
 * @param c0 - The x polynomial.
 * @param c1 - The y polynomial.
 * @returns A new `QuadraticCurve2d` instance.
 * @since 1.0.0
 */
export const fromPolynomials: (
  c0: QuadraticPolynomial,
  c1: QuadraticPolynomial,
) => QuadraticCurve2d = internal.fromPolynomials

/**
 * Creates a new `QuadraticCurve2d` instance from pairs of coefficients.
 *
 * @param p0 - The x^0 coefficients for the x and y polynomials.
 * @param p1 - The x^1 coefficients for the x and y polynomials.
 * @param p2 - The x^2 coefficients for the x and y polynomials.
 * @returns A new `QuadraticCurve2d` instance.
 * @since 1.0.0
 */
export const fromPoints: (p0: Vector2, p1: Vector2, p2: Vector2) => QuadraticCurve2d =
  internal.fromPoints

/**
 * Checks if a value is a `QuadraticCurve2d`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `QuadraticCurve2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isQuadraticCurve2d: (c: unknown) => c is QuadraticCurve2d = internal.isQuadraticCurve2d

export const solve: {
  /**
   * Solves the quadratic curve for a given parameter t.
   *
   * @param t - The parameter value.
   * @returns A function that takes a quadratic curve and returns the point on the curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: QuadraticCurve2d) => Vector2
  /**
   * Solves the quadratic curve for a given parameter t.
   *
   * @param c - The quadratic curve to solve.
   * @param t - The parameter value.
   * @returns The point on the curve at parameter t.
   * @since 1.0.0
   */
  (c: QuadraticCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  /**
   * Computes the length of the quadratic curve over a given interval.
   *
   * @param c - The quadratic curve to compute the length of.
   * @param i - The interval over which to compute the length.
   * @returns The length of the quadratic curve over the interval.
   * @since 1.0.0
   */
  (c: QuadraticCurve2d, i: Interval): number
  /**
   * Computes the length of the quadratic curve over a given interval.
   *
   * @param i - The interval over which to compute the length.
   * @returns A function that takes a quadratic curve and returns the length of the curve over the interval.
   * @since 1.0.0
   */
  (i: Interval): (c: QuadraticCurve2d) => number
} = internal.length

/**
 * Computes the derivative of a quadratic curve.
 *
 * @param c - The quadratic curve to compute the derivative of.
 * @returns The derivative of the quadratic curve as a linear curve.
 * @since 1.0.0
 */
export const derivative: (c: QuadraticCurve2d) => LinearCurve2d = internal.derivative

export const curvature: {
  /**
   * Computes the curvature of the quadratic curve at a given parameter t.
   *
   * @param c - The quadratic curve to compute the curvature for.
   * @param t - The parameter value.
   * @returns The curvature of the quadratic curve at parameter t.
   * @since 1.0.0
   */
  (c: QuadraticCurve2d, t: number): number
  /**
   * Computes the curvature of the quadratic curve at a given parameter t.
   *
   * @param t - The parameter value.
   * @returns A function that takes a quadratic curve and returns the curvature of the curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: QuadraticCurve2d) => number
} = internal.curvature
