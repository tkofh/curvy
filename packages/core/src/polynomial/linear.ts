import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import * as internal from './linear.internal'
import type { LinearPolynomialTypeId } from './linear.internal'
import type { GuaranteedMonotonicity } from './monotonicity'
import type { QuadraticPolynomial } from './quadratic'
import type { ZeroOrOne } from './types'

/**
 * A linear polynomial.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface LinearPolynomial extends Pipeable {
  readonly [LinearPolynomialTypeId]: LinearPolynomialTypeId

  /**
   * The coefficient of the x^0 term.
   */
  readonly c0: number

  /**
   * The coefficient of the x^1 term.
   */
  readonly c1: number
}

/**
 * Checks if a value is a `LinearPolynomial`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `LinearPolynomial`, `false` otherwise.
 * @since 1.0.0
 */
export const isLinearPolynomial: (v: unknown) => v is LinearPolynomial = internal.isLinearPolynomial

/**
 * Creates a new `LinearPolynomial` instance.
 *
 * @param c0 - The coefficient of the x^0 term. Defaults to 0.
 * @param c1 - The coefficient of the x^1 term. Defaults to 0.
 * @returns A new `LinearPolynomial` instance.
 * @since 1.0.0
 */
export const make: (c0?: number, c1?: number) => LinearPolynomial = internal.make

/**
 * Creates a new `LinearPolynomial` instance from a vector.
 *
 * @param v - The vector to create the polynomial from.
 * @returns A new `LinearPolynomial` instance.
 * @since 1.0.0
 */
export const fromVector: (v: Vector2) => LinearPolynomial = internal.fromVector

/**
 * Creates a new `LinearPolynomial` instance from a point and slope.
 *
 * @param p - The point on the line.
 * @param slope - The slope of the line.
 * @returns A new `LinearPolynomial` instance.
 * @since 1.0.0
 */
export const fromPointSlope: (p: Vector2, slope: number) => LinearPolynomial =
  internal.fromPointSlope

/**
 * Creates a new `LinearPolynomial` instance from two points.
 *
 * @param p1 - The first point.
 * @param p2 - The second point.
 * @returns A new `LinearPolynomial` instance.
 * @since 1.0.0
 */
export const fromPoints: (p1: Vector2, p2: Vector2) => LinearPolynomial = internal.fromPoints

export const solve: {
  /**
   * Solves a linear polynomial for a given value of x.
   *
   * @param p - The linear polynomial to solve.
   * @param x - The value of x to solve for.
   * @returns The result of the polynomial evaluated at x.
   * @since 1.0.0
   */
  (p: LinearPolynomial, x: number): number
  /**
   * Solves a linear polynomial for a given value of x.
   *
   * @param x - The value of x to solve for.
   * @returns A function that takes a `LinearPolynomial` and returns the result of the polynomial evaluated at x.
   * @since 1.0.0
   */
  (x: number): (p: LinearPolynomial) => number
} = internal.solve

/**
 * Converts a linear polynomial to a solver function.
 *
 * @param p - The linear polynomial to convert.
 * @returns A function that takes a value of x and returns the result of the polynomial evaluated at x.
 * @since 1.0.0
 */
export const toSolver: (p: LinearPolynomial) => (x: number) => number = internal.toSolver

export const solveInverse: {
  /**
   * Solves a linear polynomial for a given value of y.
   *
   * @param p - The linear polynomial to solve.
   * @param y - The value of y to solve for.
   * @returns The roots of the polynomial equation p(x) = y.
   * @since 1.0.0
   */
  (p: LinearPolynomial, y: number): ZeroOrOne
  /**
   * Solves a linear polynomial for a given value of y.
   *
   * @param y - The value of y to solve for.
   * @returns A function that takes a `LinearPolynomial` and returns the roots of the polynomial equation p(x) = y.
   * @since 1.0.0
   */
  (y: number): (p: LinearPolynomial) => ZeroOrOne
} = internal.solveInverse

/**
 * Converts a linear polynomial to an inverse solver function.
 *
 * @param p - The linear polynomial to convert.
 * @returns A function that takes a value of y and returns the roots of the polynomial equation p(x) = y.
 * @since 1.0.0
 */
export const toInverseSolver: (p: LinearPolynomial) => (y: number) => ZeroOrOne =
  internal.toInverseSolver

/**
 * Finds the roots of a linear polynomial.
 *
 * @param p - The linear polynomial to find the roots of.
 * @returns The roots of the polynomial equation p(x) = 0.
 * @since 1.0.0
 */
export const root: (p: LinearPolynomial) => ZeroOrOne = (p) => internal.solveInverse(p, 0)

/**
 * Calculates the monotonicity of a linear polynomial.
 *
 * @param p - The linear polynomial to check.
 * @returns The guaranteed monotonicity of the polynomial.
 * @since 1.0.0
 */
export const monotonicity: (p: LinearPolynomial) => GuaranteedMonotonicity = internal.monotonicity

/**
 * Calculates the derivative of a linear polynomial.
 *
 * @param p - The linear polynomial to differentiate.
 * @returns The derivative of the linear polynomial.
 * @since 1.0.0
 */
export const derivative: (p: LinearPolynomial) => number = internal.derivative

export const antiderivative: {
  /**
   * Calculates the antiderivative of a linear polynomial.
   *
   * @param p - The linear polynomial to integrate.
   * @param constant - The constant of integration. Defaults to 0.
   * @returns The antiderivative of the linear polynomial.
   * @since 1.0.0
   */
  (p: LinearPolynomial, constant?: number): QuadraticPolynomial
  /**
   * Calculates the antiderivative of a linear polynomial.
   *
   * @param constant - The constant of integration. Defaults to 0.
   * @returns A function that takes a `LinearPolynomial` and returns the antiderivative of the polynomial.
   * @since 1.0.0
   */
  (constant: number): (p: LinearPolynomial) => QuadraticPolynomial
} = internal.antiderivative

export const domain: {
  /**
   * Calculates the domain of a linear polynomial.
   *
   * @param p - The linear polynomial to check.
   * @param range - The range to check against.
   * @returns The domain of the polynomial within the given range.
   * @since 1.0.0
   */
  (p: LinearPolynomial, range: Interval): ZeroOrOne<Interval>
  /**
   * Calculates the domain of a linear polynomial.
   *
   * @param range - The range to check against.
   * @returns A function that takes a `LinearPolynomial` and returns the domain of the polynomial within the given range.
   * @since 1.0.0
   */
  (range: Interval): (p: LinearPolynomial) => ZeroOrOne<Interval>
} = internal.domain

export const range: {
  /**
   * Calculates the range of a linear polynomial.
   *
   * @param p - The linear polynomial to check.
   * @param domain - The domain to check against.
   * @returns The range of the polynomial within the given domain.
   * @since 1.0.0
   */
  (p: LinearPolynomial, domain: Interval): Interval
  /**
   * Calculates the range of a linear polynomial.
   *
   * @param domain - The domain to check against.
   * @returns A function that takes a `LinearPolynomial` and returns the range of the polynomial within the given domain.
   * @since 1.0.0
   */
  (domain: Interval): (p: LinearPolynomial) => Interval
} = internal.range

export const length: {
  /**
   * Calculates the length of a linear polynomial within a particular domain `Interval`.
   *
   * @param p - The linear polynomial to analyze.
   * @param domain - The domain to restrict the analysis to.
   * @returns The length of the linear polynomial in the specified domain.
   * @since 1.0.0
   */
  (p: LinearPolynomial, domain: Interval): number
  /**
   * Calculates the length of a linear polynomial within a particular domain `Interval`.
   *
   * @param domain - The domain to restrict the analysis to.
   * @returns A function that takes a `LinearPolynomial` and returns the length of the polynomial in the specified domain.
   * @since 1.0.0
   */
  (domain: Interval): (p: LinearPolynomial) => number
} = internal.length
