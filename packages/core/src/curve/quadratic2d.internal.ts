import * as Interval2d from '../interval/interval2d.ts'
import * as Interval from '../interval/interval.ts'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits.ts'
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
} from '../length.ts'
import { dual, Pipeable } from '../utils.ts'
import * as LinearPolynomial from '../polynomial/linear.ts'
import * as QuadraticPolynomial from '../polynomial/quadratic.ts'
import * as Solution from '../solution/solution.ts'
import * as Vector2 from '../vector/vector2.ts'
import * as LinearCurve2d from './linear2d.ts'
import type { QuadraticCurve2d } from './quadratic2d.ts'

export const QuadraticCurve2dTypeId: unique symbol = Symbol('curvy/curve/quadratic2d')
export type QuadraticCurve2dTypeId = typeof QuadraticCurve2dTypeId

/** @internal */
export class QuadraticCurve2dImpl extends Pipeable implements QuadraticCurve2d<unknown, unknown> {
  readonly [QuadraticCurve2dTypeId]: QuadraticCurve2dTypeId = QuadraticCurve2dTypeId

  readonly x: QuadraticPolynomial.QuadraticPolynomial
  readonly y: QuadraticPolynomial.QuadraticPolynomial

  constructor(
    c0: QuadraticPolynomial.QuadraticPolynomial,
    c1: QuadraticPolynomial.QuadraticPolynomial,
  ) {
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
  c0: QuadraticPolynomial.QuadraticPolynomial,
  c1: QuadraticPolynomial.QuadraticPolynomial,
) => QuadraticCurve2d = (c0, c1) => new QuadraticCurve2dImpl(c0, c1)

/** @internal */
export const fromCoefficients: (
  c0: Vector2.Vector2,
  c1: Vector2.Vector2,
  c2: Vector2.Vector2,
) => QuadraticCurve2d = (c0, c1, c2) =>
  new QuadraticCurve2dImpl(
    QuadraticPolynomial.make(c0.x, c1.x, c2.x),
    QuadraticPolynomial.make(c0.y, c1.y, c2.y),
  )

// Quadratic Bernstein basis: B(t) = (1-t)²·p0 + 2(1-t)t·p1 + t²·p2
// Expanding to monomial form gives:
//   c0 = p0
//   c1 = -2p0 + 2p1
//   c2 = p0 - 2p1 + p2
/** @internal */
export const fromBezierPoints: (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
) => QuadraticCurve2d = (p0, p1, p2) =>
  new QuadraticCurve2dImpl(
    QuadraticPolynomial.make(p0.x, -2 * p0.x + 2 * p1.x, p0.x - 2 * p1.x + p2.x),
    QuadraticPolynomial.make(p0.y, -2 * p0.y + 2 * p1.y, p0.y - 2 * p1.y + p2.y),
  )

/** @internal */
export const isQuadraticCurve2d = (c: unknown): c is QuadraticCurve2d =>
  typeof c === 'object' && c !== null && QuadraticCurve2dTypeId in c

/** @internal */
export const solve = dual<
  (t: number) => (c: QuadraticCurve2d) => Vector2.Vector2,
  (c: QuadraticCurve2d, t: number) => Vector2.Vector2
>(2, (c: QuadraticCurve2d, t: number) =>
  Vector2.make(QuadraticPolynomial.solve(c.x, t), QuadraticPolynomial.solve(c.y, t)),
)

// solveAtX: invert the x polynomial to find ts within the unit interval, then
// evaluate y at each surviving t. Result order matches solveInverse order
// (t-ascending).
/** @internal */
export const solveAtX = dual(2, (c: QuadraticCurve2d, x: number) => {
  const ts = Solution.clip(QuadraticPolynomial.solveInverse(c.x, x), Interval.unit)
  return Solution.map(ts, (t) => QuadraticPolynomial.solve(c.y, t))
})

/** @internal */
export const solveAtY = dual(2, (c: QuadraticCurve2d, y: number) => {
  const ts = Solution.clip(QuadraticPolynomial.solveInverse(c.y, y), Interval.unit)
  return Solution.map(ts, (t) => QuadraticPolynomial.solve(c.x, t))
})

/** @internal */
export const derivative = (c: QuadraticCurve2d) =>
  LinearCurve2d.fromPolynomials(
    QuadraticPolynomial.derivative(c.x),
    QuadraticPolynomial.derivative(c.y),
  )

/** @internal */
export const length = dual(2, (c: QuadraticCurve2d, i: Interval.Interval) => {
  if (Interval.size(i) === 0) {
    return 0
  }

  if (c.x.c2 === 0 && c.y.c2 === 0) {
    return LinearCurve2d.length(
      LinearCurve2d.fromPolynomials(
        LinearPolynomial.make(c.x.c0, c.x.c1),
        LinearPolynomial.make(c.y.c0, c.y.c1),
      ),
      i,
    )
  }

  const d = derivative(c)

  const { scale, shift } = Interval.scaleShift(Interval.biunit, i)

  return (
    (GL32_W0 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X0)) +
      GL32_W0 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X0)) +
      GL32_W1 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X1)) +
      GL32_W1 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X1)) +
      GL32_W2 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X2)) +
      GL32_W2 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X2)) +
      GL32_W3 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X3)) +
      GL32_W3 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X3)) +
      GL32_W4 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X4)) +
      GL32_W4 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X4)) +
      GL32_W5 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X5)) +
      GL32_W5 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X5)) +
      GL32_W6 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X6)) +
      GL32_W6 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X6)) +
      GL32_W7 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X7)) +
      GL32_W7 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X7)) +
      GL32_W8 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X8)) +
      GL32_W8 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X8)) +
      GL32_W9 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X9)) +
      GL32_W9 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X9)) +
      GL32_W10 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X10)) +
      GL32_W10 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X10)) +
      GL32_W11 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X11)) +
      GL32_W11 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X11)) +
      GL32_W12 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X12)) +
      GL32_W12 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X12)) +
      GL32_W13 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X13)) +
      GL32_W13 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X13)) +
      GL32_W14 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X14)) +
      GL32_W14 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X14)) +
      GL32_W15 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X15)) +
      GL32_W15 * Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X15))) *
    scale
  )
})

/** @internal */
export const curvature = dual(2, (c: QuadraticCurve2d, t: number) => {
  const d = derivative(c)
  const v = LinearCurve2d.solve(d, t)
  const a = LinearCurve2d.derivative(d)

  const vMag = Vector2.magnitude(v)

  if (vMag === 0) {
    return 0
  }

  return Math.abs(Vector2.cross(v, a)) / vMag ** 3
})

/** @internal */
export const boundingBox = (
  c: QuadraticCurve2d,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> =>
  Interval2d.make(
    QuadraticPolynomial.range(c.x, Interval.unit),
    QuadraticPolynomial.range(c.y, Interval.unit),
  )

// Combined trait refiners — fan out the polynomial-level check across both
// axes, over the unit interval. For per-axis checks, users can call
// `QuadraticPolynomial.isMonotonic(c.x, Interval.unit)` directly.
/** @internal */
export const isMonotonic = <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
): c is QuadraticCurve2d<XT & Monotonic, YT & Monotonic> =>
  QuadraticPolynomial.isMonotonic(c.x, Interval.unit) &&
  QuadraticPolynomial.isMonotonic(c.y, Interval.unit)

/** @internal */
export const isIncreasing = <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
): c is QuadraticCurve2d<XT & Increasing, YT & Increasing> =>
  QuadraticPolynomial.isIncreasing(c.x, Interval.unit) &&
  QuadraticPolynomial.isIncreasing(c.y, Interval.unit)

/** @internal */
export const isDecreasing = <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
): c is QuadraticCurve2d<XT & Decreasing, YT & Decreasing> =>
  QuadraticPolynomial.isDecreasing(c.x, Interval.unit) &&
  QuadraticPolynomial.isDecreasing(c.y, Interval.unit)

const fail = (m: string): never => {
  throw new Error(m)
}

/** @internal */
export const asMonotonic = <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
): QuadraticCurve2d<XT & Monotonic, YT & Monotonic> =>
  isMonotonic(c) ? c : fail('quadratic curve is not monotonic in both axes')

/** @internal */
export const asIncreasing = <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
): QuadraticCurve2d<XT & Increasing, YT & Increasing> =>
  isIncreasing(c) ? c : fail('quadratic curve is not increasing in both axes')

/** @internal */
export const asDecreasing = <XT, YT>(
  c: QuadraticCurve2d<XT, YT>,
): QuadraticCurve2d<XT & Decreasing, YT & Decreasing> =>
  isDecreasing(c) ? c : fail('quadratic curve is not decreasing in both axes')
