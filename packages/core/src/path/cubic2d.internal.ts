import * as CubicCurve2d from '../curve/cubic2d.ts'
import * as cubicCurveInternal from '../curve/cubic2d.internal.ts'
import * as QuadraticCurve2d from '../curve/quadratic2d.ts'
import * as Interval from '../interval/interval.ts'
import type { Closed } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import { RELATIVE_TOLERANCE } from '../number.ts'
import { dual, invariant } from '../utils.ts'
import * as Vector2 from '../vector/vector2.ts'
import type { CubicPath2d } from './cubic2d.ts'
import * as Path2d from './path2d.ts'
import {
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

// Generic operation surface, built once for CubicCurve2d's Ops.
const methods = Path2d.makeMethods(CubicPath2dTypeId, cubicCurveInternal.Ops)

/** @internal */
export const isCubicPath2d = (p: unknown): p is CubicPath2d =>
  typeof p === 'object' && p !== null && CubicPath2dTypeId in p

// The cubic path enforces a non-empty curve list. Wrap the generic factories
// to check the invariant; the generic builders accept empty arrays as a
// matter of structural minimality, but the cubic-specific contract is stricter.
/** @internal */
export const make = (...curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>): CubicPath2d => {
  invariant(curves.length > 0, 'cubic path requires at least one curve')
  return methods.make(...curves) as CubicPath2d
}

/** @internal */
export const fromArray = (curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>): CubicPath2d => {
  invariant(curves.length > 0, 'cubic path requires at least one curve')
  return methods.fromArray(curves) as CubicPath2d
}

/** @internal */
export const append = methods.append as never

/** @internal */
export const appendContinuous = methods.appendContinuous as never

/** @internal */
export const length = methods.length as (p: CubicPath2d) => number

/** @internal */
export const solve = methods.solve as never

/** @internal */
export const toPathData = methods.toPathData as (p: CubicPath2d) => string

/** @internal */
export const isContinuous = methods.isContinuous as unknown as <T>(
  p: CubicPath2d<T>,
) => p is CubicPath2d<T & Continuous>

/** @internal */
export const asContinuous = <T>(p: CubicPath2d<T>): CubicPath2d<T & Continuous> => {
  invariant(isContinuous(p), 'cubic path is not continuous')
  return p
}

/** @internal */
export const isIncreasingX = methods.isIncreasingX as unknown as <T>(
  p: CubicPath2d<T>,
) => p is CubicPath2d<T & IncreasingX>

/** @internal */
export const isDecreasingX = methods.isDecreasingX as unknown as <T>(
  p: CubicPath2d<T>,
) => p is CubicPath2d<T & DecreasingX>

/** @internal */
export const isMonotonicX = methods.isMonotonicX as unknown as <T>(
  p: CubicPath2d<T>,
) => p is CubicPath2d<T & MonotonicX>

/** @internal */
export const isIncreasingY = methods.isIncreasingY as unknown as <T>(
  p: CubicPath2d<T>,
) => p is CubicPath2d<T & IncreasingY>

/** @internal */
export const isDecreasingY = methods.isDecreasingY as unknown as <T>(
  p: CubicPath2d<T>,
) => p is CubicPath2d<T & DecreasingY>

/** @internal */
export const isMonotonicY = methods.isMonotonicY as unknown as <T>(
  p: CubicPath2d<T>,
) => p is CubicPath2d<T & MonotonicY>

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

/** @internal */
export const solveAtX = methods.solveAtX as never

/** @internal */
export const solveAtY = methods.solveAtY as never

/** @internal */
export const boundingBox = methods.boundingBox as (p: CubicPath2d) => Interval2d<Closed, Closed>

/** @internal */
export const transform = methods.transform as never

/** @internal */
export const reverse = methods.reverse as never

// Cubic-specific arc-length sampling. Cached by path identity since paths are
// immutable. Lives here rather than in the generic Path2d because the inner
// Newton iteration uses the cubic-curve derivative directly.

// Cumulative segment lengths cache. lengths[k] = total length through segment k.
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

// Newton's method to find the local parameter t in [0, 1] within `curve` such
// that the arc length from 0 to t equals `target`. Each iteration costs one
// GL32 quadrature plus one velocity eval; converges in 3-5 iterations for
// well-behaved curves. Falls back to bisection on cusps where speed -> 0.
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

    // Converged when the remaining arc-length error reaches the noise floor
    // relative to the segment. An absolute criterion demands unreachable
    // precision on long segments (burning every iteration) and stops a step
    // early on short ones.
    if (Math.abs(error) <= RELATIVE_TOLERANCE * segmentLength) {
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
export const solveByDistance = dual<
  (s: number) => (p: CubicPath2d) => Vector2.Vector2,
  (p: CubicPath2d, s: number) => Vector2.Vector2
>(2, (p: CubicPath2d, s: number) => {
  if (s <= 0) {
    return methods.solve(p, 0)
  }
  if (s >= 1) {
    return methods.solve(p, 1)
  }

  const lengths = getCumulativeLengths(p)
  const total = lengths[lengths.length - 1] as number
  const target = s * total

  // find segment k such that lengths[k-1] <= target <= lengths[k]
  let k = 0
  while (k < lengths.length - 1 && (lengths[k] as number) < target) {
    k++
  }

  const segmentStart = k === 0 ? 0 : (lengths[k - 1] as number)
  const segmentEnd = lengths[k] as number
  const segmentLength = segmentEnd - segmentStart
  const segmentTarget = target - segmentStart

  const curves =
    p instanceof Path2d.Path2dImpl ? (p.curves as ReadonlyArray<CubicCurve2d.CubicCurve2d>) : [...p]
  const curve = curves[k] as CubicCurve2d.CubicCurve2d
  const localT = solveCurveByDistance(curve, segmentTarget, segmentLength)

  return CubicCurve2d.solve(curve, localT)
})
