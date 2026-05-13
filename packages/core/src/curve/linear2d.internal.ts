import * as Box2d from '../box/box2d'
import * as Interval from '../interval/interval'
import { dual, Pipeable } from '../utils'
import * as LinearPolynomial from '../polynomial/linear'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits'
import * as Solution from '../solution/solution'
import * as Vector2 from '../vector/vector2'
import type { LinearCurve2d } from './linear2d'

export const LinearCurve2dTypeId: unique symbol = Symbol('curvy/curve/linear2d')
export type LinearCurve2dTypeId = typeof LinearCurve2dTypeId

export class LinearCurve2dImpl extends Pipeable implements LinearCurve2d<unknown, unknown> {
  readonly [LinearCurve2dTypeId]: LinearCurve2dTypeId = LinearCurve2dTypeId

  readonly x: LinearPolynomial.LinearPolynomial
  readonly y: LinearPolynomial.LinearPolynomial

  constructor(c0: LinearPolynomial.LinearPolynomial, c1: LinearPolynomial.LinearPolynomial) {
    super()
    this.x = c0
    this.y = c1
  }

  get [0]() {
    return this.x
  }

  get [1]() {
    return this.y
  }
}

export const fromPolynomials: (
  c0: LinearPolynomial.LinearPolynomial,
  c1: LinearPolynomial.LinearPolynomial,
) => LinearCurve2d = (c0, c1) => new LinearCurve2dImpl(c0, c1)

export const fromCoefficients: (c0: Vector2.Vector2, c1: Vector2.Vector2) => LinearCurve2d = (
  c0,
  c1,
) => new LinearCurve2dImpl(LinearPolynomial.make(c0.x, c1.x), LinearPolynomial.make(c0.y, c1.y))

// Linear Bernstein basis: B(t) = (1-t)·p0 + t·p1
// Expanding to monomial form gives c0 = p0, c1 = p1 - p0.
export const fromBezierPoints: (p0: Vector2.Vector2, p1: Vector2.Vector2) => LinearCurve2d = (
  p0,
  p1,
) =>
  new LinearCurve2dImpl(
    LinearPolynomial.make(p0.x, p1.x - p0.x),
    LinearPolynomial.make(p0.y, p1.y - p0.y),
  )

export const isLinearCurve2d = (c: unknown): c is LinearCurve2d =>
  typeof c === 'object' && c !== null && LinearCurve2dTypeId in c

export const derivative = (c: LinearCurve2d) => Vector2.make(c.x.c1, c.y.c1)

export const solve = dual<
  (t: number) => (c: LinearCurve2d) => Vector2.Vector2,
  (c: LinearCurve2d, t: number) => Vector2.Vector2
>(2, (c: LinearCurve2d, t: number) =>
  Vector2.make(LinearPolynomial.solve(c.x, t), LinearPolynomial.solve(c.y, t)),
)

// solveAtX: invert the x polynomial to find t, then evaluate y at t — only
// returning the result when t lies in the curve's parameter domain [0, 1].
// A linear curve crosses any vertical line at most once, so the result is
// always 0 or 1 element.
export const solveAtX = dual(2, (c: LinearCurve2d, x: number) =>
  Solution.match(LinearPolynomial.solveInverse(c.x, x), {
    onNone: () => Solution.none,
    onSome: ({ value: t }) =>
      t < 0 || t > 1 ? Solution.none : Solution.one(LinearPolynomial.solve(c.y, t)),
  }),
)

export const solveAtY = dual(2, (c: LinearCurve2d, y: number) =>
  Solution.match(LinearPolynomial.solveInverse(c.y, y), {
    onNone: () => Solution.none,
    onSome: ({ value: t }) =>
      t < 0 || t > 1 ? Solution.none : Solution.one(LinearPolynomial.solve(c.x, t)),
  }),
)

export const length = dual(
  2,
  (c: LinearCurve2d, i: Interval.Interval) =>
    Math.sqrt(c.x.c1 ** 2 + c.y.c1 ** 2) * Math.abs(i.end - i.start),
)

export const boundingBox = (c: LinearCurve2d): Box2d.Box2d<Interval.Closed, Interval.Closed> =>
  Box2d.make(LinearPolynomial.range(c.x, Interval.unit), LinearPolynomial.range(c.y, Interval.unit))

// Combined trait refiners — fan out the polynomial-level check across both
// axes. For per-axis checks, users can call `LinearPolynomial.isMonotonic(c.x)`
// directly.
export const isMonotonic = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT & Monotonic, YT & Monotonic> =>
  LinearPolynomial.isMonotonic(c.x) && LinearPolynomial.isMonotonic(c.y)

export const isIncreasing = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT & Increasing, YT & Increasing> =>
  LinearPolynomial.isIncreasing(c.x) && LinearPolynomial.isIncreasing(c.y)

export const isDecreasing = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT & Decreasing, YT & Decreasing> =>
  LinearPolynomial.isDecreasing(c.x) && LinearPolynomial.isDecreasing(c.y)

const fail = (m: string): never => {
  throw new Error(m)
}

export const asMonotonic = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): LinearCurve2d<XT & Monotonic, YT & Monotonic> =>
  isMonotonic(c) ? c : fail('linear curve is not monotonic in both axes')

export const asIncreasing = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): LinearCurve2d<XT & Increasing, YT & Increasing> =>
  isIncreasing(c) ? c : fail('linear curve is not increasing in both axes')

export const asDecreasing = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): LinearCurve2d<XT & Decreasing, YT & Decreasing> =>
  isDecreasing(c) ? c : fail('linear curve is not decreasing in both axes')
