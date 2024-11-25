import { dual } from '../internal/function'
import * as Interval from '../interval'
import { PRECISION, round } from '../util'
import type { Vector4 } from '../vector/vector4'
import type { CubicPolynomial } from './cubic'
import {
  CubicPolynomialImpl,
  CubicPolynomialTypeId,
} from './cubic.internal.circular'
import * as linear from './linear.internal'
import { guaranteedMonotonicityFromComparison } from './monotonicity'
import * as quadratic from './quadratic.internal'
import type { ZeroToThreeSolutions, ZeroToTwoSolutions } from './types'

export const make = (
  c0 = 0,
  c1 = 0,
  c2 = 0,
  c3 = 0,
  precision = PRECISION,
): CubicPolynomial => new CubicPolynomialImpl(c0, c1, c2, c3, precision)

export const isCubicPolynomial = (v: unknown): v is CubicPolynomial =>
  typeof v === 'object' && v !== null && CubicPolynomialTypeId in v

export const fromVector = (v: Vector4, precision = PRECISION) =>
  new CubicPolynomialImpl(v.v0, v.v1, v.v2, v.v3, precision)

export const solve = dual<
  (x: number) => (p: CubicPolynomial) => number,
  (p: CubicPolynomial, x: number) => number
>(2, (p: CubicPolynomial, x: number) =>
  round(p.c0 + x * p.c1 + x ** 2 * p.c2 + x ** 3 * p.c3, p.precision),
)

export const toSolver = (p: CubicPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual<
  (y: number) => (p: CubicPolynomial) => ZeroToThreeSolutions,
  (p: CubicPolynomial, y: number) => ZeroToThreeSolutions
>(2, (self: CubicPolynomial, y: number) => {
  if (self.c3 === 0) {
    return quadratic.solveInverse(
      quadratic.make(self.c0, self.c1, self.c2),
      0,
    ) as ZeroToThreeSolutions
  }

  const shift = self.c2 / (3 * self.c3)

  const d0 = self.c2 ** 2 - 3 * self.c3 * self.c1
  const d1 =
    2 * self.c2 ** 3 -
    9 * self.c3 * self.c2 * self.c1 +
    27 * self.c3 ** 2 * (self.c0 - y)

  const p = -d0 / (3 * self.c3 ** 2)
  const q = d1 / (27 * self.c3 ** 3)

  const discriminant = round(-(4 * p ** 3 + 27 * q ** 2), 12)

  const roots = new Set<number>()

  if (discriminant > 0) {
    const r = 2 * Math.sqrt(-p / 3)
    const theta = Math.acos(((3 * q) / (2 * p)) * Math.sqrt(-3 / p)) / 3
    const offset = (2 * Math.PI) / 3

    roots.add(round(r * Math.cos(theta + offset) - shift, self.precision))
    roots.add(round(r * Math.cos(theta) - shift, self.precision))
    roots.add(round(r * Math.cos(theta - offset) - shift, self.precision))
  } else if (discriminant < 0) {
    const u = Math.sqrt(q ** 2 / 4 + p ** 3 / 27)

    const u1 = Math.cbrt(-q / 2 + u)
    const u2 = Math.cbrt(-q / 2 - u)

    roots.add(round(u1 + u2 - shift, self.precision))
  } else if (d0 === 0) {
    roots.add(round(-shift, self.precision))
  } else {
    roots.add(
      round(
        (9 * self.c3 * (self.c0 - y) - self.c2 * self.c1) / (2 * d0),
        self.precision,
      ),
    )
    roots.add(
      round(
        (4 * self.c3 * self.c2 * self.c1 -
          9 * self.c3 ** 2 * (self.c0 - y) -
          self.c2 ** 3) /
          (self.c3 * d0),
        self.precision,
      ),
    )
  }

  return Array.from(roots).toSorted(
    (a, b) => a - b,
  ) as unknown as ZeroToThreeSolutions
})

export const toInverseSolver = (p: CubicPolynomial) => (y: number) =>
  solveInverse(p, y)

export const derivative = (p: CubicPolynomial) =>
  quadratic.make(p.c1, p.c2 * 2, p.c3 * 3, p.precision)

export const roots = (p: CubicPolynomial): ZeroToThreeSolutions =>
  solveInverse(p, 0)

export const extrema = (p: CubicPolynomial): ZeroToTwoSolutions =>
  quadratic.roots(derivative(p))

export const monotonicity = dual(
  (args) => isCubicPolynomial(args[0]),
  (p: CubicPolynomial, i?: Interval.Interval) => {
    // shortcut to check for a horizontal line
    if (p.c3 === 0 && p.c2 === 0 && p.c1 === 0) {
      return 'constant'
    }

    // shortcut to check for a non-horizontal line
    if (p.c3 === 0 && p.c2 === 0) {
      return linear.monotonicity(linear.make(p.c0, p.c1, p.precision))
    }

    // without an interval, the monotonicity will be none if c3 or c2 are nonzero
    if (i === undefined) {
      return 'none'
    }

    // if the interval is a single point, the monotonicity is constant
    if (Interval.size(i) === 0) {
      return 'constant'
    }

    if (p.c3 === 0) {
      return quadratic.monotonicity(
        quadratic.make(p.c0, p.c1, p.c2, p.precision),
        i,
      )
    }

    const e = Interval.filter(i, extrema(p), {
      includeStart: false,
      includeEnd: false,
    })

    if (e.length > 0) {
      return 'none'
    }

    return guaranteedMonotonicityFromComparison(
      solve(p, i.start),
      solve(p, i.end),
    )
  },
)

export const domain = dual<
  (range: Interval.Interval) => (p: CubicPolynomial) => Interval.Interval,
  (p: CubicPolynomial, range: Interval.Interval) => Interval.Interval
>(2, (p: CubicPolynomial, range: Interval.Interval) =>
  Interval.fromMinMax(
    ...solveInverse(p, range.start),
    ...solveInverse(p, range.end),
  ),
)

export const range = dual<
  (domain: Interval.Interval) => (p: CubicPolynomial) => Interval.Interval,
  (p: CubicPolynomial, domain: Interval.Interval) => Interval.Interval
>(2, (p: CubicPolynomial, domain: Interval.Interval) =>
  Interval.fromMinMax(
    solve(p, domain.start),
    solve(p, domain.end),
    ...Interval.filter(domain, extrema(p)).map((e) => solve(p, e)),
  ),
)
