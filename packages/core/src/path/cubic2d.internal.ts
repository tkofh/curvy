import * as Interval2d from '../interval/interval2d.ts'
import * as CubicCurve2d from '../curve/cubic2d.ts'
import * as cubicCurveInternal from '../curve/cubic2d.internal.ts'
import * as QuadraticCurve2d from '../curve/quadratic2d.ts'
import * as Interval from '../interval/interval.ts'
import * as CubicPolynomial from '../polynomial/cubic.ts'
import * as Solution from '../solution/solution.ts'
import { dual, Pipeable } from '../utils.ts'
import { invariant } from '../utils.ts'
import { EPSILON, epsEquals } from '../number.ts'
import * as Vector2 from '../vector/vector2.ts'
import type { CubicPath2d } from './cubic2d.ts'
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

export const CubicPath2dTypeId: unique symbol = Symbol('curvy/path/cubic2d')
export type CubicPath2dTypeId = typeof CubicPath2dTypeId

/** @internal */
export class CubicPath2dImpl extends Pipeable implements CubicPath2d<unknown> {
  readonly [CubicPath2dTypeId]: CubicPath2dTypeId = CubicPath2dTypeId
  declare readonly [PathTraits]: unknown

  readonly curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>

  constructor(curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>) {
    invariant(curves.length > 0, 'cubic path requires at least one curve')
    super()
    this.curves = curves
  }

  [Symbol.iterator](): Iterator<CubicCurve2d.CubicCurve2d> {
    return this.curves[Symbol.iterator]()
  }
}

/** @internal */
export const isCubicPath2d = (p: unknown): p is CubicPath2d =>
  typeof p === 'object' && p !== null && CubicPath2dTypeId in p

/** @internal */
export const make = (...curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>): CubicPath2d =>
  new CubicPath2dImpl(curves)

/** @internal */
export const fromArray = (curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>): CubicPath2d =>
  new CubicPath2dImpl(curves)

/** @internal */
export const append = dual<
  (c: CubicCurve2d.CubicCurve2d) => (p: CubicPath2d) => CubicPath2d,
  (p: CubicPath2d, c: CubicCurve2d.CubicCurve2d) => CubicPath2d
>(2, (p: CubicPath2d, c: CubicCurve2d.CubicCurve2d) => fromArray([...p, c]))

/** @internal */
export const length = (p: CubicPath2d) => {
  let total = 0
  for (const curve of p) {
    total += CubicCurve2d.length(curve, Interval.unit)
  }

  return total
}

/** @internal */
export const solve = dual<
  (u: number) => (p: CubicPath2d) => Vector2.Vector2,
  (p: CubicPath2d, u: number) => Vector2.Vector2
>(2, (p: CubicPath2d, u: number) => {
  const curves = p instanceof CubicPath2dImpl ? p.curves : [...p]

  if (u === 1) {
    const last = curves.at(-1) as CubicCurve2d.CubicCurve2d
    return CubicCurve2d.solve(last, 1)
  }

  const t = u * curves.length
  const i = Math.floor(t)
  const curve = curves[i] as CubicCurve2d.CubicCurve2d
  return CubicCurve2d.solve(curve, t - i)
})

// Cumulative segment lengths cache. lengths[k] = total length through segment k.
// Cached by path identity since paths are immutable.
const cumulativeLengthCache = new WeakMap<CubicPath2d, ReadonlyArray<number>>()

const getCumulativeLengths = (p: CubicPath2d): ReadonlyArray<number> => {
  let cached = cumulativeLengthCache.get(p)
  if (cached === undefined) {
    const lengths: Array<number> = []
    let total = 0
    for (const curve of p) {
      total += CubicCurve2d.length(curve, Interval.unit)
      lengths.push(total)
    }
    cached = lengths
    cumulativeLengthCache.set(p, cached)
  }
  return cached
}

// Newton's method to find the local parameter t ∈ [0, 1] within `curve` such
// that the arc length from 0 to t equals `target`. Each iteration costs one
// GL32 quadrature plus one velocity eval; converges in 3–5 iterations for
// well-behaved curves. Falls back to bisection on cusps where speed → 0.
const solveCurveByDistance = (
  curve: CubicCurve2d.CubicCurve2d,
  target: number,
  segmentLength: number,
): number => {
  if (target <= 0) {
    return 0
  }
  if (target >= segmentLength) {
    return 1
  }

  const derivative = cubicCurveInternal.derivative(curve)

  let t = target / segmentLength
  let lo = 0
  let hi = 1

  for (let iter = 0; iter < 16; iter++) {
    const currentLength = CubicCurve2d.length(curve, Interval.make(0, t))
    const error = currentLength - target

    if (Math.abs(error) < EPSILON) {
      return t
    }

    if (error > 0) {
      hi = t
    } else {
      lo = t
    }

    const speed = Vector2.magnitude(QuadraticCurve2d.solve(derivative, t))
    if (speed === 0) {
      // cusp — bisect instead
      t = (lo + hi) / 2
      continue
    }

    const next = t - error / speed
    // bracket-clamp Newton step; if it leaves the bracket, fall back to bisection
    t = next > lo && next < hi ? next : (lo + hi) / 2
  }

  return t
}

// Cubic Bernstein basis: P(t) = (1-t)³·p0 + 3(1-t)²t·p1 + 3(1-t)t²·p2 + t³·p3
// expanded gives c0 = p0, c1 = -3p0 + 3p1, c2 = 3p0 - 6p1 + 3p2, c3 = -p0 + 3p1 - 3p2 + p3,
// so: p0 = c0, p1 = c0 + c1/3, p2 = c0 + 2c1/3 + c2/3, p3 = c0 + c1 + c2 + c3.
/** @internal */
export const toPathData = (p: CubicPath2d): string => {
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
    const c3x = curve.x.c3
    const c3y = curve.y.c3

    const startX = c0x
    const startY = c0y
    const ctrl1X = c0x + c1x / 3
    const ctrl1Y = c0y + c1y / 3
    const ctrl2X = c0x + (2 * c1x) / 3 + c2x / 3
    const ctrl2Y = c0y + (2 * c1y) / 3 + c2y / 3
    const endX = c0x + c1x + c2x + c3x
    const endY = c0y + c1y + c2y + c3y

    if (!epsEquals(startX, prevEndX) || !epsEquals(startY, prevEndY)) {
      result += ` M ${startX},${startY}`
    }
    result += ` C ${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y} ${endX},${endY}`

    prevEndX = endX
    prevEndY = endY
  }

  return result.slice(1)
}

/** @internal */
export const isContinuous = <T>(p: CubicPath2d<T>): p is CubicPath2d<T & Continuous> => {
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN
  let first = true

  for (const curve of p) {
    const startX = curve.x.c0
    const startY = curve.y.c0
    if (!first && (!epsEquals(startX, prevEndX) || !epsEquals(startY, prevEndY))) {
      return false
    }
    prevEndX = curve.x.c0 + curve.x.c1 + curve.x.c2 + curve.x.c3
    prevEndY = curve.y.c0 + curve.y.c1 + curve.y.c2 + curve.y.c3
    first = false
  }
  return true
}

/** @internal */
export const asContinuous = <T>(p: CubicPath2d<T>): CubicPath2d<T & Continuous> => {
  invariant(isContinuous(p), 'cubic path is not continuous')
  return p
}

// Per-axis monotonicity for the path: every segment's axis polynomial must be
// strictly monotonic over the unit interval AND adjacent segments' axis
// ranges must not overlap (modulo EPSILON for float drift).
/** @internal */
export const isIncreasingX = <T>(p: CubicPath2d<T>): p is CubicPath2d<T & IncreasingX> => {
  let prevEnd = Number.NEGATIVE_INFINITY
  for (const c of p) {
    if (!CubicPolynomial.isIncreasing(c.x, Interval.unit)) {
      return false
    }
    if (c.x.c0 < prevEnd - EPSILON) {
      return false
    }
    prevEnd = c.x.c0 + c.x.c1 + c.x.c2 + c.x.c3
  }
  return true
}

/** @internal */
export const isDecreasingX = <T>(p: CubicPath2d<T>): p is CubicPath2d<T & DecreasingX> => {
  let prevEnd = Number.POSITIVE_INFINITY
  for (const c of p) {
    if (!CubicPolynomial.isDecreasing(c.x, Interval.unit)) {
      return false
    }
    if (c.x.c0 > prevEnd + EPSILON) {
      return false
    }
    prevEnd = c.x.c0 + c.x.c1 + c.x.c2 + c.x.c3
  }
  return true
}

/** @internal */
export const isMonotonicX = <T>(p: CubicPath2d<T>): p is CubicPath2d<T & MonotonicX> =>
  isIncreasingX(p) || isDecreasingX(p)

/** @internal */
export const isIncreasingY = <T>(p: CubicPath2d<T>): p is CubicPath2d<T & IncreasingY> => {
  let prevEnd = Number.NEGATIVE_INFINITY
  for (const c of p) {
    if (!CubicPolynomial.isIncreasing(c.y, Interval.unit)) {
      return false
    }
    if (c.y.c0 < prevEnd - EPSILON) {
      return false
    }
    prevEnd = c.y.c0 + c.y.c1 + c.y.c2 + c.y.c3
  }
  return true
}

/** @internal */
export const isDecreasingY = <T>(p: CubicPath2d<T>): p is CubicPath2d<T & DecreasingY> => {
  let prevEnd = Number.POSITIVE_INFINITY
  for (const c of p) {
    if (!CubicPolynomial.isDecreasing(c.y, Interval.unit)) {
      return false
    }
    if (c.y.c0 > prevEnd + EPSILON) {
      return false
    }
    prevEnd = c.y.c0 + c.y.c1 + c.y.c2 + c.y.c3
  }
  return true
}

/** @internal */
export const isMonotonicY = <T>(p: CubicPath2d<T>): p is CubicPath2d<T & MonotonicY> =>
  isIncreasingY(p) || isDecreasingY(p)

/** @internal */
export const asIncreasingX = <T>(p: CubicPath2d<T>): CubicPath2d<T & IncreasingX> => {
  invariant(isIncreasingX(p), 'cubic path is not increasing in x')
  return p
}

/** @internal */
export const asDecreasingX = <T>(p: CubicPath2d<T>): CubicPath2d<T & DecreasingX> => {
  invariant(isDecreasingX(p), 'cubic path is not decreasing in x')
  return p
}

/** @internal */
export const asMonotonicX = <T>(p: CubicPath2d<T>): CubicPath2d<T & MonotonicX> => {
  invariant(isMonotonicX(p), 'cubic path is not monotonic in x')
  return p
}

/** @internal */
export const asIncreasingY = <T>(p: CubicPath2d<T>): CubicPath2d<T & IncreasingY> => {
  invariant(isIncreasingY(p), 'cubic path is not increasing in y')
  return p
}

/** @internal */
export const asDecreasingY = <T>(p: CubicPath2d<T>): CubicPath2d<T & DecreasingY> => {
  invariant(isDecreasingY(p), 'cubic path is not decreasing in y')
  return p
}

/** @internal */
export const asMonotonicY = <T>(p: CubicPath2d<T>): CubicPath2d<T & MonotonicY> => {
  invariant(isMonotonicY(p), 'cubic path is not monotonic in y')
  return p
}

// At an interior knot, two adjacent segments both bracket the query — one's
// right endpoint and the next's left endpoint are (within float drift) the
// same value. The per-curve cubic-root solver can return `none` for both
// brackets when the true root sits just outside [0, 1] due to that drift. We
// handle this two ways:
//   1. If the query is within EPSILON of a segment's start or end, evaluate y
//      directly at t=0 or t=1 — skips polynomial inversion entirely.
//   2. Otherwise, if a bracketing segment returns `none`, fall through to the
//      next bracketing segment. `MonotonicX` admits at most one real solution
//      across the path, so retrying after `none` is safe.
/** @internal */
export const solveAtX = dual(2, (p: CubicPath2d, x: number): Solution.AtMostOne<number> => {
  for (const c of p) {
    const sx = c.x.c0
    const ex = c.x.c0 + c.x.c1 + c.x.c2 + c.x.c3
    const lo = Math.min(sx, ex)
    const hi = Math.max(sx, ex)
    if (x >= lo - EPSILON && x <= hi + EPSILON) {
      if (epsEquals(x, sx)) {
        return Solution.one(c.y.c0)
      }
      if (epsEquals(x, ex)) {
        return Solution.one(c.y.c0 + c.y.c1 + c.y.c2 + c.y.c3)
      }
      const sol = CubicCurve2d.solveAtX(c, x) as Solution.AtMostOne<number>
      if (!Solution.isNone(sol)) {
        return sol
      }
    }
  }
  return Solution.none
})

/** @internal */
export const solveAtY = dual(2, (p: CubicPath2d, y: number): Solution.AtMostOne<number> => {
  for (const c of p) {
    const sy = c.y.c0
    const ey = c.y.c0 + c.y.c1 + c.y.c2 + c.y.c3
    const lo = Math.min(sy, ey)
    const hi = Math.max(sy, ey)
    if (y >= lo - EPSILON && y <= hi + EPSILON) {
      if (epsEquals(y, sy)) {
        return Solution.one(c.x.c0)
      }
      if (epsEquals(y, ey)) {
        return Solution.one(c.x.c0 + c.x.c1 + c.x.c2 + c.x.c3)
      }
      const sol = CubicCurve2d.solveAtY(c, y) as Solution.AtMostOne<number>
      if (!Solution.isNone(sol)) {
        return sol
      }
    }
  }
  return Solution.none
})

/** @internal */
export const solveByDistance = dual<
  (s: number) => (p: CubicPath2d) => Vector2.Vector2,
  (p: CubicPath2d, s: number) => Vector2.Vector2
>(2, (p: CubicPath2d, s: number) => {
  if (s <= 0) {
    return solve(p, 0)
  }
  if (s >= 1) {
    return solve(p, 1)
  }

  const lengths = getCumulativeLengths(p)
  const total = lengths[lengths.length - 1] as number
  const target = s * total

  // find segment k such that lengths[k-1] ≤ target ≤ lengths[k]
  let k = 0
  while (k < lengths.length - 1 && (lengths[k] as number) < target) {
    k++
  }

  const segmentStart = k === 0 ? 0 : (lengths[k - 1] as number)
  const segmentEnd = lengths[k] as number
  const segmentLength = segmentEnd - segmentStart
  const segmentTarget = target - segmentStart

  const curves = p instanceof CubicPath2dImpl ? p.curves : [...p]
  const curve = curves[k] as CubicCurve2d.CubicCurve2d
  const localT = solveCurveByDistance(curve, segmentTarget, segmentLength)

  return CubicCurve2d.solve(curve, localT)
})

/** @internal */
export const boundingBox = (
  p: CubicPath2d,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> => {
  const iter = p[Symbol.iterator]()
  const first = iter.next()
  let acc = CubicCurve2d.boundingBox(first.value as CubicCurve2d.CubicCurve2d)
  for (let next = iter.next(); !next.done; next = iter.next()) {
    acc = Interval2d.union(acc, CubicCurve2d.boundingBox(next.value))
  }
  return acc
}
