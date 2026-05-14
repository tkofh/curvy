import * as Interval2d from '../interval/interval2d.ts'
import * as LinearCurve2d from '../curve/linear2d.ts'
import * as Interval from '../interval/interval.ts'
import * as LinearPolynomial from '../polynomial/linear.ts'
import * as Solution from '../solution/solution.ts'
import { dual, Pipeable } from '../utils.ts'
import { invariant } from '../utils.ts'
import { EPSILON, epsEquals } from '../number.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { LinearPath2d } from './linear2d.ts'
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

export const LinearPath2dTypeId: unique symbol = Symbol('curvy/path/linear2d')
export type LinearPath2dTypeId = typeof LinearPath2dTypeId

/** @internal */
export class LinearPath2dImpl extends Pipeable implements LinearPath2d<unknown> {
  readonly [LinearPath2dTypeId]: LinearPath2dTypeId = LinearPath2dTypeId
  declare readonly [PathTraits]: unknown

  readonly curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>

  constructor(curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>) {
    super()
    this.curves = curves
  }

  [Symbol.iterator](): Iterator<LinearCurve2d.LinearCurve2d> {
    return this.curves[Symbol.iterator]()
  }
}

/** @internal */
export const isLinearPath2d = (p: unknown): p is LinearPath2d =>
  typeof p === 'object' && p !== null && LinearPath2dTypeId in p

/** @internal */
export const make = (...curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>): LinearPath2d =>
  new LinearPath2dImpl(curves)

/** @internal */
export const fromArray = (curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>) =>
  new LinearPath2dImpl(curves)

/** @internal */
export const append = dual<
  (c: LinearCurve2d.LinearCurve2d) => (p: LinearPath2d) => LinearPath2d,
  (p: LinearPath2d, c: LinearCurve2d.LinearCurve2d) => LinearPath2d
>(2, (p: LinearPath2d, c: LinearCurve2d.LinearCurve2d) => fromArray([...p, c]))

/** @internal */
export const length = (p: LinearPath2d) => {
  let total = 0
  for (const curve of p) {
    total += LinearCurve2d.length(curve, Interval.unit)
  }

  return total
}

/** @internal */
export const solve = dual<
  (u: number) => (p: LinearPath2d) => Vector2,
  (p: LinearPath2d, u: number) => Vector2
>(2, (p: LinearPath2d, u: number) => {
  const curves = p instanceof LinearPath2dImpl ? p.curves : [...p]

  if (u === 1) {
    const last = curves.at(-1) as LinearCurve2d.LinearCurve2d
    return LinearCurve2d.solve(last, 1)
  }

  const t = u * curves.length
  const i = Math.floor(t)
  const curve = curves[i] as LinearCurve2d.LinearCurve2d
  return LinearCurve2d.solve(curve, t - i)
})

/** @internal */
export const toPathData = (p: LinearPath2d): string => {
  let result = ''
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN

  for (const curve of p) {
    const startX = curve.x.c0
    const startY = curve.y.c0
    const endX = curve.x.c0 + curve.x.c1
    const endY = curve.y.c0 + curve.y.c1

    if (!epsEquals(startX, prevEndX) || !epsEquals(startY, prevEndY)) {
      result += ` M ${startX},${startY}`
    }
    result += ` L ${endX},${endY}`

    prevEndX = endX
    prevEndY = endY
  }

  return result.slice(1)
}

/** @internal */
export const isContinuous = <T>(p: LinearPath2d<T>): p is LinearPath2d<T & Continuous> => {
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN
  let first = true

  for (const curve of p) {
    const startX = curve.x.c0
    const startY = curve.y.c0
    if (!first && (!epsEquals(startX, prevEndX) || !epsEquals(startY, prevEndY))) {
      return false
    }
    prevEndX = curve.x.c0 + curve.x.c1
    prevEndY = curve.y.c0 + curve.y.c1
    first = false
  }
  return true
}

/** @internal */
export const asContinuous = <T>(p: LinearPath2d<T>): LinearPath2d<T & Continuous> => {
  invariant(isContinuous(p), 'linear path is not continuous')
  return p
}

// Per-axis monotonicity refiners. A path is monotonic-on-an-axis when every
// segment's per-axis polynomial is strictly monotonic in the same direction
// AND adjacent segments' ranges on that axis don't overlap (modulo float
// tolerance) — so the path's u → axis mapping is monotonic across joins.

/** @internal */
export const isIncreasingX = <T>(p: LinearPath2d<T>): p is LinearPath2d<T & IncreasingX> => {
  let prevEnd = Number.NEGATIVE_INFINITY
  for (const c of p) {
    if (!LinearPolynomial.isIncreasing(c.x)) {
      return false
    }
    if (c.x.c0 < prevEnd - EPSILON) {
      return false
    }
    prevEnd = c.x.c0 + c.x.c1
  }
  return true
}

/** @internal */
export const isDecreasingX = <T>(p: LinearPath2d<T>): p is LinearPath2d<T & DecreasingX> => {
  let prevEnd = Number.POSITIVE_INFINITY
  for (const c of p) {
    if (!LinearPolynomial.isDecreasing(c.x)) {
      return false
    }
    if (c.x.c0 > prevEnd + EPSILON) {
      return false
    }
    prevEnd = c.x.c0 + c.x.c1
  }
  return true
}

/** @internal */
export const isMonotonicX = <T>(p: LinearPath2d<T>): p is LinearPath2d<T & MonotonicX> =>
  isIncreasingX(p) || isDecreasingX(p)

/** @internal */
export const isIncreasingY = <T>(p: LinearPath2d<T>): p is LinearPath2d<T & IncreasingY> => {
  let prevEnd = Number.NEGATIVE_INFINITY
  for (const c of p) {
    if (!LinearPolynomial.isIncreasing(c.y)) {
      return false
    }
    if (c.y.c0 < prevEnd - EPSILON) {
      return false
    }
    prevEnd = c.y.c0 + c.y.c1
  }
  return true
}

/** @internal */
export const isDecreasingY = <T>(p: LinearPath2d<T>): p is LinearPath2d<T & DecreasingY> => {
  let prevEnd = Number.POSITIVE_INFINITY
  for (const c of p) {
    if (!LinearPolynomial.isDecreasing(c.y)) {
      return false
    }
    if (c.y.c0 > prevEnd + EPSILON) {
      return false
    }
    prevEnd = c.y.c0 + c.y.c1
  }
  return true
}

/** @internal */
export const isMonotonicY = <T>(p: LinearPath2d<T>): p is LinearPath2d<T & MonotonicY> =>
  isIncreasingY(p) || isDecreasingY(p)

/** @internal */
export const asIncreasingX = <T>(p: LinearPath2d<T>): LinearPath2d<T & IncreasingX> => {
  invariant(isIncreasingX(p), 'linear path is not increasing in x')
  return p
}

/** @internal */
export const asDecreasingX = <T>(p: LinearPath2d<T>): LinearPath2d<T & DecreasingX> => {
  invariant(isDecreasingX(p), 'linear path is not decreasing in x')
  return p
}

/** @internal */
export const asMonotonicX = <T>(p: LinearPath2d<T>): LinearPath2d<T & MonotonicX> => {
  invariant(isMonotonicX(p), 'linear path is not monotonic in x')
  return p
}

/** @internal */
export const asIncreasingY = <T>(p: LinearPath2d<T>): LinearPath2d<T & IncreasingY> => {
  invariant(isIncreasingY(p), 'linear path is not increasing in y')
  return p
}

/** @internal */
export const asDecreasingY = <T>(p: LinearPath2d<T>): LinearPath2d<T & DecreasingY> => {
  invariant(isDecreasingY(p), 'linear path is not decreasing in y')
  return p
}

/** @internal */
export const asMonotonicY = <T>(p: LinearPath2d<T>): LinearPath2d<T & MonotonicY> => {
  invariant(isMonotonicY(p), 'linear path is not monotonic in y')
  return p
}

// solveAtX/solveAtY for `Monotonic{X,Y}` paths. Two defenses against float
// drift at interior knots (where adjacent segments both bracket the query):
//   1. Snap to t=0/t=1 endpoint y when the query is within EPSILON of a
//      segment's start or end.
//   2. Fall through to the next bracketing segment on `none`. Linear paths
//      don't currently surface drift (degree-1 `c0 + c1 = x` is stable), but
//      the same shape applies for symmetry with quadratic / cubic.
/** @internal */
export const solveAtX = dual(2, (p: LinearPath2d, x: number): Solution.AtMostOne<number> => {
  for (const c of p) {
    const sx = c.x.c0
    const ex = c.x.c0 + c.x.c1
    const lo = Math.min(sx, ex)
    const hi = Math.max(sx, ex)
    if (x >= lo - EPSILON && x <= hi + EPSILON) {
      if (epsEquals(x, sx)) {
        return Solution.one(c.y.c0)
      }
      if (epsEquals(x, ex)) {
        return Solution.one(c.y.c0 + c.y.c1)
      }
      const sol = LinearCurve2d.solveAtX(c, x)
      if (!Solution.isNone(sol)) {
        return sol
      }
    }
  }
  return Solution.none
})

/** @internal */
export const solveAtY = dual(2, (p: LinearPath2d, y: number): Solution.AtMostOne<number> => {
  for (const c of p) {
    const sy = c.y.c0
    const ey = c.y.c0 + c.y.c1
    const lo = Math.min(sy, ey)
    const hi = Math.max(sy, ey)
    if (y >= lo - EPSILON && y <= hi + EPSILON) {
      if (epsEquals(y, sy)) {
        return Solution.one(c.x.c0)
      }
      if (epsEquals(y, ey)) {
        return Solution.one(c.x.c0 + c.x.c1)
      }
      const sol = LinearCurve2d.solveAtY(c, y)
      if (!Solution.isNone(sol)) {
        return sol
      }
    }
  }
  return Solution.none
})

/** @internal */
export const boundingBox = (
  p: LinearPath2d,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> => {
  const iter = p[Symbol.iterator]()
  const first = iter.next()
  // path invariant: at least one curve, so first.value is defined
  let acc = LinearCurve2d.boundingBox(first.value as LinearCurve2d.LinearCurve2d)
  for (let next = iter.next(); !next.done; next = iter.next()) {
    acc = Interval2d.union(acc, LinearCurve2d.boundingBox(next.value))
  }
  return acc
}
