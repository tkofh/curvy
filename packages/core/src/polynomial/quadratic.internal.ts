import { dual } from '../internal/function'
import * as Interval from '../interval'
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
  (p: QuadraticPolynomial, interval?: Interval.Interval) => {
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
  (p: QuadraticPolynomial, i?: Interval.Interval) => {
    if (p.c2 === 0 && p.c1 === 0) {
      return 'constant'
    }

    if (p.c2 === 0) {
      return linear.monotonicity(linear.make(p.c0, p.c1, p.precision))
    }

    // c2 is non-zero, so the extreme is guaranteed to be non-null
    const e = extreme(p) as number

    // if the interval is a single point, the monotonicity is constant
    if (i && Interval.size(i) === 0) {
      return 'constant'
    }

    // if there is no interval, or the extreme is within the interval,
    // the monotonicity is none
    if (
      i === undefined ||
      Interval.contains(i, e, { includeStart: false, includeEnd: false })
    ) {
      return 'none'
    }

    return guaranteedMonotonicityFromComparison(
      solve(p, Interval.min(i)),
      solve(p, Interval.max(i)),
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

export const domain = dual(
  2,
  (p: QuadraticPolynomial, range: Interval.Interval) => {
    if (p.c2 === 0) {
      const result = linear.domain(linear.make(p.c0, p.c1, p.precision), range)
      return result === null ? [] : [result]
    }

    if (range.start === range.end) {
      const domain = solveInverse(p, range.start)
      return domain.length === 0
        ? []
        : [Interval.make(Math.min(...domain), Math.max(...domain))]
    }

    // the start and end of the range are discrete values. each can have zero, one, or two values
    const start = solveInverse(p, range.start)
    const end = solveInverse(p, range.end)

    // if there are no solutions, the range does not intersect the curve at all
    if (start.length === 0 && end.length === 0) {
      return []
    }

    if (start.length < end.length) {
      return [Interval.make(Math.min(...end), Math.max(...end))]
    }

    if (end.length < start.length) {
      return [Interval.make(Math.min(...start), Math.max(...start))]
    }

    const startMin = Math.min(...start)
    const startMax = Math.max(...start)
    const endMin = Math.min(...end)
    const endMax = Math.max(...end)

    return startMin < endMin
      ? [Interval.make(startMin, endMin), Interval.make(endMax, startMax)]
      : [Interval.make(endMin, startMin), Interval.make(startMax, endMax)]
  },
)

export const range = dual(
  2,
  (p: QuadraticPolynomial, domain: Interval.Interval) => {
    if (p.c2 === 0) {
      return linear.range(linear.make(p.c0, p.c1, p.precision), domain)
    }

    const start = solve(p, domain.start)
    const end = solve(p, domain.end)
    const e = extreme(p)

    if (e === null) {
      return Interval.make(start, end)
    }

    const min = Math.min(start, end, e)
    const max = Math.max(start, end, e)

    return Interval.make(min, max)
  },
)
