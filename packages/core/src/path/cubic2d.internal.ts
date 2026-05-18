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

/** @internal */
export const toPathData = (p: CubicPath2d): string => {
  let result = ''
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN

  for (const curve of p) {
    const start = CubicCurve2d.startPoint(curve)
    const end = CubicCurve2d.endPoint(curve)

    if (!epsEquals(start.x, prevEndX) || !epsEquals(start.y, prevEndY)) {
      result += ` M ${start.x},${start.y}`
    }
    result += ` ${CubicCurve2d.toPathDataSegment(curve)}`

    prevEndX = end.x
    prevEndY = end.y
  }

  return result.slice(1)
}

/** @internal */
export const isContinuous = <T>(p: CubicPath2d<T>): p is CubicPath2d<T & Continuous> => {
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN
  let first = true

  for (const curve of p) {
    const start = CubicCurve2d.startPoint(curve)
    if (!first && (!epsEquals(start.x, prevEndX) || !epsEquals(start.y, prevEndY))) {
      return false
    }
    const end = CubicCurve2d.endPoint(curve)
    prevEndX = end.x
    prevEndY = end.y
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
    if (CubicCurve2d.startPoint(c).x < prevEnd - EPSILON) {
      return false
    }
    prevEnd = CubicCurve2d.endPoint(c).x
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
    if (CubicCurve2d.startPoint(c).x > prevEnd + EPSILON) {
      return false
    }
    prevEnd = CubicCurve2d.endPoint(c).x
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
    if (CubicCurve2d.startPoint(c).y < prevEnd - EPSILON) {
      return false
    }
    prevEnd = CubicCurve2d.endPoint(c).y
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
    if (CubicCurve2d.startPoint(c).y > prevEnd + EPSILON) {
      return false
    }
    prevEnd = CubicCurve2d.endPoint(c).y
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
    const start = CubicCurve2d.startPoint(c)
    const end = CubicCurve2d.endPoint(c)
    const lo = Math.min(start.x, end.x)
    const hi = Math.max(start.x, end.x)
    if (x >= lo - EPSILON && x <= hi + EPSILON) {
      if (epsEquals(x, start.x)) {
        return Solution.one(start.y)
      }
      if (epsEquals(x, end.x)) {
        return Solution.one(end.y)
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
    const start = CubicCurve2d.startPoint(c)
    const end = CubicCurve2d.endPoint(c)
    const lo = Math.min(start.y, end.y)
    const hi = Math.max(start.y, end.y)
    if (y >= lo - EPSILON && y <= hi + EPSILON) {
      if (epsEquals(y, start.y)) {
        return Solution.one(start.x)
      }
      if (epsEquals(y, end.y)) {
        return Solution.one(end.x)
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
