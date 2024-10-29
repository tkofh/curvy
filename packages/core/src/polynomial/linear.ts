import type { Pipeable } from '../internal/pipeable'
import type { Vector2 } from '../vector/vector2'
import * as internal from './linear.internal'
import type { LinearPolynomialTypeId } from './linear.internal'
import type { GuaranteedMonotonicity } from './monotonicity'
import type { QuadraticPolynomial } from './quadratic'
import type { ZeroOrOneSolution } from './types'

export interface LinearPolynomial extends Pipeable {
  readonly [LinearPolynomialTypeId]: LinearPolynomialTypeId

  readonly c0: number
  readonly c1: number
  readonly precision: number
}

export const isLinearPolynomial: (v: unknown) => v is LinearPolynomial =
  internal.isLinearPolynomial

export const make: (
  c0?: number,
  c1?: number,
  precision?: number,
) => LinearPolynomial = internal.make

export const fromVector: (v: Vector2, precision?: number) => LinearPolynomial =
  internal.fromVector

export const solve: {
  (p: LinearPolynomial, x: number): number
  (x: number): (p: LinearPolynomial) => number
} = internal.solve

export const toSolver: (p: LinearPolynomial) => (x: number) => number =
  internal.toSolver

export const solveInverse: {
  (p: LinearPolynomial, y: number): ZeroOrOneSolution
  (y: number): (p: LinearPolynomial) => ZeroOrOneSolution
} = internal.solveInverse

export const toInverseSolver: (
  p: LinearPolynomial,
) => (y: number) => ZeroOrOneSolution = internal.toInverseSolver

export const root: (p: LinearPolynomial) => ZeroOrOneSolution = (p) =>
  internal.solveInverse(p, 0)

export const monotonicity: (p: LinearPolynomial) => GuaranteedMonotonicity =
  internal.monotonicity

export const antiderivative: {
  (p: LinearPolynomial, constant?: number): QuadraticPolynomial
  (constant: number): (p: LinearPolynomial) => QuadraticPolynomial
} = internal.antiderivative
