import type { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import type { Vector3 } from '../vector/vector3'
import type { CubicPolynomial } from './cubic'
import type { LinearPolynomial } from './linear'
import type { Monotonicity } from './monotonicity'
import * as internal from './quadratic.internal'
import type { QuadraticPolynomialTypeId } from './quadratic.internal.circular'
import type { ZeroOrOneSolution, ZeroToTwoSolutions } from './types'

export interface QuadraticPolynomial extends Pipeable {
  readonly [QuadraticPolynomialTypeId]: QuadraticPolynomialTypeId
  readonly c0: number
  readonly c1: number
  readonly c2: number
  readonly precision: number
}

export const isQuadraticPolynomial: (v: unknown) => v is QuadraticPolynomial =
  internal.isQuadraticPolynomial

export const make: (
  c0?: number,
  c1?: number,
  c2?: number,
  precision?: number,
) => QuadraticPolynomial = internal.make

export const fromVector: (
  v: Vector3,
  precision?: number,
) => QuadraticPolynomial = internal.fromVector

export const solve: {
  (p: QuadraticPolynomial, x: number): number
  (x: number): (p: QuadraticPolynomial) => number
} = internal.solve

export const toSolver: (p: QuadraticPolynomial) => (x: number) => number =
  internal.toSolver

export const solveInverse: {
  (p: QuadraticPolynomial, y: number): ZeroToTwoSolutions
  (y: number): (p: QuadraticPolynomial) => ZeroToTwoSolutions
} = internal.solveInverse

export const toInverseSolver: (
  p: QuadraticPolynomial,
) => (y: number) => ZeroToTwoSolutions = internal.toInverseSolver

export const derivative: (p: QuadraticPolynomial) => LinearPolynomial =
  internal.derivative

export const roots: (p: QuadraticPolynomial) => ZeroToTwoSolutions =
  internal.roots

export const extreme: (p: QuadraticPolynomial) => ZeroOrOneSolution =
  internal.extreme

export const monotonicity: {
  (p: QuadraticPolynomial, i?: Interval): Monotonicity
  (i: Interval): (p: QuadraticPolynomial) => Monotonicity
} = internal.monotonicity

export const antiderivative: {
  (p: QuadraticPolynomial, constant?: number): CubicPolynomial
  (constant: number): (p: QuadraticPolynomial) => CubicPolynomial
} = internal.antiderivative

export const domain: {
  (p: QuadraticPolynomial, range: Interval): Interval | null
  (range: Interval): (p: QuadraticPolynomial) => Interval | null
} = internal.domain

export const range: {
  (p: QuadraticPolynomial, domain: Interval): Interval
  (domain: Interval): (p: QuadraticPolynomial) => Interval
} = internal.range

export const length: {
  (p: QuadraticPolynomial, i: Interval): number
  (i: Interval): (p: QuadraticPolynomial) => number
} = internal.length
