import * as Interval from '../interval'
import {
  GL32_W0,
  GL32_W1,
  GL32_W2,
  GL32_W3,
  GL32_W4,
  GL32_W5,
  GL32_W6,
  GL32_W7,
  GL32_W8,
  GL32_W9,
  GL32_W10,
  GL32_W11,
  GL32_W12,
  GL32_W13,
  GL32_W14,
  GL32_W15,
  GL32_X0,
  GL32_X1,
  GL32_X2,
  GL32_X3,
  GL32_X4,
  GL32_X5,
  GL32_X6,
  GL32_X7,
  GL32_X8,
  GL32_X9,
  GL32_X10,
  GL32_X11,
  GL32_X12,
  GL32_X13,
  GL32_X14,
  GL32_X15,
} from '../length'
import { dual } from '../pipe'
import { round } from '../utils'
import type { Vector4 } from '../vector/vector4'
import type { CubicPolynomial } from './cubic'
import { CubicPolynomialImpl, CubicPolynomialTypeId } from './cubic.internal.circular'
import * as Linear from './linear.internal'
import { type Monotonicity, guaranteedMonotonicityFromComparison } from './monotonicity'
import * as Quadratic from './quadratic.internal'
import type { ZeroToThree, ZeroToTwo } from './types'

export const make = (c0 = 0, c1 = 0, c2 = 0, c3 = 0): CubicPolynomial =>
  new CubicPolynomialImpl(c0, c1, c2, c3)

export const isCubicPolynomial = (v: unknown): v is CubicPolynomial =>
  typeof v === 'object' && v !== null && CubicPolynomialTypeId in v

export const fromVector = (v: Vector4) => new CubicPolynomialImpl(v.x, v.y, v.z, v.w)

export const solve = dual<
  (x: number) => (p: CubicPolynomial) => number,
  (p: CubicPolynomial, x: number) => number
>(2, (p: CubicPolynomial, x: number) => round(p.c0 + x * p.c1 + x ** 2 * p.c2 + x ** 3 * p.c3))

export const toSolver = (p: CubicPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual<
  (y: number) => (p: CubicPolynomial) => ZeroToThree,
  (p: CubicPolynomial, y: number) => ZeroToThree
>(2, (self: CubicPolynomial, y: number) => {
  if (self.c3 === 0) {
    return Quadratic.solveInverse(Quadratic.make(self.c0, self.c1, self.c2), 0) as ZeroToThree
  }

  const shift = self.c2 / (3 * self.c3)

  const d0 = self.c2 ** 2 - 3 * self.c3 * self.c1
  const d1 = 2 * self.c2 ** 3 - 9 * self.c3 * self.c2 * self.c1 + 27 * self.c3 ** 2 * (self.c0 - y)

  const p = -d0 / (3 * self.c3 ** 2)
  const q = d1 / (27 * self.c3 ** 3)

  const discriminant = round(-(4 * p ** 3 + 27 * q ** 2), 12)

  const roots = new Set<number>()

  if (discriminant > 0) {
    const r = 2 * Math.sqrt(-p / 3)
    const theta = Math.acos(((3 * q) / (2 * p)) * Math.sqrt(-3 / p)) / 3
    const offset = (2 * Math.PI) / 3

    roots.add(round(r * Math.cos(theta + offset) - shift))
    roots.add(round(r * Math.cos(theta) - shift))
    roots.add(round(r * Math.cos(theta - offset) - shift))
  } else if (discriminant < 0) {
    const u = Math.sqrt(q ** 2 / 4 + p ** 3 / 27)

    const u1 = Math.cbrt(-q / 2 + u)
    const u2 = Math.cbrt(-q / 2 - u)

    roots.add(round(u1 + u2 - shift))
  } else if (d0 === 0) {
    roots.add(round(-shift))
  } else {
    roots.add(round((9 * self.c3 * (self.c0 - y) - self.c2 * self.c1) / (2 * d0)))
    roots.add(
      round(
        (4 * self.c3 * self.c2 * self.c1 - 9 * self.c3 ** 2 * (self.c0 - y) - self.c2 ** 3) /
          (self.c3 * d0),
      ),
    )
  }

  return Array.from(roots).toSorted((a, b) => a - b) as unknown as ZeroToThree
})

export const toInverseSolver = (p: CubicPolynomial) => (y: number) => solveInverse(p, y)

export const derivative = (p: CubicPolynomial) => Quadratic.make(p.c1, p.c2 * 2, p.c3 * 3)

export const roots = (p: CubicPolynomial): ZeroToThree => solveInverse(p, 0)

export const extrema = (p: CubicPolynomial): ZeroToTwo => Quadratic.roots(derivative(p))

export const monotonicity = dual<
  (i: Interval.Interval) => (p: CubicPolynomial) => Monotonicity,
  (p: CubicPolynomial, i?: Interval.Interval) => Monotonicity
>(
  (args) => isCubicPolynomial(args[0]),
  (p: CubicPolynomial, i?: Interval.Interval) => {
    // shortcut to check for a horizontal line
    if (p.c3 === 0 && p.c2 === 0 && p.c1 === 0) {
      return 'constant'
    }

    // shortcut to check for a non-horizontal line
    if (p.c3 === 0 && p.c2 === 0) {
      return Linear.monotonicity(Linear.make(p.c0, p.c1))
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
      return Quadratic.monotonicity(Quadratic.make(p.c0, p.c1, p.c2), i)
    }

    const e = Interval.filter(i, extrema(p), {
      includeStart: false,
      includeEnd: false,
    })

    if (e.length > 0) {
      return 'none'
    }

    return guaranteedMonotonicityFromComparison(solve(p, i.start), solve(p, i.end))
  },
)

export const domain = dual<
  (range: Interval.Interval) => (p: CubicPolynomial) => Interval.Interval,
  (p: CubicPolynomial, range: Interval.Interval) => Interval.Interval
>(2, (p: CubicPolynomial, range: Interval.Interval) =>
  Interval.fromMinMax(...solveInverse(p, range.start), ...solveInverse(p, range.end)),
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

export const length = dual<
  (domain: Interval.Interval) => (p: CubicPolynomial) => number,
  (p: CubicPolynomial, domain: Interval.Interval) => number
>(2, (p: CubicPolynomial, domain: Interval.Interval) => {
  if (Interval.size(domain) === 0) {
    return 0
  }

  if (p.c3 === 0) {
    if (p.c2 === 0) {
      return Linear.length(Linear.make(p.c0, p.c1), domain)
    }

    return Quadratic.length(Quadratic.make(p.c0, p.c1, p.c2), domain)
  }

  const d = derivative(p)

  const { scale, shift } = Interval.scaleShift(Interval.biunit, domain)

  return round(
    (GL32_W0 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X0) ** 2) +
      GL32_W0 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X0) ** 2) +
      GL32_W1 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X1) ** 2) +
      GL32_W1 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X1) ** 2) +
      GL32_W2 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X2) ** 2) +
      GL32_W2 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X2) ** 2) +
      GL32_W3 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X3) ** 2) +
      GL32_W3 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X3) ** 2) +
      GL32_W4 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X4) ** 2) +
      GL32_W4 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X4) ** 2) +
      GL32_W5 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X5) ** 2) +
      GL32_W5 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X5) ** 2) +
      GL32_W6 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X6) ** 2) +
      GL32_W6 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X6) ** 2) +
      GL32_W7 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X7) ** 2) +
      GL32_W7 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X7) ** 2) +
      GL32_W8 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X8) ** 2) +
      GL32_W8 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X8) ** 2) +
      GL32_W9 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X9) ** 2) +
      GL32_W9 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X9) ** 2) +
      GL32_W10 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X10) ** 2) +
      GL32_W10 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X10) ** 2) +
      GL32_W11 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X11) ** 2) +
      GL32_W11 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X11) ** 2) +
      GL32_W12 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X12) ** 2) +
      GL32_W12 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X12) ** 2) +
      GL32_W13 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X13) ** 2) +
      GL32_W13 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X13) ** 2) +
      GL32_W14 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X14) ** 2) +
      GL32_W14 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X14) ** 2) +
      GL32_W15 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * -GL32_X15) ** 2) +
      GL32_W15 * Math.sqrt(1 + Quadratic.solve(d, shift + scale * GL32_X15) ** 2)) *
      scale,
  )
})

export const curvature = dual(2, (p: CubicPolynomial, x: number) => {
  const d = derivative(p)
  const dd = Quadratic.derivative(d)

  return round(Math.abs(Linear.solve(dd, x)) / (1 + Quadratic.solve(d, x) ** 2) ** 1.5)
})
