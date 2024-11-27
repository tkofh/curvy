import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import * as Interval from '../interval'
import { PRECISION, round } from '../util'
import type { Vector2 } from '../vector/vector2'
import type { LinearPolynomial } from './linear'
import type { QuadraticPolynomial } from './quadratic'
import { QuadraticPolynomialImpl } from './quadratic.internal.circular'
import type { ZeroOrOneInterval, ZeroOrOneSolution } from './types'

export const LinearPolynomialTypeId: unique symbol = Symbol.for('curvy/linear')
export type LinearPolynomialTypeId = typeof LinearPolynomialTypeId

class LinearPolynomialImpl extends Pipeable implements LinearPolynomial {
  readonly [LinearPolynomialTypeId]: LinearPolynomialTypeId =
    LinearPolynomialTypeId

  readonly c0: number
  readonly c1: number

  readonly precision: number

  constructor(c0 = 0, c1 = 0, precision = PRECISION) {
    super()

    this.c0 = round(c0, precision)
    this.c1 = round(c1, precision)

    this.precision = precision
  }
}

export const isLinearPolynomial = (v: unknown): v is LinearPolynomial =>
  typeof v === 'object' && v !== null && LinearPolynomialTypeId in v

export const make = (c0 = 0, c1 = 0, precision = PRECISION): LinearPolynomial =>
  new LinearPolynomialImpl(c0, c1, precision)

export const fromVector = (v: Vector2, precision?: number) =>
  new LinearPolynomialImpl(v.v0, v.v1, precision ?? v.precision)

export const solve = dual<
  (x: number) => (p: LinearPolynomial) => number,
  (p: LinearPolynomial, x: number) => number
>(2, (p: LinearPolynomial, x: number) => round(p.c0 + x * p.c1, p.precision))

export const toSolver = (p: LinearPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual<
  (y: number) => (p: LinearPolynomial) => ZeroOrOneSolution,
  (p: LinearPolynomial, y: number) => ZeroOrOneSolution
>(2, (p: LinearPolynomial, y: number) => {
  if (p.c1 === 0) {
    return null
  }
  return round((y - p.c0) / p.c1, p.precision)
})

export const toInverseSolver = (p: LinearPolynomial) => (y: number) =>
  solveInverse(p, y)

export const monotonicity = (p: LinearPolynomial) =>
  p.c1 === 0 ? 'constant' : p.c1 > 0 ? 'increasing' : 'decreasing'

export const antiderivative = dual<
  (integrationConstant: number) => (p: LinearPolynomial) => QuadraticPolynomial,
  (p: LinearPolynomial, integrationConstant?: number) => QuadraticPolynomial
>(
  (args) => isLinearPolynomial(args[0]),
  (p: LinearPolynomial, integrationConstant = 0) =>
    new QuadraticPolynomialImpl(
      integrationConstant,
      p.c0,
      p.c1 / 2,
      p.precision,
    ),
)

export const domain = dual<
  (range: Interval.Interval) => (p: LinearPolynomial) => ZeroOrOneInterval,
  (p: LinearPolynomial, range: Interval.Interval) => ZeroOrOneInterval
>(2, (p: LinearPolynomial, range: Interval.Interval) => {
  if (p.c1 === 0) {
    if (range.start === p.c0 && range.end === p.c0) {
      return Interval.make(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)
    }
    return null
  }

  const start = solveInverse(p, range.start)
  const end = solveInverse(p, range.end)

  if (start === null || end === null) {
    return null
  }

  return Interval.make(start, end)
})

export const range = dual<
  (domain: Interval.Interval) => (p: LinearPolynomial) => Interval.Interval,
  (p: LinearPolynomial, domain: Interval.Interval) => Interval.Interval
>(2, (p: LinearPolynomial, domain: Interval.Interval) =>
  Interval.make(solve(p, domain.start), solve(p, domain.end)),
)

export const length = dual<
  (domain: Interval.Interval) => (p: LinearPolynomial) => number,
  (p: LinearPolynomial, domain: Interval.Interval) => number
>(2, (p: LinearPolynomial, domain: Interval.Interval) => {
  if (Interval.size(domain) === 0) {
    return 0
  }

  if (p.c1 === 0) {
    return round(Interval.size(domain), p.precision)
  }

  return round(Math.sqrt(1 + p.c1 ** 2) * Interval.size(domain), p.precision)
})
