import * as Interval2d from '../interval/interval2d.ts'
import * as Interval from '../interval/interval.ts'
import { dual, Pipeable } from '../utils.ts'
import * as LinearPolynomial from '../polynomial/linear.ts'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits.ts'
import * as Solution from '../solution/solution.ts'
import * as Vector2 from '../vector/vector2.ts'
import type { LinearCurve2d } from './linear2d.ts'

export const LinearCurve2dTypeId: unique symbol = Symbol('curvy/curve/linear2d')
export type LinearCurve2dTypeId = typeof LinearCurve2dTypeId

/** @internal */
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

/** @internal */
export const fromPolynomials: (
  c0: LinearPolynomial.LinearPolynomial,
  c1: LinearPolynomial.LinearPolynomial,
) => LinearCurve2d = (c0, c1) => new LinearCurve2dImpl(c0, c1)

/** @internal */
export const fromCoefficients: (c0: Vector2.Vector2, c1: Vector2.Vector2) => LinearCurve2d = (
  c0,
  c1,
) => new LinearCurve2dImpl(LinearPolynomial.make(c0.x, c1.x), LinearPolynomial.make(c0.y, c1.y))

// Linear Bernstein basis: B(t) = (1-t)·p0 + t·p1
// Expanding to monomial form gives c0 = p0, c1 = p1 - p0.
/** @internal */
export const fromEndpoints: (p0: Vector2.Vector2, p1: Vector2.Vector2) => LinearCurve2d = (
  p0,
  p1,
) =>
  new LinearCurve2dImpl(
    LinearPolynomial.make(p0.x, p1.x - p0.x),
    LinearPolynomial.make(p0.y, p1.y - p0.y),
  )

/** @internal */
export const isLinearCurve2d = (c: unknown): c is LinearCurve2d =>
  typeof c === 'object' && c !== null && LinearCurve2dTypeId in c

/** @internal */
export const derivative = (c: LinearCurve2d) => Vector2.make(c.x.c1, c.y.c1)

/** @internal */
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
/** @internal */
export const solveAtX = dual(2, (c: LinearCurve2d, x: number) =>
  LinearPolynomial.solveInverse(c.x, x).pipe(
    Solution.clip(Interval.unit),
    Solution.map((t) => LinearPolynomial.solve(c.y, t)),
  ),
)

/** @internal */
export const solveAtY = dual(2, (c: LinearCurve2d, y: number) =>
  LinearPolynomial.solveInverse(c.y, y).pipe(
    Solution.clip(Interval.unit),
    Solution.map((t) => LinearPolynomial.solve(c.x, t)),
  ),
)

/** @internal */
export const length = dual(
  2,
  (c: LinearCurve2d, i: Interval.Interval) =>
    Math.sqrt(c.x.c1 ** 2 + c.y.c1 ** 2) * Math.abs(i.end - i.start),
)

/** @internal */
export const boundingBox = (
  c: LinearCurve2d,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> =>
  Interval2d.make(LinearPolynomial.unitRange(c.x), LinearPolynomial.unitRange(c.y))

/** @internal */
export const startPoint = (c: LinearCurve2d): Vector2.Vector2 => Vector2.make(c.x.c0, c.y.c0)

/** @internal */
export const endPoint = (c: LinearCurve2d): Vector2.Vector2 =>
  Vector2.make(c.x.c0 + c.x.c1, c.y.c0 + c.y.c1)

/** @internal */
export const xRange = (c: LinearCurve2d): Interval.Closed => LinearPolynomial.unitRange(c.x)

/** @internal */
export const yRange = (c: LinearCurve2d): Interval.Closed => LinearPolynomial.unitRange(c.y)

/** @internal */
export const toPathDataSegment = (c: LinearCurve2d): string => {
  const endX = c.x.c0 + c.x.c1
  const endY = c.y.c0 + c.y.c1
  return `L ${endX},${endY}`
}

// Per-axis trait refiners delegate to the polynomial-level check on a single
// axis and brand only that axis. The combined refiners (below) fan out to
// both axes.
/** @internal */
export const isMonotonicX = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT & Monotonic, YT> => LinearPolynomial.isMonotonic(c.x)

/** @internal */
export const isIncreasingX = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT & Increasing, YT> => LinearPolynomial.isIncreasing(c.x)

/** @internal */
export const isDecreasingX = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT & Decreasing, YT> => LinearPolynomial.isDecreasing(c.x)

/** @internal */
export const isMonotonicY = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT, YT & Monotonic> => LinearPolynomial.isMonotonic(c.y)

/** @internal */
export const isIncreasingY = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT, YT & Increasing> => LinearPolynomial.isIncreasing(c.y)

/** @internal */
export const isDecreasingY = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT, YT & Decreasing> => LinearPolynomial.isDecreasing(c.y)

/** @internal */
export const isMonotonic = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT & Monotonic, YT & Monotonic> => isMonotonicX(c) && isMonotonicY(c)

/** @internal */
export const isIncreasing = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT & Increasing, YT & Increasing> => isIncreasingX(c) && isIncreasingY(c)

/** @internal */
export const isDecreasing = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): c is LinearCurve2d<XT & Decreasing, YT & Decreasing> => isDecreasingX(c) && isDecreasingY(c)

const fail = (m: string): never => {
  throw new Error(m)
}

/** @internal */
export const asMonotonic = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): LinearCurve2d<XT & Monotonic, YT & Monotonic> =>
  isMonotonic(c) ? c : fail('linear curve is not monotonic in both axes')

/** @internal */
export const asIncreasing = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): LinearCurve2d<XT & Increasing, YT & Increasing> =>
  isIncreasing(c) ? c : fail('linear curve is not increasing in both axes')

/** @internal */
export const asDecreasing = <XT, YT>(
  c: LinearCurve2d<XT, YT>,
): LinearCurve2d<XT & Decreasing, YT & Decreasing> =>
  isDecreasing(c) ? c : fail('linear curve is not decreasing in both axes')
