import type { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import type { Vector3 } from '../vector/vector3'
import type { LinearPolynomial } from './linear'
import * as internal from './quadratic.internal'

export interface QuadraticPolynomial extends Pipeable {
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
  (p: QuadraticPolynomial, y: number): number
  (y: number): (p: QuadraticPolynomial) => number
} = internal.solveInverse

export const toInverseSolver: (
  p: QuadraticPolynomial,
) => (y: number) => number = internal.toInverseSolver

export const derivative: (p: QuadraticPolynomial) => LinearPolynomial =
  internal.derivative

export const roots: (
  p: QuadraticPolynomial,
) => readonly [] | readonly [number] | readonly [number, number] =
  internal.roots

export const extreme: (p: QuadraticPolynomial) => number | null =
  internal.extreme

export const monotonicity: {
  (
    p: QuadraticPolynomial,
    i?: Interval,
  ): 'none' | 'increasing' | 'decreasing' | 'constant'
  (
    i?: Interval,
  ): (
    p: QuadraticPolynomial,
  ) => 'none' | 'increasing' | 'decreasing' | 'constant'
} = internal.monotonicity

export const antiderivative: {
  (
    p: QuadraticPolynomial,
    integrationConstant: number,
  ): readonly [number, number, number, number]
  (
    integrationConstant: number,
  ): (p: QuadraticPolynomial) => readonly [number, number, number, number]
} = internal.antiderivative
