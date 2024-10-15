import type { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import type { Vector4 } from '../vector/vector4'
import * as internal from './cubic.internal'
import type { QuadraticPolynomial } from './quadratic'

export interface CubicPolynomial extends Pipeable {
  readonly c0: number
  readonly c1: number
  readonly c2: number
  readonly c3: number
  readonly precision: number
}

export const isCubicPolynomial: (value: unknown) => value is CubicPolynomial =
  internal.isCubicPolynomial

export const cubicPolynomial: (
  c0: number,
  c1: number,
  c2: number,
  c3: number,
  precision?: number,
) => CubicPolynomial = internal.make

export const fromVector: (v: Vector4, precision?: number) => CubicPolynomial =
  internal.fromVector

export const solve: {
  (p: CubicPolynomial, x: number): number
  (x: number): (p: CubicPolynomial) => number
} = internal.solve

export const toSolver: (p: CubicPolynomial) => (x: number) => number =
  internal.toSolver

export const solveInverse: {
  (
    p: CubicPolynomial,
    y: number,
  ):
    | readonly []
    | readonly [number]
    | readonly [number, number]
    | readonly [number, number, number]
  (
    y: number,
  ): (
    p: CubicPolynomial,
  ) =>
    | readonly []
    | readonly [number]
    | readonly [number, number]
    | readonly [number, number, number]
} = internal.solveInverse

export const toInverseSolver: (
  p: CubicPolynomial,
) => (
  y: number,
) =>
  | readonly []
  | readonly [number]
  | readonly [number, number]
  | readonly [number, number, number] = internal.toInverseSolver

export const derivative: (p: CubicPolynomial) => QuadraticPolynomial =
  internal.derivative

export const roots: (
  p: CubicPolynomial,
) =>
  | readonly []
  | readonly [number]
  | readonly [number, number]
  | readonly [number, number, number] = internal.roots

export const extrema: (
  p: CubicPolynomial,
) => readonly [] | readonly [number] | readonly [number, number] =
  internal.extrema

export const monotonicity: {
  (
    p: CubicPolynomial,
    i?: Interval,
  ): 'constant' | 'increasing' | 'decreasing' | 'none'
  (
    i?: Interval,
  ): (p: CubicPolynomial) => 'constant' | 'increasing' | 'decreasing' | 'none'
} = internal.monotonicity
