import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type { Vector4 } from '../vector/vector4'
import * as internal from './cubic.internal'
import type { CubicPolynomialTypeId } from './cubic.internal.circular'
import type { Monotonicity } from './monotonicity'
import type { QuadraticPolynomial } from './quadratic'
import type { ZeroToThree, ZeroToTwo } from './types'

/**
 * A cubic polynomial.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface CubicPolynomial extends Pipeable {
  readonly [CubicPolynomialTypeId]: CubicPolynomialTypeId

  /**
   * The coefficient of the x^0 term.
   */
  readonly c0: number
  /**
   * The coefficient of the x^1 term.
   */
  readonly c1: number
  /**
   * The coefficient of the x^2 term.
   */
  readonly c2: number
  /**
   * The coefficient of the x^3 term.
   */
  readonly c3: number
}

/**
 * Checks if a value is a `CubicPolynomial`.
 *
 * @param value - The value to check.
 * @returns `true` if the value is a `CubicPolynomial`, `false` otherwise.
 * @since 1.0.0
 */
export const isCubicPolynomial: (value: unknown) => value is CubicPolynomial =
  internal.isCubicPolynomial

/**
 * Creates a new `CubicPolynomial` instance.
 *
 * @param c0 - The coefficient of the x^0 term.
 * @param c1 - The coefficient of the x^1 term.
 * @param c2 - The coefficient of the x^2 term.
 * @param c3 - The coefficient of the x^3 term.
 */
export const make: (c0: number, c1: number, c2: number, c3: number) => CubicPolynomial =
  internal.make

/**
 * Creates a new `CubicPolynomial` instance from a vector.
 *
 * @param v - The vector to convert.
 * @returns A new `CubicPolynomial` instance.
 * @since 1.0.0
 */
export const fromVector: (v: Vector4) => CubicPolynomial = internal.fromVector

export const solve: {
  /**
   * Solves a cubic polynomial for a given value of x.
   *
   * @param p - The cubic polynomial to solve.
   * @param x - The value of x to solve for.
   * @returns The result of the polynomial evaluation at x.
   * @since 1.0.0
   */
  (p: CubicPolynomial, x: number): number
  /**
   * Solves a cubic polynomial for a given value of x.
   *
   * @param x - The value of x to solve for.
   * @returns A function that takes a cubic polynomial and returns the result of the polynomial evaluation at x.
   * @since 1.0.0
   */
  (x: number): (p: CubicPolynomial) => number
} = internal.solve

/**
 * Converts a cubic polynomial to a solver function.
 *
 * @param p - The cubic polynomial to convert.
 * @returns A function that takes a value of x and returns the result of the polynomial evaluation at x.
 * @since 1.0.0
 */
export const toSolver: (p: CubicPolynomial) => (x: number) => number = internal.toSolver

export const solveInverse: {
  /**
   * Solves a cubic polynomial for a given value of y.
   *
   * @param p - The cubic polynomial to solve.
   * @param y - The value of y to solve for.
   * @returns The roots of the polynomial equation p(x) = y.
   * @since 1.0.0
   */
  (p: CubicPolynomial, y: number): ZeroToThree
  /**
   * Solves a cubic polynomial for a given value of y.
   *
   * @param y - The value of y to solve for.
   * @returns A function that takes a cubic polynomial and returns the roots of the polynomial equation p(x) = y.
   * @since 1.0.0
   */
  (y: number): (p: CubicPolynomial) => ZeroToThree
} = internal.solveInverse

/**
 * Converts a cubic polynomial to an inverse solver function.
 *
 * @param p - The cubic polynomial to convert.
 * @returns A function that takes a value of y and returns the roots of the polynomial equation p(x) = y.
 * @since 1.0.0
 */
export const toInverseSolver: (p: CubicPolynomial) => (y: number) => ZeroToThree =
  internal.toInverseSolver

/**
 * Calculates the derivative of a cubic polynomial.
 *
 * @param p - The cubic polynomial to differentiate.
 * @returns The derivative of the cubic polynomial.
 * @since 1.0.0
 */
export const derivative: (p: CubicPolynomial) => QuadraticPolynomial = internal.derivative

/**
 * Calculates the roots of a cubic polynomial.
 *
 * @param p - The cubic polynomial to find the roots of.
 * @returns The roots of the cubic polynomial.
 * @since 1.0.0
 */
export const roots: (p: CubicPolynomial) => ZeroToThree = internal.roots

/**
 * Calculates the extrema of a cubic polynomial.
 *
 * @param p - The cubic polynomial to find the extrema of.
 * @returns The extrema of the cubic polynomial.
 * @since 1.0.0
 */
export const extrema: (p: CubicPolynomial) => ZeroToTwo = internal.extrema

export const monotonicity: {
  /**
   * Calculates the monotonicity of a cubic polynomial.
   *
   * @param p - The cubic polynomial to analyze.
   * @param i - The interval to restrict the analysis to.
   * @returns The monotonicity of the cubic polynomial in the specified interval.
   * @since 1.0.0
   */
  (p: CubicPolynomial, i?: Interval): Monotonicity
  /**
   * Calculates the monotonicity of a cubic polynomial.
   *
   * @param i - The interval to restrict the analysis to.
   * @returns A function that takes a cubic polynomial and returns the monotonicity of the cubic polynomial in the specified interval.
   * @since 1.0.0
   */
  (i: Interval): (p: CubicPolynomial) => Monotonicity
} = internal.monotonicity

export const domain: {
  /**
   * Calculates the domain of a cubic polynomial.
   *
   * @param p - The cubic polynomial to analyze.
   * @param range - The range to restrict the analysis to.
   * @returns The domain of the cubic polynomial in the specified range.
   * @since 1.0.0
   */
  (p: CubicPolynomial, range: Interval): Interval
  /**
   * Calculates the domain of a cubic polynomial.
   *
   * @param range - The range to restrict the analysis to.
   * @returns A function that takes a cubic polynomial and returns the domain of the cubic polynomial in the specified range.
   * @since 1.0.0
   */
  (range: Interval): (p: CubicPolynomial) => Interval
} = internal.domain

export const range: {
  /**
   * Calculates the range of a cubic polynomial.
   *
   * @param p - The cubic polynomial to analyze.
   * @param domain - The domain to restrict the analysis to.
   * @returns The range of the cubic polynomial in the specified domain.
   * @since 1.0.0
   */
  (p: CubicPolynomial, domain: Interval): Interval
  /**
   * Calculates the range of a cubic polynomial.
   *
   * @param domain - The domain to restrict the analysis to.
   * @returns A function that takes a cubic polynomial and returns the range of the cubic polynomial in the specified domain.
   * @since 1.0.0
   */
  (domain: Interval): (p: CubicPolynomial) => Interval
} = internal.range

export const length: {
  /**
   * Calculates the length of a cubic polynomial.
   *
   * @param p - The cubic polynomial to analyze.
   * @param domain - The domain to restrict the analysis to.
   * @returns The length of the cubic polynomial in the specified domain.
   * @since 1.0.0
   */
  (p: CubicPolynomial, domain: Interval): number
  /**
   * Calculates the length of a cubic polynomial.
   *
   * @param domain - The domain to restrict the analysis to.
   * @returns A function that takes a cubic polynomial and returns the length of the cubic polynomial in the specified domain.
   * @since 1.0.0
   */
  (domain: Interval): (p: CubicPolynomial) => number
} = internal.length

export const curvature: {
  /**
   * Calculates the curvature of a cubic polynomial.
   *
   * @param p - The cubic polynomial to analyze.
   * @param x - The value of x to calculate the curvature at.
   * @returns The curvature of the cubic polynomial at the specified value of x.
   * @since 1.0.0
   */
  (p: CubicPolynomial, x: number): number
  /**
   * Calculates the curvature of a cubic polynomial.
   *
   * @param x - The value of x to calculate the curvature at.
   * @returns A function that takes a cubic polynomial and returns the curvature of the cubic polynomial at the specified value of x.
   * @since 1.0.0
   */
  (x: number): (p: CubicPolynomial) => number
} = internal.curvature
