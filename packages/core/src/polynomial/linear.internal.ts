import * as Interval from '../interval'
import { Pipeable } from '../pipe'
import { dual } from '../pipe'
import { round } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { LinearPolynomial } from './linear'
import type { QuadraticPolynomial } from './quadratic'
import { QuadraticPolynomialImpl } from './quadratic.internal.circular'
import type { ZeroOrOne } from './types'

export const LinearPolynomialTypeId: unique symbol = Symbol.for('curvy/linear')
export type LinearPolynomialTypeId = typeof LinearPolynomialTypeId

class LinearPolynomialImpl extends Pipeable implements LinearPolynomial {
  readonly [LinearPolynomialTypeId]: LinearPolynomialTypeId = LinearPolynomialTypeId

  readonly c0: number
  readonly c1: number

  constructor(c0 = 0, c1 = 0) {
    super()

    this.c0 = round(c0)
    this.c1 = round(c1)
  }
}

export const isLinearPolynomial = (v: unknown): v is LinearPolynomial =>
  typeof v === 'object' && v !== null && LinearPolynomialTypeId in v

export const make = (c0 = 0, c1 = 0): LinearPolynomial => new LinearPolynomialImpl(c0, c1)

export const fromVector = (v: Vector2) => new LinearPolynomialImpl(v.x, v.y)

export const fromPointSlope = (p: Vector2, slope: number) =>
  new LinearPolynomialImpl(p.y - slope * p.x, slope)

export const fromPoints = (p1: Vector2, p2: Vector2) =>
  fromPointSlope(p1, (p2.y - p1.y) / (p2.x - p1.x))

export const solve = dual<
  (x: number) => (p: LinearPolynomial) => number,
  (p: LinearPolynomial, x: number) => number
>(2, (p: LinearPolynomial, x: number) => round(p.c0 + x * p.c1))

export const toSolver = (p: LinearPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual<
  (y: number) => (p: LinearPolynomial) => ZeroOrOne,
  (p: LinearPolynomial, y: number) => ZeroOrOne
>(2, (p: LinearPolynomial, y: number) => {
  if (p.c1 === 0) {
    return null
  }
  return round((y - p.c0) / p.c1)
})

export const toInverseSolver = (p: LinearPolynomial) => (y: number) => solveInverse(p, y)

export const monotonicity = (p: LinearPolynomial) =>
  p.c1 === 0 ? 'constant' : p.c1 > 0 ? 'increasing' : 'decreasing'

export const derivative = (p: LinearPolynomial) => p.c1

export const antiderivative = dual<
  (integrationConstant: number) => (p: LinearPolynomial) => QuadraticPolynomial,
  (p: LinearPolynomial, integrationConstant?: number) => QuadraticPolynomial
>(
  (args) => isLinearPolynomial(args[0]),
  (p: LinearPolynomial, integrationConstant = 0) =>
    new QuadraticPolynomialImpl(integrationConstant, p.c0, p.c1 / 2),
)

export const domain = dual<
  (range: Interval.Interval) => (p: LinearPolynomial) => ZeroOrOne<Interval.Interval>,
  (p: LinearPolynomial, range: Interval.Interval) => ZeroOrOne<Interval.Interval>
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
    return round(Interval.size(domain))
  }

  return round(Math.sqrt(1 + p.c1 ** 2) * Interval.size(domain))
})
