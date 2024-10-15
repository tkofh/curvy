import type { Pipeable } from '../internal/pipeable'
import type { Vector2 } from '../vector/vector2'
import * as internal from './linear.internal'
import type { QuadraticPolynomial } from './quadratic'

export interface LinearPolynomial extends Pipeable {
  readonly c0: number
  readonly c1: number
  readonly precision: number
}

export const isLinearPolynomial: (v: unknown) => v is LinearPolynomial =
  internal.isLinearPolynomial

export const linearPolynomial: (
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
  (p: LinearPolynomial, y: number): number
  (y: number): (p: LinearPolynomial) => number
} = internal.solveInverse

export const toInverseSolver: (p: LinearPolynomial) => (y: number) => number =
  internal.toInverseSolver

export const monotonicity: (
  p: LinearPolynomial,
) => 'increasing' | 'decreasing' | 'constant' = internal.monotonicity

export const root: {
  (p: LinearPolynomial, start?: number, end?: number): number | null
  (start?: number, end?: number): (p: LinearPolynomial) => number | null
} = internal.root

export const antiderivative: (
  p: LinearPolynomial,
  integrationConstant: number,
) => QuadraticPolynomial = internal.antiderivative
