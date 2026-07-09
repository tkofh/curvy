import type { Curve2dOps } from '../curve/curve2d.ts'
import * as Interval from '../interval/interval.ts'
import * as Interval2d from '../interval/interval2d.ts'
import { coincident } from '../number.ts'
import * as Solution from '../solution/solution.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import { dual, Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
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

/**
 * Generic 2D path — a sequence of curves of a single kind `C` plus optional
 * trait brands (`Continuous`, `MonotonicX`, etc.) tracking properties of the
 * path as a whole.
 *
 * Each concrete path kind (`LinearPath2d`, `QuadraticPath2d`, `CubicPath2d`)
 * is a `Path2d<TheirCurveKind, Trait>` plus a per-kind `TypeId` slot for
 * cheap runtime identification. The per-kind modules re-export an operation
 * surface derived from {@link makeMethods} over their curve's
 * {@link Curve2dOps}.
 *
 * @since 2.0.0
 */
export interface Path2d<C, Trait = unknown> extends Pipeable, Iterable<C> {
  readonly [PathTraits]: Trait
}

/**
 * Concrete implementation backing every `Path2d<C>`. The per-kind `TypeId`
 * symbol is stamped onto each instance as a dynamic property at the symbol
 * key it identifies, so the existing per-kind `is{Linear,Quadratic,Cubic}Path2d`
 * typeguards continue to work as `TypeId in p` checks.
 *
 * @internal
 */
export class Path2dImpl<C> extends Pipeable implements Path2d<C, unknown> {
  declare readonly [PathTraits]: unknown
  readonly curves: ReadonlyArray<C>

  constructor(typeId: symbol, curves: ReadonlyArray<C>) {
    super()
    ;(this as unknown as Record<symbol, symbol>)[typeId] = typeId
    this.curves = curves
  }

  [Symbol.iterator](): Iterator<C> {
    return this.curves[Symbol.iterator]()
  }
}

/**
 * Builds the bundle of generic path operations for a curve kind `C`, given
 * that curve's {@link Curve2dOps} and the per-kind `TypeId` symbol. Each
 * polynomial-degree path module calls this once and re-exports the returned
 * functions with curve-narrowed signatures.
 *
 * `ops` and `typeId` are captured by closure, so the returned operations
 * incur no per-call lookup overhead.
 *
 * @since 2.0.0
 */
export const makeMethods = <C>(typeId: symbol, ops: Curve2dOps<C>) => {
  const fromArray = (curves: ReadonlyArray<C>): Path2d<C> => new Path2dImpl(typeId, curves)

  const make = (...curves: ReadonlyArray<C>): Path2d<C> => fromArray(curves)

  const append = dual<(c: C) => (p: Path2d<C>) => Path2d<C>, (p: Path2d<C>, c: C) => Path2d<C>>(
    2,
    (p: Path2d<C>, c: C) => fromArray([...p, c]),
  )

  const length = (p: Path2d<C>): number => {
    let total = 0
    for (const curve of p) {
      total += ops.length(curve, Interval.unit)
    }
    return total
  }

  const solve = dual<
    (u: number) => (p: Path2d<C>) => Vector2,
    (p: Path2d<C>, u: number) => Vector2
  >(2, (p: Path2d<C>, u: number) => {
    const curves = p instanceof Path2dImpl ? (p.curves as ReadonlyArray<C>) : [...p]
    if (u === 1) {
      return ops.solve(curves.at(-1) as C, 1)
    }
    const t = u * curves.length
    const i = Math.floor(t)
    return ops.solve(curves[i] as C, t - i)
  })

  const toPathData = (p: Path2d<C>): string => {
    let result = ''
    let prevEndX = Number.NaN
    let prevEndY = Number.NaN

    for (const curve of p) {
      const start = ops.startPoint(curve)
      const end = ops.endPoint(curve)

      if (!coincident(start.x, prevEndX) || !coincident(start.y, prevEndY)) {
        result += ` M ${start.x},${start.y}`
      }
      result += ` ${ops.toPathDataSegment(curve)}`

      prevEndX = end.x
      prevEndY = end.y
    }

    return result.slice(1)
  }

  const isContinuous = <T>(p: Path2d<C, T>): p is Path2d<C, T & Continuous> => {
    let prevEndX = Number.NaN
    let prevEndY = Number.NaN
    let first = true

    for (const curve of p) {
      const start = ops.startPoint(curve)
      if (!first && (!coincident(start.x, prevEndX) || !coincident(start.y, prevEndY))) {
        return false
      }
      const end = ops.endPoint(curve)
      prevEndX = end.x
      prevEndY = end.y
      first = false
    }
    return true
  }

  // Per-axis monotonicity for the path: every segment's axis polynomial must
  // be strictly monotonic over the unit interval AND adjacent segments' axis
  // ranges must not overlap — a knot that backtracks within the coincidence
  // band counts as continuous rather than as a reversal.
  const isIncreasingX = <T>(p: Path2d<C, T>): p is Path2d<C, T & IncreasingX> => {
    let prevEnd = Number.NEGATIVE_INFINITY
    for (const c of p) {
      if (!ops.isIncreasingX(c)) {
        return false
      }
      const start = ops.startPoint(c).x
      if (start < prevEnd && !coincident(start, prevEnd)) {
        return false
      }
      prevEnd = ops.endPoint(c).x
    }
    return true
  }

  const isDecreasingX = <T>(p: Path2d<C, T>): p is Path2d<C, T & DecreasingX> => {
    let prevEnd = Number.POSITIVE_INFINITY
    for (const c of p) {
      if (!ops.isDecreasingX(c)) {
        return false
      }
      const start = ops.startPoint(c).x
      if (start > prevEnd && !coincident(start, prevEnd)) {
        return false
      }
      prevEnd = ops.endPoint(c).x
    }
    return true
  }

  const isMonotonicX = <T>(p: Path2d<C, T>): p is Path2d<C, T & MonotonicX> =>
    isIncreasingX(p) || isDecreasingX(p)

  const isIncreasingY = <T>(p: Path2d<C, T>): p is Path2d<C, T & IncreasingY> => {
    let prevEnd = Number.NEGATIVE_INFINITY
    for (const c of p) {
      if (!ops.isIncreasingY(c)) {
        return false
      }
      const start = ops.startPoint(c).y
      if (start < prevEnd && !coincident(start, prevEnd)) {
        return false
      }
      prevEnd = ops.endPoint(c).y
    }
    return true
  }

  const isDecreasingY = <T>(p: Path2d<C, T>): p is Path2d<C, T & DecreasingY> => {
    let prevEnd = Number.POSITIVE_INFINITY
    for (const c of p) {
      if (!ops.isDecreasingY(c)) {
        return false
      }
      const start = ops.startPoint(c).y
      if (start > prevEnd && !coincident(start, prevEnd)) {
        return false
      }
      prevEnd = ops.endPoint(c).y
    }
    return true
  }

  const isMonotonicY = <T>(p: Path2d<C, T>): p is Path2d<C, T & MonotonicY> =>
    isIncreasingY(p) || isDecreasingY(p)

  // solveAtX / solveAtY on a monotonic-axis path. Two defenses against float
  // drift at interior knots, where two adjacent segments both bracket the
  // query and the per-curve inverse may return `none` for both:
  //   1. Snap to t=0/t=1 endpoint y when the query is coincident with a
  //      segment's start or end — bypasses polynomial inversion at knots.
  //   2. Fall through to the next bracketing segment on `none`. `MonotonicX`/Y
  //      admits at most one real solution across the path, so retrying is safe.
  const solveAtX = dual(2, (p: Path2d<C>, x: number): Solution.AtMostOne<number> => {
    for (const c of p) {
      const start = ops.startPoint(c)
      const end = ops.endPoint(c)
      const lo = Math.min(start.x, end.x)
      const hi = Math.max(start.x, end.x)
      if ((x >= lo && x <= hi) || coincident(x, lo) || coincident(x, hi)) {
        if (coincident(x, start.x)) {
          return Solution.one(start.y)
        }
        if (coincident(x, end.x)) {
          return Solution.one(end.y)
        }
        const sol = ops.solveAtX(c, x)
        if (!Solution.isNone(sol)) {
          return sol
        }
      }
    }
    return Solution.none
  })

  const solveAtY = dual(2, (p: Path2d<C>, y: number): Solution.AtMostOne<number> => {
    for (const c of p) {
      const start = ops.startPoint(c)
      const end = ops.endPoint(c)
      const lo = Math.min(start.y, end.y)
      const hi = Math.max(start.y, end.y)
      if ((y >= lo && y <= hi) || coincident(y, lo) || coincident(y, hi)) {
        if (coincident(y, start.y)) {
          return Solution.one(start.x)
        }
        if (coincident(y, end.y)) {
          return Solution.one(end.x)
        }
        const sol = ops.solveAtY(c, y)
        if (!Solution.isNone(sol)) {
          return sol
        }
      }
    }
    return Solution.none
  })

  const boundingBox = (p: Path2d<C>): Interval2d.Interval2d<Interval.Closed, Interval.Closed> => {
    const iter = p[Symbol.iterator]()
    const first = iter.next()
    let acc = ops.boundingBox(first.value as C)
    for (let next = iter.next(); !next.done; next = iter.next()) {
      acc = Interval2d.union(acc, ops.boundingBox(next.value))
    }
    return acc
  }

  // Per-curve transform: the curve-level op already encodes the right
  // coefficient-vs-position split for its degree, so the path-level call is
  // just a map. Trait brands are dropped — affine maps preserve continuity
  // (since image of a connected set is connected) but can flip monotonicity
  // sense (a reflection inverts increasing → decreasing) so the brands must
  // be reasserted on the result if the caller still wants them.
  const transform = dual<
    (a: Affine2d) => (p: Path2d<C>) => Path2d<C>,
    (p: Path2d<C>, a: Affine2d) => Path2d<C>
  >(2, (p: Path2d<C>, a: Affine2d) => {
    const curves: Array<C> = []
    for (const c of p) {
      curves.push(ops.transform(c, a))
    }
    return fromArray(curves)
  })

  return {
    fromArray,
    make,
    append,
    length,
    solve,
    toPathData,
    isContinuous,
    isIncreasingX,
    isDecreasingX,
    isMonotonicX,
    isIncreasingY,
    isDecreasingY,
    isMonotonicY,
    solveAtX,
    solveAtY,
    boundingBox,
    transform,
  }
}
