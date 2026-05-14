import * as Interval2d from '../interval/interval2d.ts'
import * as QuadraticCurve2d from '../curve/quadratic2d.ts'
import * as Interval from '../interval/interval.ts'
import * as QuadraticPolynomial from '../polynomial/quadratic.ts'
import * as Solution from '../solution/solution.ts'
import { dual, Pipeable } from '../utils.ts'
import { invariant } from '../utils.ts'
import { EPSILON, epsEquals } from '../number.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { QuadraticPath2d } from './quadratic2d.ts'
import {
  PathTraits,
  type Continuous,
  type DecreasingX,
  type DecreasingY,
  type IncreasingX,
  type IncreasingY,
  type MonotonicX,
  type MonotonicY,
} from './traits.ts'

export const QuadraticPath2dTypeId: unique symbol = Symbol('curvy/path/quadratic2d')
export type QuadraticPath2dTypeId = typeof QuadraticPath2dTypeId

/** @internal */
export class QuadraticPath2dImpl extends Pipeable implements QuadraticPath2d<unknown> {
  readonly [QuadraticPath2dTypeId]: QuadraticPath2dTypeId = QuadraticPath2dTypeId
  declare readonly [PathTraits]: unknown

  readonly curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>

  constructor(curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>) {
    super()
    this.curves = curves
  }

  [Symbol.iterator](): Iterator<QuadraticCurve2d.QuadraticCurve2d> {
    return this.curves[Symbol.iterator]()
  }
}

/** @internal */
export const isQuadraticPath2d = (p: unknown): p is QuadraticPath2d =>
  typeof p === 'object' && p !== null && QuadraticPath2dTypeId in p

/** @internal */
export const make = (
  ...curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>
): QuadraticPath2d => new QuadraticPath2dImpl(curves)

/** @internal */
export const fromArray = (
  curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>,
): QuadraticPath2d => new QuadraticPath2dImpl(curves)

/** @internal */
export const append = dual<
  (c: QuadraticCurve2d.QuadraticCurve2d) => (p: QuadraticPath2d) => QuadraticPath2d,
  (p: QuadraticPath2d, c: QuadraticCurve2d.QuadraticCurve2d) => QuadraticPath2d
>(2, (p: QuadraticPath2d, c: QuadraticCurve2d.QuadraticCurve2d) => fromArray([...p, c]))

/** @internal */
export const length = (p: QuadraticPath2d) => {
  let total = 0
  for (const curve of p) {
    total += QuadraticCurve2d.length(curve, Interval.unit)
  }

  return total
}

/** @internal */
export const solve = dual<
  (u: number) => (p: QuadraticPath2d) => Vector2,
  (p: QuadraticPath2d, u: number) => Vector2
>(2, (p: QuadraticPath2d, u: number) => {
  const curves = p instanceof QuadraticPath2dImpl ? p.curves : [...p]

  if (u === 1) {
    const last = curves.at(-1) as QuadraticCurve2d.QuadraticCurve2d
    return QuadraticCurve2d.solve(last, 1)
  }

  const t = u * curves.length
  const i = Math.floor(t)
  const curve = curves[i] as QuadraticCurve2d.QuadraticCurve2d
  return QuadraticCurve2d.solve(curve, t - i)
})

// Quadratic Bernstein basis: P(t) = (1-t)²·p0 + 2(1-t)t·p1 + t²·p2
// expanded gives c0 = p0, c1 = -2p0 + 2p1, c2 = p0 - 2p1 + p2, so:
//   p0 = c0, p1 = c0 + c1/2, p2 = c0 + c1 + c2.
/** @internal */
export const toPathData = (p: QuadraticPath2d): string => {
  let result = ''
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN

  for (const curve of p) {
    const c0x = curve.x.c0
    const c0y = curve.y.c0
    const c1x = curve.x.c1
    const c1y = curve.y.c1
    const c2x = curve.x.c2
    const c2y = curve.y.c2

    const startX = c0x
    const startY = c0y
    const ctrlX = c0x + c1x / 2
    const ctrlY = c0y + c1y / 2
    const endX = c0x + c1x + c2x
    const endY = c0y + c1y + c2y

    if (!epsEquals(startX, prevEndX) || !epsEquals(startY, prevEndY)) {
      result += ` M ${startX},${startY}`
    }
    result += ` Q ${ctrlX},${ctrlY} ${endX},${endY}`

    prevEndX = endX
    prevEndY = endY
  }

  return result.slice(1)
}

/** @internal */
export const isContinuous = <T>(p: QuadraticPath2d<T>): p is QuadraticPath2d<T & Continuous> => {
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN
  let first = true

  for (const curve of p) {
    const startX = curve.x.c0
    const startY = curve.y.c0
    if (!first && (!epsEquals(startX, prevEndX) || !epsEquals(startY, prevEndY))) {
      return false
    }
    prevEndX = curve.x.c0 + curve.x.c1 + curve.x.c2
    prevEndY = curve.y.c0 + curve.y.c1 + curve.y.c2
    first = false
  }
  return true
}

/** @internal */
export const asContinuous = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & Continuous> => {
  invariant(isContinuous(p), 'quadratic path is not continuous')
  return p
}

// Per-axis monotonicity for the path: every segment's axis polynomial must be
// strictly monotonic over the unit interval AND adjacent segments' axis
// ranges must not overlap (modulo EPSILON for float drift).
/** @internal */
export const isIncreasingX = <T>(p: QuadraticPath2d<T>): p is QuadraticPath2d<T & IncreasingX> => {
  let prevEnd = Number.NEGATIVE_INFINITY
  for (const c of p) {
    if (!QuadraticPolynomial.isIncreasing(c.x, Interval.unit)) {
      return false
    }
    if (c.x.c0 < prevEnd - EPSILON) {
      return false
    }
    prevEnd = c.x.c0 + c.x.c1 + c.x.c2
  }
  return true
}

/** @internal */
export const isDecreasingX = <T>(p: QuadraticPath2d<T>): p is QuadraticPath2d<T & DecreasingX> => {
  let prevEnd = Number.POSITIVE_INFINITY
  for (const c of p) {
    if (!QuadraticPolynomial.isDecreasing(c.x, Interval.unit)) {
      return false
    }
    if (c.x.c0 > prevEnd + EPSILON) {
      return false
    }
    prevEnd = c.x.c0 + c.x.c1 + c.x.c2
  }
  return true
}

/** @internal */
export const isMonotonicX = <T>(p: QuadraticPath2d<T>): p is QuadraticPath2d<T & MonotonicX> =>
  isIncreasingX(p) || isDecreasingX(p)

/** @internal */
export const isIncreasingY = <T>(p: QuadraticPath2d<T>): p is QuadraticPath2d<T & IncreasingY> => {
  let prevEnd = Number.NEGATIVE_INFINITY
  for (const c of p) {
    if (!QuadraticPolynomial.isIncreasing(c.y, Interval.unit)) {
      return false
    }
    if (c.y.c0 < prevEnd - EPSILON) {
      return false
    }
    prevEnd = c.y.c0 + c.y.c1 + c.y.c2
  }
  return true
}

/** @internal */
export const isDecreasingY = <T>(p: QuadraticPath2d<T>): p is QuadraticPath2d<T & DecreasingY> => {
  let prevEnd = Number.POSITIVE_INFINITY
  for (const c of p) {
    if (!QuadraticPolynomial.isDecreasing(c.y, Interval.unit)) {
      return false
    }
    if (c.y.c0 > prevEnd + EPSILON) {
      return false
    }
    prevEnd = c.y.c0 + c.y.c1 + c.y.c2
  }
  return true
}

/** @internal */
export const isMonotonicY = <T>(p: QuadraticPath2d<T>): p is QuadraticPath2d<T & MonotonicY> =>
  isIncreasingY(p) || isDecreasingY(p)

/** @internal */
export const asIncreasingX = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & IncreasingX> => {
  invariant(isIncreasingX(p), 'quadratic path is not increasing in x')
  return p
}

/** @internal */
export const asDecreasingX = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & DecreasingX> => {
  invariant(isDecreasingX(p), 'quadratic path is not decreasing in x')
  return p
}

/** @internal */
export const asMonotonicX = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & MonotonicX> => {
  invariant(isMonotonicX(p), 'quadratic path is not monotonic in x')
  return p
}

/** @internal */
export const asIncreasingY = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & IncreasingY> => {
  invariant(isIncreasingY(p), 'quadratic path is not increasing in y')
  return p
}

/** @internal */
export const asDecreasingY = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & DecreasingY> => {
  invariant(isDecreasingY(p), 'quadratic path is not decreasing in y')
  return p
}

/** @internal */
export const asMonotonicY = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & MonotonicY> => {
  invariant(isMonotonicY(p), 'quadratic path is not monotonic in y')
  return p
}

// solveAtX/Y on a monotonic-axis path: locate the segment whose axis range
// contains the queried value, then delegate to the curve solver. Since the
// path is monotonic in that axis, at most one segment matches and the
// curve-level call is single-valued.
/** @internal */
export const solveAtX = dual(2, (p: QuadraticPath2d, x: number): Solution.AtMostOne<number> => {
  for (const c of p) {
    const sx = c.x.c0
    const ex = c.x.c0 + c.x.c1 + c.x.c2
    const lo = Math.min(sx, ex)
    const hi = Math.max(sx, ex)
    if (x >= lo - EPSILON && x <= hi + EPSILON) {
      return QuadraticCurve2d.solveAtX(c, x) as Solution.AtMostOne<number>
    }
  }
  return Solution.none
})

/** @internal */
export const solveAtY = dual(2, (p: QuadraticPath2d, y: number): Solution.AtMostOne<number> => {
  for (const c of p) {
    const sy = c.y.c0
    const ey = c.y.c0 + c.y.c1 + c.y.c2
    const lo = Math.min(sy, ey)
    const hi = Math.max(sy, ey)
    if (y >= lo - EPSILON && y <= hi + EPSILON) {
      return QuadraticCurve2d.solveAtY(c, y) as Solution.AtMostOne<number>
    }
  }
  return Solution.none
})

/** @internal */
export const boundingBox = (
  p: QuadraticPath2d,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> => {
  const iter = p[Symbol.iterator]()
  const first = iter.next()
  let acc = QuadraticCurve2d.boundingBox(first.value as QuadraticCurve2d.QuadraticCurve2d)
  for (let next = iter.next(); !next.done; next = iter.next()) {
    acc = Interval2d.union(acc, QuadraticCurve2d.boundingBox(next.value))
  }
  return acc
}
