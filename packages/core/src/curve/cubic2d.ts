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
 * Creates a new `CubicCurve2d` instance from monomial coefficient vectors.
 *
 * Each argument bundles the per-axis coefficient at the given power: `c0`
 * holds the x⁰ term, `c1` holds the x¹ term, and so on. The resulting curve
 * evaluates to `c0 + c1·t + c2·t² + c3·t³` per axis.
 *
 * @param c0 - The x⁰ coefficients (x and y).
 * @param c1 - The x¹ coefficients (x and y).
 * @param c2 - The x² coefficients (x and y).
 * @param c3 - The x³ coefficients (x and y).
 * @returns A new `CubicCurve2d` instance.
 * @since 2.0.0
 */
export const fromCoefficients: (
  c0: Vector2,
  c1: Vector2,
  c2: Vector2,
  c3: Vector2,
) => CubicCurve2d = internal.fromCoefficients

/**
 * Creates a new `CubicCurve2d` instance from cubic Bézier control points.
 *
 * The four arguments are the Bernstein-basis control points: `p0` and `p3` are
 * the curve's endpoints and `p1` and `p2` are the off-curve control handles.
 * The implementation converts to the curve's internal monomial form in closed
 * form.
 *
 * @param p0 - The first control point (curve start).
 * @param p1 - The second control point (start handle).
 * @param p2 - The third control point (end handle).
 * @param p3 - The fourth control point (curve end).
 * @returns A new `CubicCurve2d` instance whose curve matches the given Bézier.
 * @since 2.0.0
 */
export const fromBezierPoints: (
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
) => CubicCurve2d = internal.fromBezierPoints

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
