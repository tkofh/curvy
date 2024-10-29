import { dual } from '../internal/function'
import type { Interval } from '../interval'
import * as interval from '../interval.internal'
import { PRECISION, minMax, round } from '../util'
import type { Vector3 } from '../vector/vector3'
import { CubicPolynomialImpl } from './cubic.internal.circular'
import * as linear from './linear.internal'
import { guaranteedMonotonicityFromComparison } from './monotonicity'
import type { QuadraticPolynomial } from './quadratic'
import {
  QuadraticPolynomialImpl,
  QuadraticPolynomialTypeId,
} from './quadratic.internal.circular'
import type { ZeroToTwoSolutions } from './types'

export const make = (
  c0 = 0,
  c1 = 0,
  c2 = 0,
  precision = PRECISION,
): QuadraticPolynomial => new QuadraticPolynomialImpl(c0, c1, c2, precision)

export const isQuadraticPolynomial = (v: unknown): v is QuadraticPolynomial =>
  typeof v === 'object' && v !== null && QuadraticPolynomialTypeId in v

export const fromVector = (v: Vector3, precision?: number) =>
  new QuadraticPolynomialImpl(v.v0, v.v1, v.v2, precision ?? v.precision)

export const solve = dual<
  (x: number) => (p: QuadraticPolynomial) => number,
  (p: QuadraticPolynomial, x: number) => number
>(2, (p: QuadraticPolynomial, x: number) =>
  round(p.c0 + x * p.c1 + x ** 2 * p.c2, p.precision),
)

export const toSolver = (p: QuadraticPolynomial) => (x: number) => solve(p, x)

export const solveInverse: {
  (p: QuadraticPolynomial, y: number): ZeroToTwoSolutions
  (y: number): (p: QuadraticPolynomial) => ZeroToTwoSolutions
} = dual(2, (p: QuadraticPolynomial, y: number) => {
  const discriminant = p.c1 ** 2 - 4 * p.c2 * (p.c0 - y)

  if (discriminant < 0) {
    return [] as ZeroToTwoSolutions
  }

  if (discriminant === 0) {
    return [round(-p.c1 / (2 * p.c2), p.precision)] as ZeroToTwoSolutions
  }

  const sqrtDiscriminant = Math.sqrt(discriminant)

  return [
    round((-p.c1 + sqrtDiscriminant) / (2 * p.c2), p.precision),
    round((-p.c1 - sqrtDiscriminant) / (2 * p.c2), p.precision),
  ].toSorted((a, b) => a - b) as unknown as ZeroToTwoSolutions
})

export const toInverseSolver =
  (p: QuadraticPolynomial) =>
  (y: number): ZeroToTwoSolutions =>
    solveInverse(p, y)

export const derivative = (p: QuadraticPolynomial) =>
  linear.make(p.c1, p.c2 * 2, p.precision)

export const roots = dual(
  (args) => isQuadraticPolynomial(args[0]),
  (p: QuadraticPolynomial, interval?: Interval) => {
    const roots = solveInverse(p, 0)
    if (interval === undefined) {
      return roots
    }
    const [min, max] = minMax(interval.start, interval.end)
    return roots.filter((root) => root >= min && root <= max)
  },
)

export const extreme = (p: QuadraticPolynomial) =>
  derivative(p).pipe(linear.solveInverse(0)) ?? (p.c2 === 0 ? null : 0)

export const monotonicity = dual(
  (args) => isQuadraticPolynomial(args[0]),
  (p: QuadraticPolynomial, i?: Interval) => {
    if (p.c2 === 0 && p.c1 === 0) {
      return 'constant'
    }

    if (p.c2 === 0) {
      return linear.monotonicity(linear.make(p.c0, p.c1, p.precision))
    }

    // c2 is non-zero, so the extreme is guaranteed to be non-null
    const e = extreme(p) as number

    // if there is no interval, or the extreme is within the interval,
    // the monotonicity is none
    if (
      i === undefined ||
      i.pipe(
        interval.startExclusive,
        interval.endExclusive,
        interval.contains(e),
      )
    ) {
      return 'none'
    }

    return guaranteedMonotonicityFromComparison(
      solve(p, interval.min(i)),
      solve(p, interval.max(i)),
    )
  },
)

export const antiderivative = dual(
  2,
  (p: QuadraticPolynomial, integrationConstant: number) =>
    new CubicPolynomialImpl(
      integrationConstant,
      p.c0,
      p.c1 / 2,
      p.c2 / 3,
      p.precision,
    ),
)
