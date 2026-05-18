import * as Characteristic from '../characteristic/characteristic.ts'
import * as CubicPath2d from '../path/cubic2d.ts'
import * as Affine2d from '../transform/affine2d.ts'
import { dual, Pipeable } from '../utils.ts'
import { invariant } from '../utils.ts'
import * as Vector2 from '../vector/vector2.ts'
import type { Bezier2d } from './bezier2d.ts'
import * as bezierInternal from './bezier2d.internal.ts'
import type { Hermite2d } from './hermite2d.ts'
import { toCurves } from './util.ts'

export const Hermite2dTypeId = Symbol('curvy/splines/hermite2d')
export type Hermite2dTypeId = typeof Hermite2dTypeId

class Hermite2dImpl extends Pipeable implements Hermite2d {
  readonly [Hermite2dTypeId]: Hermite2dTypeId = Hermite2dTypeId

  readonly points: ReadonlyArray<Vector2.Vector2>

  constructor(points: ReadonlyArray<Vector2.Vector2>) {
    invariant(points.length >= 4, 'hermite splines requires 4 or more points')
    invariant(points.length % 2 === 0, 'hermite splines requires (n * 2) points')

    super()
    this.points = points
  }

  [Symbol.iterator]() {
    return this.points[Symbol.iterator]()
  }
}

/** @internal */
export const isHermite2d = (p: unknown): p is Hermite2d =>
  typeof p === 'object' && p !== null && Hermite2dTypeId in p

/** @internal */
export const make = (
  p0: Vector2.Vector2,
  v0: Vector2.Vector2,
  p1: Vector2.Vector2,
  v1: Vector2.Vector2,
) => new Hermite2dImpl([p0, v0, p1, v1])

/** @internal */
export const fromArray = (points: ReadonlyArray<Vector2.Vector2>) => new Hermite2dImpl(points)

/** @internal */
export const fromTuples = (tuples: ReadonlyArray<readonly [number, number]>) =>
  new Hermite2dImpl(tuples.map(([x, y]) => Vector2.make(x, y)))

/** @internal */
export const append = dual<
  (p1: Vector2.Vector2, v1: Vector2.Vector2) => (p: Hermite2d) => Hermite2d,
  (p: Hermite2d, p1: Vector2.Vector2, v1: Vector2.Vector2) => Hermite2d
>(3, (p: Hermite2d, p1: Vector2.Vector2, v1: Vector2.Vector2) => {
  const points = p instanceof Hermite2dImpl ? p.points : Array.from(p)
  return new Hermite2dImpl(points.concat(p1, v1))
})

/** @internal */
export const prepend = dual<
  (p0: Vector2.Vector2, v0: Vector2.Vector2) => (p: Hermite2d) => Hermite2d,
  (p: Hermite2d, p0: Vector2.Vector2, v0: Vector2.Vector2) => Hermite2d
>(3, (p: Hermite2d, p0: Vector2.Vector2, v0: Vector2.Vector2) => {
  const points = p instanceof Hermite2dImpl ? p.points : Array.from(p)
  return new Hermite2dImpl([p0, v0].concat(points))
})

/** @internal */
export const mapPoints = dual<
  (f: (p: Vector2.Vector2) => Vector2.Vector2) => (s: Hermite2d) => Hermite2d,
  (s: Hermite2d, f: (p: Vector2.Vector2) => Vector2.Vector2) => Hermite2d
>(2, (s: Hermite2d, f: (p: Vector2.Vector2) => Vector2.Vector2) => {
  const points = s instanceof Hermite2dImpl ? s.points : [...s]
  return new Hermite2dImpl(points.map(f))
})

/** @internal */
export const flatMap = dual<
  (f: (points: ReadonlyArray<Vector2.Vector2>) => Hermite2d) => (s: Hermite2d) => Hermite2d,
  (s: Hermite2d, f: (points: ReadonlyArray<Vector2.Vector2>) => Hermite2d) => Hermite2d
>(2, (s: Hermite2d, f: (points: ReadonlyArray<Vector2.Vector2>) => Hermite2d) =>
  f(s instanceof Hermite2dImpl ? s.points : [...s]),
)

// Hermite control data alternates positions (even indices) with tangent
// vectors (odd indices). Under an affine map `f(p) = A·p + t`, positions get
// the full affine while tangents get only the linear part `A` — they're
// derivatives, and the translation washes out of any derivative. Calling
// mapPoints with the full affine would silently bend the curve under any
// non-zero translation.
/** @internal */
export const transform = dual<
  (a: Affine2d.Affine2d) => (s: Hermite2d) => Hermite2d,
  (s: Hermite2d, a: Affine2d.Affine2d) => Hermite2d
>(2, (s: Hermite2d, a: Affine2d.Affine2d) => {
  const points = s instanceof Hermite2dImpl ? s.points : [...s]
  const linear = Affine2d.linearPart(a)
  const next: Array<Vector2.Vector2> = Array.from({ length: points.length })
  for (let i = 0; i < points.length; i++) {
    next[i] = Affine2d.apply(i % 2 === 0 ? a : linear, points[i] as Vector2.Vector2)
  }
  return new Hermite2dImpl(next)
})

/** @internal */
export const toPath = (p: Hermite2d) =>
  CubicPath2d.make(...toCurves(p, Characteristic.cubicHermite, 2))

/** @internal */
export const toBezier = (p: Hermite2d): Bezier2d =>
  bezierInternal.fromBasis(p, Characteristic.cubicHermite, 2)
