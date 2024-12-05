import { dual } from '../internal/function'
import * as Interval from '../interval'
import { round } from '../util'
import type { Vector3 } from '../vector/vector3'
import type { CubicPolynomial } from './cubic'
import { CubicPolynomialImpl } from './cubic.internal.circular'
import * as Linear from './linear.internal'
import {
  type Monotonicity,
  guaranteedMonotonicityFromComparison,
} from './monotonicity'
import type { QuadraticPolynomial } from './quadratic'
import {
  QuadraticPolynomialImpl,
  QuadraticPolynomialTypeId,
} from './quadratic.internal.circular'
import type { ZeroToTwoSolutions } from './types'

export const make = (c0 = 0, c1 = 0, c2 = 0): QuadraticPolynomial =>
  new QuadraticPolynomialImpl(c0, c1, c2)

export const isQuadraticPolynomial = (v: unknown): v is QuadraticPolynomial =>
  typeof v === 'object' && v !== null && QuadraticPolynomialTypeId in v

export const fromVector = (v: Vector3) =>
  new QuadraticPolynomialImpl(v.x, v.y, v.z)

export const solve = dual<
  (x: number) => (p: QuadraticPolynomial) => number,
  (p: QuadraticPolynomial, x: number) => number
>(2, (p: QuadraticPolynomial, x: number) =>
  round(p.c0 + x * p.c1 + x ** 2 * p.c2),
)

export const toSolver = (p: QuadraticPolynomial) => (x: number) => solve(p, x)

export const solveInverse: {
  (p: QuadraticPolynomial, y: number): ZeroToTwoSolutions
  (y: number): (p: QuadraticPolynomial) => ZeroToTwoSolutions
} = dual<
  (y: number) => (p: QuadraticPolynomial) => ZeroToTwoSolutions,
  (p: QuadraticPolynomial, y: number) => ZeroToTwoSolutions
>(2, (p: QuadraticPolynomial, y: number) => {
  const discriminant = p.c1 ** 2 - 4 * p.c2 * (p.c0 - y)

  if (discriminant < 0) {
    return [] as ZeroToTwoSolutions
  }

  if (discriminant === 0) {
    return [round(-p.c1 / (2 * p.c2))] as ZeroToTwoSolutions
  }

  const sqrtDiscriminant = Math.sqrt(discriminant)

  return [
    round((-p.c1 + sqrtDiscriminant) / (2 * p.c2)),
    round((-p.c1 - sqrtDiscriminant) / (2 * p.c2)),
  ].toSorted((a, b) => a - b) as unknown as ZeroToTwoSolutions
})

export const toInverseSolver =
  (p: QuadraticPolynomial) =>
  (y: number): ZeroToTwoSolutions =>
    solveInverse(p, y)

export const derivative = (p: QuadraticPolynomial) =>
  Linear.make(p.c1, p.c2 * 2)

export const roots = (p: QuadraticPolynomial) => solveInverse(p, 0)

export const extreme = (p: QuadraticPolynomial) =>
  derivative(p).pipe(Linear.solveInverse(0)) ?? (p.c2 === 0 ? null : 0)

export const monotonicity = dual<
  (i: Interval.Interval) => (p: QuadraticPolynomial) => Monotonicity,
  (p: QuadraticPolynomial, i?: Interval.Interval) => Monotonicity
>(
  (args) => isQuadraticPolynomial(args[0]),
  (p: QuadraticPolynomial, i?: Interval.Interval) => {
    if (p.c2 === 0 && p.c1 === 0) {
      return 'constant'
    }

    if (p.c2 === 0) {
      return Linear.monotonicity(Linear.make(p.c0, p.c1))
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
      solve(p, i.start),
      solve(p, i.end),
    )
  },
)

export const antiderivative = dual<
  (integrationConstant: number) => (p: QuadraticPolynomial) => CubicPolynomial,
  (p: QuadraticPolynomial, integrationConstant?: number) => CubicPolynomial
>(
  2,
  (p: QuadraticPolynomial, integrationConstant = 0) =>
    new CubicPolynomialImpl(integrationConstant, p.c0, p.c1 / 2, p.c2 / 3),
)

export const domain = dual<
  (
    range: Interval.Interval,
  ) => (p: QuadraticPolynomial) => Interval.Interval | null,
  (p: QuadraticPolynomial, range: Interval.Interval) => Interval.Interval | null
>(2, (p: QuadraticPolynomial, range: Interval.Interval) => {
  const start = solveInverse(p, range.start)
  const end = solveInverse(p, range.end)

  if (start.length === 0 && end.length === 0) {
    return null
  }

  return Interval.fromMinMax(
    ...solveInverse(p, range.start),
    ...solveInverse(p, range.end),
  )
})

export const range = dual<
  (domain: Interval.Interval) => (p: QuadraticPolynomial) => Interval.Interval,
  (p: QuadraticPolynomial, domain: Interval.Interval) => Interval.Interval
>(2, (p: QuadraticPolynomial, domain: Interval.Interval) => {
  if (p.c2 === 0) {
    return Linear.range(Linear.make(p.c0, p.c1), domain)
  }

  const e = extreme(p)

  return e !== null && Interval.contains(domain, e)
    ? Interval.fromMinMax(
        solve(p, domain.start),
        solve(p, domain.end),
        solve(p, e),
      )
    : Interval.fromMinMax(solve(p, domain.start), solve(p, domain.end))
})

export const length = dual<
  (domain: Interval.Interval) => (p: QuadraticPolynomial) => number,
  (p: QuadraticPolynomial, domain: Interval.Interval) => number
>(2, (p: QuadraticPolynomial, domain: Interval.Interval) => {
  if (Interval.size(domain) === 0) {
    return 0
  }

  if (p.c2 === 0) {
    return Linear.length(Linear.make(p.c0, p.c1), domain)
  }

  const d = derivative(p)

  const derivativeStart = Linear.solve(d, domain.start)
  const sqrtStart = Math.sqrt(1 + derivativeStart ** 2)
  const evalStart =
    (derivativeStart * sqrtStart +
      Math.log(Math.abs(derivativeStart + sqrtStart))) /
    (4 * p.c2)

  const derivativeEnd = Linear.solve(d, domain.end)
  const sqrtEnd = Math.sqrt(1 + derivativeEnd ** 2)
  const evalEnd =
    (derivativeEnd * sqrtEnd + Math.log(Math.abs(derivativeEnd + sqrtEnd))) /
    (4 * p.c2)

  return round(evalEnd - evalStart)
})
