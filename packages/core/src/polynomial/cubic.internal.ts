import * as Interval from '../interval/interval'
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
import { dual } from '../utils'
import * as Solution from '../solution/solution'
import { invariant } from '../utils'
import { clampToZero, epsEquals } from '../number'
import type * as Vector2 from '../vector/vector2'
import type { Vector4 } from '../vector/vector4'
import type { CubicPolynomial } from './cubic'
import { CubicPolynomialImpl, CubicPolynomialTypeId } from './cubic.internal.circular'
import type { Decreasing, Increasing, Monotonic } from './traits'
import * as Linear from './linear.internal'
import { guaranteedMonotonicityFromComparison, type Monotonicity } from './monotonicity'
import * as Quadratic from './quadratic.internal'

export const make = (c0 = 0, c1 = 0, c2 = 0, c3 = 0): CubicPolynomial =>
  new CubicPolynomialImpl(c0, c1, c2, c3)

export const isCubicPolynomial = (v: unknown): v is CubicPolynomial =>
  typeof v === 'object' && v !== null && CubicPolynomialTypeId in v

export const equals = dual<
  (b: CubicPolynomial) => (a: CubicPolynomial) => boolean,
  (a: CubicPolynomial, b: CubicPolynomial) => boolean
>(
  2,
  (a: CubicPolynomial, b: CubicPolynomial) =>
    epsEquals(a.c0, b.c0) &&
    epsEquals(a.c1, b.c1) &&
    epsEquals(a.c2, b.c2) &&
    epsEquals(a.c3, b.c3),
)

export const fromVector = (v: Vector4) => new CubicPolynomialImpl(v.x, v.y, v.z, v.w)

export const fromPoints = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
  p3: Vector2.Vector2,
): CubicPolynomial => {
  // Newton's divided differences, then collected to monomial form.
  const f01 = (p1.y - p0.y) / (p1.x - p0.x)
  const f12 = (p2.y - p1.y) / (p2.x - p1.x)
  const f23 = (p3.y - p2.y) / (p3.x - p2.x)
  const f012 = (f12 - f01) / (p2.x - p0.x)
  const f123 = (f23 - f12) / (p3.x - p1.x)
  const f0123 = (f123 - f012) / (p3.x - p0.x)

  return new CubicPolynomialImpl(
    p0.y - f01 * p0.x + f012 * p0.x * p1.x - f0123 * p0.x * p1.x * p2.x,
    f01 - f012 * (p0.x + p1.x) + f0123 * (p0.x * p1.x + p0.x * p2.x + p1.x * p2.x),
    f012 - f0123 * (p0.x + p1.x + p2.x),
    f0123,
  )
}

export const solve = dual<
  (x: number) => (p: CubicPolynomial) => number,
  (p: CubicPolynomial, x: number) => number
>(2, (p: CubicPolynomial, x: number) => p.c0 + x * p.c1 + x ** 2 * p.c2 + x ** 3 * p.c3)

export const toSolver = (p: CubicPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual<
  (y: number) => (p: CubicPolynomial) => Solution.AtMostThree<number>,
  (p: CubicPolynomial, y: number) => Solution.AtMostThree<number>
>(2, (self: CubicPolynomial, y: number) => {
  // c3 = 0: the polynomial is actually quadratic-or-less in disguise. Defer to
  // the quadratic solver (which itself handles c2 = 0 by deferring to linear).
  if (self.c3 === 0) {
    return Quadratic.solveInverse(Quadratic.make(self.c0, self.c1, self.c2), y)
  }

  const shift = self.c2 / (3 * self.c3)

  const d0 = self.c2 ** 2 - 3 * self.c3 * self.c1
  const d1 = 2 * self.c2 ** 3 - 9 * self.c3 * self.c2 * self.c1 + 27 * self.c3 ** 2 * (self.c0 - y)

  const p = -d0 / (3 * self.c3 ** 2)
  const q = d1 / (27 * self.c3 ** 3)

  const discriminant = clampToZero(-(4 * p ** 3 + 27 * q ** 2), 1e-12)

  const roots = new Set<number>()

  if (discriminant > 0) {
    const r = 2 * Math.sqrt(-p / 3)
    const theta = Math.acos(((3 * q) / (2 * p)) * Math.sqrt(-3 / p)) / 3
    const offset = (2 * Math.PI) / 3

    roots.add(r * Math.cos(theta + offset) - shift)
    roots.add(r * Math.cos(theta) - shift)
    roots.add(r * Math.cos(theta - offset) - shift)
  } else if (discriminant < 0) {
    const u = Math.sqrt(q ** 2 / 4 + p ** 3 / 27)

    const u1 = Math.cbrt(-q / 2 + u)
    const u2 = Math.cbrt(-q / 2 - u)

    roots.add(u1 + u2 - shift)
  } else if (d0 === 0) {
    roots.add(-shift)
  } else {
    roots.add((9 * self.c3 * (self.c0 - y) - self.c2 * self.c1) / (2 * d0))
    roots.add(
      (4 * self.c3 * self.c2 * self.c1 - 9 * self.c3 ** 2 * (self.c0 - y) - self.c2 ** 3) /
        (self.c3 * d0),
    )
  }

  return Solution.fromArray(Array.from(roots).toSorted((a, b) => a - b))
})

export const toInverseSolver = (p: CubicPolynomial) => (y: number) => solveInverse(p, y)

export const derivative = (p: CubicPolynomial) => Quadratic.make(p.c1, p.c2 * 2, p.c3 * 3)

// Subdivides a cubic polynomial at parameter `t ∈ (0, 1)` into two new cubic
// polynomials. The first polynomial's evaluation on `[0, 1]` matches the
// original's evaluation on `[0, t]`; the second matches the original's
// evaluation on `[t, 1]`. Concretely: `left(u) = p(t·u)` and
// `right(u) = p(t + (1-t)·u)`. The left half is a uniform scale of the input
// parameter by powers of `t`; the right half is a binomial expansion in
// `(s + r·u)` with `s = t` and `r = 1 - t`.
export const subdivide = dual<
  (t: number) => (p: CubicPolynomial) => [CubicPolynomial, CubicPolynomial],
  (p: CubicPolynomial, t: number) => [CubicPolynomial, CubicPolynomial]
>(2, (p: CubicPolynomial, t: number): [CubicPolynomial, CubicPolynomial] => {
  invariant(t > 0 && t < 1, 'subdivide parameter t must be in the open interval (0, 1)')

  const r = 1 - t
  const left = make(p.c0, p.c1 * t, p.c2 * t * t, p.c3 * t * t * t)
  const right = make(
    p.c0 + p.c1 * t + p.c2 * t * t + p.c3 * t * t * t,
    p.c1 * r + 2 * p.c2 * t * r + 3 * p.c3 * t * t * r,
    p.c2 * r * r + 3 * p.c3 * t * r * r,
    p.c3 * r * r * r,
  )
  return [left, right]
})

export const roots = (p: CubicPolynomial): Solution.AtMostThree<number> => solveInverse(p, 0)

export const extrema = (p: CubicPolynomial): Solution.AtMostTwo<number> =>
  Quadratic.roots(derivative(p))

export const monotonicity = dual<
  (i: Interval.Interval) => (p: CubicPolynomial) => Monotonicity,
  (p: CubicPolynomial, i?: Interval.Interval) => Monotonicity
>(
  (args) => isCubicPolynomial(args[0]),
  (p: CubicPolynomial, i?: Interval.Interval) => {
    invariant(
      i === undefined || Interval.size(i) > 0,
      'monotonicity is undefined over a zero-width interval',
    )

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

    if (p.c3 === 0) {
      return Quadratic.monotonicity(Quadratic.make(p.c0, p.c1, p.c2), i)
    }

    const e = Interval.filter(Interval.toOpen(i), [...extrema(p)])

    if (e.length > 0) {
      return 'none'
    }

    return guaranteedMonotonicityFromComparison(solve(p, i.start), solve(p, i.end))
  },
)

export const isMonotonic = dual<
  (i: Interval.Interval) => <T>(p: CubicPolynomial<T>) => p is CubicPolynomial<T & Monotonic>,
  <T>(p: CubicPolynomial<T>, i?: Interval.Interval) => p is CubicPolynomial<T & Monotonic>
>((args) => isCubicPolynomial(args[0]), ((p: CubicPolynomial, i?: Interval.Interval) => {
  const m = monotonicity(p, i as Interval.Interval)
  return m === 'increasing' || m === 'decreasing'
}) as never)

export const isIncreasing = dual<
  (i: Interval.Interval) => <T>(p: CubicPolynomial<T>) => p is CubicPolynomial<T & Increasing>,
  <T>(p: CubicPolynomial<T>, i?: Interval.Interval) => p is CubicPolynomial<T & Increasing>
>(
  (args) => isCubicPolynomial(args[0]),
  ((p: CubicPolynomial, i?: Interval.Interval) =>
    monotonicity(p, i as Interval.Interval) === 'increasing') as never,
)

export const isDecreasing = dual<
  (i: Interval.Interval) => <T>(p: CubicPolynomial<T>) => p is CubicPolynomial<T & Decreasing>,
  <T>(p: CubicPolynomial<T>, i?: Interval.Interval) => p is CubicPolynomial<T & Decreasing>
>(
  (args) => isCubicPolynomial(args[0]),
  ((p: CubicPolynomial, i?: Interval.Interval) =>
    monotonicity(p, i as Interval.Interval) === 'decreasing') as never,
)

export const asMonotonic = <T>(
  p: CubicPolynomial<T>,
  i?: Interval.Interval,
): CubicPolynomial<T & Monotonic> => {
  invariant(isMonotonic(p, i as Interval.Interval), 'cubic polynomial is not monotonic')
  return p
}

export const asIncreasing = <T>(
  p: CubicPolynomial<T>,
  i?: Interval.Interval,
): CubicPolynomial<T & Increasing> => {
  invariant(isIncreasing(p, i as Interval.Interval), 'cubic polynomial is not increasing')
  return p
}

export const asDecreasing = <T>(
  p: CubicPolynomial<T>,
  i?: Interval.Interval,
): CubicPolynomial<T & Decreasing> => {
  invariant(isDecreasing(p, i as Interval.Interval), 'cubic polynomial is not decreasing')
  return p
}

export const domain = dual<
  (range: Interval.Interval) => (p: CubicPolynomial) => Interval.Interval,
  (p: CubicPolynomial, range: Interval.Interval) => Interval.Interval
>(2, (p: CubicPolynomial, r: Interval.Interval) =>
  Interval.fromMinMax(...solveInverse(p, r.start), ...solveInverse(p, r.end)),
)

export const range = dual<
  (domain: Interval.Interval) => (p: CubicPolynomial) => Interval.Interval,
  (p: CubicPolynomial, domain: Interval.Interval) => Interval.Interval
>(2, (p: CubicPolynomial, d: Interval.Interval) =>
  Interval.fromMinMax(
    solve(p, d.start),
    solve(p, d.end),
    ...Interval.filter(d, [...extrema(p)]).map((e) => solve(p, e)),
  ),
)

export const length = dual<
  (domain: Interval.Interval) => (p: CubicPolynomial) => number,
  (p: CubicPolynomial, domain: Interval.Interval) => number
>(2, (p: CubicPolynomial, dom: Interval.Interval) => {
  if (Interval.size(dom) === 0) {
    return 0
  }

  if (p.c3 === 0) {
    if (p.c2 === 0) {
      return Linear.length(Linear.make(p.c0, p.c1), dom)
    }

    return Quadratic.length(Quadratic.make(p.c0, p.c1, p.c2), dom)
  }

  const d = derivative(p)

  const { scale, shift } = Interval.scaleShift(Interval.biunit, dom)

  return (
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
    scale
  )
})

export const curvature = dual(2, (p: CubicPolynomial, x: number) => {
  const d = derivative(p)
  const dd = Quadratic.derivative(d)

  return Math.abs(Linear.solve(dd, x)) / (1 + Quadratic.solve(d, x) ** 2) ** 1.5
})
