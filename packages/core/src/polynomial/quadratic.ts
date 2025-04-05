import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { Vector3 } from '../vector/vector3'
import type { CubicPolynomial } from './cubic'
import type { LinearPolynomial } from './linear'
import type { Monotonicity } from './monotonicity'
import * as internal from './quadratic.internal'
import type { QuadraticPolynomialTypeId } from './quadratic.internal.circular'
import type { ZeroOrOne, ZeroToTwo } from './types'

/**
 * A quadratic polynomial.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface QuadraticPolynomial extends Pipeable {
  readonly [QuadraticPolynomialTypeId]: QuadraticPolynomialTypeId

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
}

/**
 * Checks if a value is a `QuadraticPolynomial`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `QuadraticPolynomial`, `false` otherwise.
 * @since 1.0.0
 */
export const isQuadraticPolynomial: (v: unknown) => v is QuadraticPolynomial =
  internal.isQuadraticPolynomial

/**
 * Creates a new `QuadraticPolynomial` instance.
 *
 * @param c0 - The coefficient of the x^0 term. Defaults to 0.
 * @param c1 - The coefficient of the x^1 term. Defaults to 0.
 * @param c2 - The coefficient of the x^2 term. Defaults to 1.
 * @returns A new `QuadraticPolynomial` instance.
 * @since 1.0.0
 */
export const make: (c0?: number, c1?: number, c2?: number) => QuadraticPolynomial = internal.make

/**
 * Creates a new `QuadraticPolynomial` instance from a vector.
 *
 * @param v - The vector to create the polynomial from.
 * @returns A new `QuadraticPolynomial` instance.
 * @since 1.0.0
 */
export const fromVector: (v: Vector3) => QuadraticPolynomial = internal.fromVector

export const solve: {
  /**
   * Solves the quadratic polynomial for a given x value.
   *
   * @param p - The quadratic polynomial.
   * @param x - The x value to solve for.
   * @returns The result of the polynomial at the given x value.
   */
  (p: QuadraticPolynomial, x: number): number
  /**
   * Solves the quadratic polynomial for a given x value.
   *
   * @param x - The x value to solve for.
   * @returns A function that takes a quadratic polynomial and returns the result of the polynomial at the given x value.
   */
  (x: number): (p: QuadraticPolynomial) => number
} = internal.solve

/**
 * Creates a solver function for the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns A function that takes an x value and returns the result of the polynomial at that x value.
 */
export const toSolver: (p: QuadraticPolynomial) => (x: number) => number = internal.toSolver

export const solveInverse: {
  /**
   * Solves the quadratic polynomial for a given y value.
   *
   * @param p - The quadratic polynomial.
   * @param y - The y value to solve for.
   * @returns The solutions to the polynomial at the given y value.
   */
  (p: QuadraticPolynomial, y: number): ZeroToTwo
  /**
   * Solves the quadratic polynomial for a given y value.
   *
   * @param y - The y value to solve for.
   * @returns A function that takes a quadratic polynomial and returns the solutions to the polynomial at the given y value.
   */
  (y: number): (p: QuadraticPolynomial) => ZeroToTwo
} = internal.solveInverse

/**
 * Creates an inverse solver function for the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns A function that takes a y value and returns the solutions to the polynomial at that y value.
 */
export const toInverseSolver: (p: QuadraticPolynomial) => (y: number) => ZeroToTwo =
  internal.toInverseSolver

/**
 * Computes the derivative of the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns The derivative of the polynomial as a linear polynomial.
 * @since 1.0.0
 */
export const derivative: (p: QuadraticPolynomial) => LinearPolynomial = internal.derivative

/**
 * Finds the roots of the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns The roots of the polynomial as a tuple of solutions.
 * @since 1.0.0
 */
export const roots: (p: QuadraticPolynomial) => ZeroToTwo = internal.roots

/**
 * Finds the extreme point of the quadratic polynomial.
 *
 * @param p - The quadratic polynomial.
 * @returns The extreme point of the polynomial as a solution.
 * @since 1.0.0
 */
export const extreme: (p: QuadraticPolynomial) => ZeroOrOne<Vector2> = internal.extreme

export const monotonicity: {
  /**
   * Computes the monotonicity of the quadratic polynomial over a given interval.
   *
   * @param p - The quadratic polynomial.
   * @param i - The interval to compute the monotonicity over.
   * @returns The monotonicity of the polynomial over the interval.
   */
  (p: QuadraticPolynomial, i?: Interval): Monotonicity
  /**
   * Computes the monotonicity of the quadratic polynomial over a given interval.
   *
   * @param i - The interval to compute the monotonicity over.
   * @returns A function that takes a quadratic polynomial and returns the monotonicity of the polynomial over the interval.
   */
  (i: Interval): (p: QuadraticPolynomial) => Monotonicity
} = internal.monotonicity

export const antiderivative: {
  /**
   * Computes the antiderivative of the quadratic polynomial.
   *
   * @param p - The quadratic polynomial.
   * @param constant - The constant of integration. Defaults to 0.
   * @returns The antiderivative of the polynomial as a cubic polynomial.
   */
  (p: QuadraticPolynomial, constant?: number): CubicPolynomial
  /**
   * Computes the antiderivative of the quadratic polynomial.
   *
   * @param constant - The constant of integration. Defaults to 0.
   * @returns A function that takes a quadratic polynomial and returns the antiderivative of the polynomial as a cubic polynomial.
   */
  (constant: number): (p: QuadraticPolynomial) => CubicPolynomial
} = internal.antiderivative

export const domain: {
  /**
   * Computes the domain of the quadratic polynomial over a given range.
   *
   * @param p - The quadratic polynomial.
   * @param range - The range to compute the domain over.
   * @returns The domain of the polynomial over the range.
   */
  (p: QuadraticPolynomial, range: Interval): Interval | null
  /**
   * Computes the domain of the quadratic polynomial over a given range.
   *
   * @param range - The range to compute the domain over.
   * @returns A function that takes a quadratic polynomial and returns the domain of the polynomial over the range.
   */
  (range: Interval): (p: QuadraticPolynomial) => Interval | null
} = internal.domain

export const range: {
  /**
   * Computes the range of the quadratic polynomial over a given domain.
   *
   * @param p - The quadratic polynomial.
   * @param domain - The domain to compute the range over.
   * @returns The range of the polynomial over the domain.
   */
  (p: QuadraticPolynomial, domain: Interval): Interval
  /**
   * Computes the range of the quadratic polynomial over a given domain.
   *
   * @param domain - The domain to compute the range over.
   * @returns A function that takes a quadratic polynomial and returns the range of the polynomial over the domain.
   */
  (domain: Interval): (p: QuadraticPolynomial) => Interval
} = internal.range

export const length: {
  /**
   * Computes the length of the quadratic polynomial over a given interval.
   *
   * @param p - The quadratic polynomial.
   * @param i - The interval to compute the length over.
   * @returns The length of the polynomial over the interval.
   */
  (p: QuadraticPolynomial, i: Interval): number
  /**
   * Computes the length of the quadratic polynomial over a given interval.
   *
   * @param i - The interval to compute the length over.
   * @returns A function that takes a quadratic polynomial and returns the length of the polynomial over the interval.
   */
  (i: Interval): (p: QuadraticPolynomial) => number
} = internal.length

export const curvature: {
  /**
   * Computes the curvature of the quadratic polynomial at a given x value.
   *
   * @param p - The quadratic polynomial.
   * @param x - The x value to compute the curvature at.
   * @returns The curvature of the polynomial at the given x value.
   */
  (p: QuadraticPolynomial, x: number): number
  /**
   * Computes the curvature of the quadratic polynomial at a given x value.
   *
   * @param x - The x value to compute the curvature at.
   * @returns A function that takes a quadratic polynomial and returns the curvature of the polynomial at the given x value.
   */
  (x: number): (p: QuadraticPolynomial) => number
} = internal.curvature
