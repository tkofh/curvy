import { dual } from '../internal/function'
import * as Interval from '../interval'
import { PRECISION, invariant, minMax, round } from '../util'
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
      i.pipe(
        Interval.startExclusive,
        Interval.endExclusive,
        Interval.contains(e),
      )
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

const domainFromIntersectingLine = (
  solutions: Exclude<ZeroToTwoSolutions, []>,
  inclusive: boolean,
) => {
  const min = Math.min(...solutions)
  const max = Math.max(...solutions)

  // if the range is end-inclusive, it can at least be a single point interval.
  // if the min and max are the same (i.e. there was only one solution),
  // the range does not intersect the curve at all.
  // otherwise, the domain is the exclusive interval between min and max
  return inclusive
    ? [Interval.make(min, max)]
    : min === max
      ? []
      : [Interval.makeExclusive(min, max)]
}

const domainFromIntersectingTriangle = (
  center: number,
  centerInclusive: boolean,
  edges: [number, number],
  edgesInclusive: boolean,
) => {
  if (centerInclusive) {
    return domainFromIntersectingLine(edges, edgesInclusive)
  }

  const min = Math.min(...edges)
  const max = Math.max(...edges)

  invariant(min !== max, 'edges must be different')
  invariant(min <= center && center <= max, 'center must be within the edges')

  return edgesInclusive
    ? [
        Interval.makeEndExclusive(min, center),
        Interval.makeStartExclusive(center, max),
      ]
    : [Interval.makeExclusive(min, center), Interval.makeExclusive(center, max)]
}

const domainsFromSolutionPairs = (
  outer: [number, number],
  outerInclusive: boolean,
  inner: [number, number],
  innerInclusive: boolean,
) => {
  const p0 = Math.min(...outer)
  const p1 = Math.min(...inner)
  const p2 = Math.max(...inner)
  const p3 = Math.max(...outer)

  if (outerInclusive && innerInclusive) {
    return [Interval.make(p0, p1), Interval.make(p2, p3)]
  }

  if (outerInclusive) {
    return [
      Interval.makeEndExclusive(p0, p1),
      Interval.makeStartExclusive(p2, p3),
    ]
  }

  if (innerInclusive) {
    return [
      Interval.makeStartExclusive(p0, p1),
      Interval.makeEndExclusive(p2, p3),
    ]
  }

  return [Interval.makeExclusive(p0, p1), Interval.makeExclusive(p2, p3)]
}

export const domain = dual(
  2,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this function deals with many different cases
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

    // if there are no solutions for the start of the range, the domain depends on the end of the range
    if (start.length === 0) {
      return domainFromIntersectingLine(end, range.endInclusive)
    }

    // if there are no solutions for the end of the range, the domain depends on the start of the range
    if (end.length === 0) {
      return domainFromIntersectingLine(start, range.startInclusive)
    }

    // at this point, there is at least one solution for the start and end of the range
    if (end.length === 1 && start.length === 2) {
      return domainFromIntersectingTriangle(
        end[0],
        range.endInclusive,
        start as [number, number],
        range.startInclusive,
      )
    }

    if (start.length === 1 && end.length === 2) {
      return domainFromIntersectingTriangle(
        start[0],
        range.startInclusive,
        end as [number, number],
        range.endInclusive,
      )
    }

    invariant(
      start.length === 2 && end.length === 2,
      'start and end must have two solutions',
    )

    const startMin = Math.min(...start)
    const endMin = Math.min(...end)

    return startMin < endMin
      ? domainsFromSolutionPairs(
          start as [number, number],
          range.startInclusive,
          end as [number, number],
          range.endInclusive,
        )
      : domainsFromSolutionPairs(
          end as [number, number],
          range.endInclusive,
          start as [number, number],
          range.startInclusive,
        )
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

    if (e === null || !Interval.contains(domain, e)) {
      return Interval.withExclusivityOf(Interval.make(start, end), domain)
    }

    const min = Math.min(start, end, e)
    const max = Math.max(start, end, e)

    if (start === end) {
      if (!(domain.startInclusive || domain.endInclusive)) {
        if (min === start) {
          return Interval.makeStartExclusive(min, max)
        }
        return Interval.makeEndExclusive(min, max)
      }

      return Interval.make(min, max)
    }

    if (min === start && !domain.startInclusive) {
    }
  },
)
