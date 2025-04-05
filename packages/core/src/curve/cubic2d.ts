import type { TwoDimensional } from '../dimensions'
import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type { CubicPolynomial } from '../polynomial/cubic'
import type { Vector2 } from '../vector/vector2'
import type { CubicCurve2dTypeId } from './cubic2d.internal'
import * as internal from './cubic2d.internal'

/**
 * A cubic curve in 2D space.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface CubicCurve2d extends Pipeable, TwoDimensional<CubicPolynomial> {
  readonly [CubicCurve2dTypeId]: CubicCurve2dTypeId
}

/**
 * Creates a new `CubicCurve2d` instance from polynomial parameters.
 *
 * @param x - The x polynomial.
 * @param y - The y polynomial.
 * @returns A new `CubicCurve2d` instance.
 * @since 1.0.0
 */
export const fromPolynomials: (x: CubicPolynomial, y: CubicPolynomial) => CubicCurve2d =
  internal.fromPolynomials

/**
 * Creates a new `CubicCurve2d` instance from pairs of coefficients.
 *
 * @param p0 - The x^0 coefficients for the x and y polynomials.
 * @param p1 - The x^1 coefficients for the x and y polynomials.
 * @param p2 - The x^2 coefficients for the x and y polynomials.
 * @param p3 - The x^3 coefficients for the x and y polynomials.
 * @returns A new `CubicCurve2d` instance.
 * @since 1.0.0
 */
export const fromPoints: (p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) => CubicCurve2d =
  internal.fromPoints

/**
 * Checks if a value is a `CubicCurve2d`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `CubicCurve2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isCubicCurve2d: (c: unknown) => c is CubicCurve2d = internal.isCubicCurve2d

export const solve: {
  /**
   * Solves the cubic curve for a given parameter t.
   *
   * @param t - The parameter value.
   * @returns A function that takes a cubic curve and returns the point on the curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: CubicCurve2d) => Vector2
  /**
   * Solves the cubic curve for a given parameter t.
   *
   * @param c - The cubic curve to solve.
   * @param t - The parameter value.
   * @returns The point on the curve at parameter t.
   * @since 1.0.0
   */
  (c: CubicCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  /**
   * Calculates (approximates) the length of a cubic curve.
   *
   * @param c - The cubic curve to calculate the length of.
   * @param i - The interval over which to calculate the length.
   * @returns The length of the cubic curve.
   * @since 1.0.0
   */
  (c: CubicCurve2d, i: Interval): number
  /**
   * Calculates (approximates) the length of a cubic curve.
   *
   * @param i - The interval over which to calculate the length.
   * @returns A function that takes a cubic curve and returns the length of the cubic curve.
   * @since 1.0.0
   */
  (i: Interval): (c: CubicCurve2d) => number
} = internal.length

export const curvature: {
  /**
   * Calculates the curvature of a cubic curve at a given parameter.
   *
   * @param c - The cubic curve to calculate the curvature for.
   * @param t - The parameter value.
   * @returns The curvature of the cubic curve at parameter t.
   * @since 1.0.0
   */
  (c: CubicCurve2d, t: number): number
  /**
   * Calculates the curvature of a cubic curve at a given parameter.
   *
   * @param t - The parameter value.
   * @returns A function that takes a cubic curve and returns the curvature of the cubic curve at parameter t.
   * @since 1.0.0
   */
  (t: number): (c: CubicCurve2d) => number
} = internal.curvature
