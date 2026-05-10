import * as Interval from '../interval'
import { dual, Pipeable } from '../pipe'
import * as Solution from '../solution'
import { epsEquals, invariant } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { LinearPolynomial } from './linear'
import type { Decreasing, Increasing, Monotonic } from './traits'
import { PolynomialTraits } from './traits'
import type { QuadraticPolynomial } from './quadratic'
import { QuadraticPolynomialImpl } from './quadratic.internal.circular'

export const LinearPolynomialTypeId: unique symbol = Symbol.for('curvy/linear')
export type LinearPolynomialTypeId = typeof LinearPolynomialTypeId

class LinearPolynomialImpl extends Pipeable implements LinearPolynomial<unknown> {
  readonly [LinearPolynomialTypeId]: LinearPolynomialTypeId = LinearPolynomialTypeId
  declare readonly [PolynomialTraits]: unknown

  readonly c0: number
  readonly c1: number

  constructor(c0 = 0, c1 = 0) {
    super()

    this.c0 = c0
    this.c1 = c1
  }
}

export const isLinearPolynomial = (v: unknown): v is LinearPolynomial =>
  typeof v === 'object' && v !== null && LinearPolynomialTypeId in v

export const equals = dual<
  (b: LinearPolynomial) => (a: LinearPolynomial) => boolean,
  (a: LinearPolynomial, b: LinearPolynomial) => boolean
>(2, (a: LinearPolynomial, b: LinearPolynomial) => epsEquals(a.c0, b.c0) && epsEquals(a.c1, b.c1))

export const make = (c0 = 0, c1 = 0): LinearPolynomial => new LinearPolynomialImpl(c0, c1)

export const fromVector = (v: Vector2) => new LinearPolynomialImpl(v.x, v.y)

export const fromPointSlope = (p: Vector2, slope: number) =>
  new LinearPolynomialImpl(p.y - slope * p.x, slope)

export const fromPoints = (p1: Vector2, p2: Vector2) =>
  fromPointSlope(p1, (p2.y - p1.y) / (p2.x - p1.x))

export const solve = dual<
  (x: number) => (p: LinearPolynomial) => number,
  (p: LinearPolynomial, x: number) => number
>(2, (p: LinearPolynomial, x: number) => p.c0 + x * p.c1)

export const toSolver = (p: LinearPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual<
  (y: number) => (p: LinearPolynomial) => Solution.AtMostOne<number>,
  (p: LinearPolynomial, y: number) => Solution.AtMostOne<number>
>(2, (p: LinearPolynomial, y: number) => {
  if (p.c1 === 0) {
    return Solution.none
  }
  return Solution.one((y - p.c0) / p.c1)
})

export const toInverseSolver = (p: LinearPolynomial) => (y: number) => solveInverse(p, y)

export const monotonicity = (p: LinearPolynomial) =>
  p.c1 === 0 ? 'constant' : p.c1 > 0 ? 'increasing' : 'decreasing'

export const isMonotonic = <T>(p: LinearPolynomial<T>): p is LinearPolynomial<T & Monotonic> =>
  p.c1 !== 0

export const isIncreasing = <T>(p: LinearPolynomial<T>): p is LinearPolynomial<T & Increasing> =>
  p.c1 > 0

export const isDecreasing = <T>(p: LinearPolynomial<T>): p is LinearPolynomial<T & Decreasing> =>
  p.c1 < 0

export const asMonotonic = <T>(p: LinearPolynomial<T>): LinearPolynomial<T & Monotonic> => {
  invariant(isMonotonic(p), 'linear polynomial is not monotonic')
  return p
}

export const asIncreasing = <T>(p: LinearPolynomial<T>): LinearPolynomial<T & Increasing> => {
  invariant(isIncreasing(p), 'linear polynomial is not increasing')
  return p
}

export const asDecreasing = <T>(p: LinearPolynomial<T>): LinearPolynomial<T & Decreasing> => {
  invariant(isDecreasing(p), 'linear polynomial is not decreasing')
  return p
}

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
  (range: Interval.Interval) => (p: LinearPolynomial) => Solution.AtMostOne<Interval.Interval>,
  (p: LinearPolynomial, range: Interval.Interval) => Solution.AtMostOne<Interval.Interval>
>(2, (p: LinearPolynomial, r: Interval.Interval) => {
  if (p.c1 === 0) {
    if (r.start === p.c0 && r.end === p.c0) {
      return Solution.one(Interval.make(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY))
    }
    return Solution.none
  }

  const start = solveInverse(p, r.start)
  const end = solveInverse(p, r.end)

  if (Solution.isNone(start) || Solution.isNone(end)) {
    return Solution.none
  }

  return Solution.one(Interval.make(start.value, end.value))
})

export const range = dual<
  (domain: Interval.Interval) => (p: LinearPolynomial) => Interval.Interval,
  (p: LinearPolynomial, domain: Interval.Interval) => Interval.Interval
>(2, (p: LinearPolynomial, d: Interval.Interval) =>
  Interval.make(solve(p, d.start), solve(p, d.end)),
)

export const length = dual<
  (domain: Interval.Interval) => (p: LinearPolynomial) => number,
  (p: LinearPolynomial, domain: Interval.Interval) => number
>(2, (p: LinearPolynomial, d: Interval.Interval) => {
  if (Interval.size(d) === 0) {
    return 0
  }

  if (p.c1 === 0) {
    return Interval.size(d)
  }

  return Math.sqrt(1 + p.c1 ** 2) * Interval.size(d)
})
