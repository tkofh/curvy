import type { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import type { Vector4 } from '../vector/vector4'
import * as internal from './cubic.internal'
import type { Monotonicity } from './monotonicity'
import type { QuadraticPolynomial } from './quadratic'
import type { ZeroToThreeSolutions, ZeroToTwoSolutions } from './types'

export interface CubicPolynomial extends Pipeable {
  readonly c0: number
  readonly c1: number
  readonly c2: number
  readonly c3: number
  readonly precision: number
}

export const isCubicPolynomial: (value: unknown) => value is CubicPolynomial =
  internal.isCubicPolynomial

export const make: (
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
  (p: CubicPolynomial, y: number): ZeroToThreeSolutions
  (y: number): (p: CubicPolynomial) => ZeroToThreeSolutions
} = internal.solveInverse

export const toInverseSolver: (
  p: CubicPolynomial,
) => (y: number) => ZeroToThreeSolutions = internal.toInverseSolver

export const derivative: (p: CubicPolynomial) => QuadraticPolynomial =
  internal.derivative

export const roots: (p: CubicPolynomial) => ZeroToThreeSolutions =
  internal.roots

export const extrema: (p: CubicPolynomial) => ZeroToTwoSolutions =
  internal.extrema

export const monotonicity: {
  (p: CubicPolynomial, i?: Interval): Monotonicity
  (i: Interval): (p: CubicPolynomial) => Monotonicity
} = internal.monotonicity
