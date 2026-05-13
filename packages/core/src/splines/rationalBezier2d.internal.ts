import * as RationalCubicCurve2d from '../curve/rationalCubic2d'
import * as RationalCubicPath2d from '../path/rationalCubic2d'
import { dual, Pipeable } from '../utils'
import * as Solution from '../solution/solution'
import { invariant } from '../utils'
import { epsEquals } from '../number'
import * as Vector2 from '../vector/vector2'
import * as Vector3 from '../vector/vector3'
import type { Bezier2d } from './bezier2d'
import type { RationalBezier2d } from './rationalBezier2d'

export const RationalBezier2dTypeId = Symbol('curvy/splines/rationalBezier2d')
export type RationalBezier2dTypeId = typeof RationalBezier2dTypeId

// Internally each control point is stored in homogeneous form as
// `(w·x, w·y, w)`. De Casteljau in 3D plus a final projection (`x/w`, `y/w`)
// is exactly the rational evaluator, so the homogeneous form keeps the hot
// paths identical to the non-rational case modulo one division at the end.

class RationalBezier2dImpl extends Pipeable implements RationalBezier2d {
  readonly [RationalBezier2dTypeId]: RationalBezier2dTypeId = RationalBezier2dTypeId

  readonly homogeneous: ReadonlyArray<Vector3.Vector3>

  constructor(homogeneous: ReadonlyArray<Vector3.Vector3>) {
    invariant(homogeneous.length >= 4, 'rational cubic splines require 4 or more points')
    invariant(homogeneous.length % 3 === 1, 'rational cubic splines require (n * 3) + 1 points')
    super()
    this.homogeneous = homogeneous
  }

  *[Symbol.iterator](): IterableIterator<Vector2.Weighted> {
    for (const h of this.homogeneous) {
      yield Vector2.makeWeighted(h.x / h.z, h.y / h.z, h.z)
    }
  }
}

export const isRationalBezier2d = (p: unknown): p is RationalBezier2d =>
  typeof p === 'object' && p !== null && RationalBezier2dTypeId in p

const lift = (p: Vector2.Weighted): Vector3.Vector3 =>
  Vector3.make(p.x * p.weight, p.y * p.weight, p.weight)

export const make = (
  p0: Vector2.Weighted,
  p1: Vector2.Weighted,
  p2: Vector2.Weighted,
  p3: Vector2.Weighted,
): RationalBezier2d => new RationalBezier2dImpl([lift(p0), lift(p1), lift(p2), lift(p3)])

export const fromArray = (points: ReadonlyArray<Vector2.Weighted>): RationalBezier2d =>
  new RationalBezier2dImpl(points.map(lift))

export const fromPoints = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
  p3: Vector2.Vector2,
): RationalBezier2d =>
  new RationalBezier2dImpl([
    Vector3.make(p0.x, p0.y, 1),
    Vector3.make(p1.x, p1.y, 1),
    Vector3.make(p2.x, p2.y, 1),
    Vector3.make(p3.x, p3.y, 1),
  ])

export const fromBezier = (b: Bezier2d): RationalBezier2d => {
  const homogeneous: Array<Vector3.Vector3> = []
  for (const p of b) {
    homogeneous.push(Vector3.make(p.x, p.y, 1))
  }
  return new RationalBezier2dImpl(homogeneous)
}

const homogeneousOf = (r: RationalBezier2d): ReadonlyArray<Vector3.Vector3> =>
  r instanceof RationalBezier2dImpl ? r.homogeneous : Array.from(r, lift)

// Conversion from spline form (piecewise Bernstein weighted control points)
// to path form (per-segment monomial polynomials with shared denominator).
// Each segment's four homogeneous control points expand into three cubic
// polynomials — x, y, w — via the same Bernstein-to-monomial mapping that
// drives `Bezier2d.toPath`, just running on three channels instead of two.
export const toPath = (r: RationalBezier2d): RationalCubicPath2d.RationalCubicPath2d => {
  const homogeneous = homogeneousOf(r)
  const segmentCount = (homogeneous.length - 1) / 3
  const curves: Array<RationalCubicCurve2d.RationalCubicCurve2d> = []

  for (let i = 0; i < segmentCount; i++) {
    const base = i * 3
    const h0 = homogeneous[base] as Vector3.Vector3
    const h1 = homogeneous[base + 1] as Vector3.Vector3
    const h2 = homogeneous[base + 2] as Vector3.Vector3
    const h3 = homogeneous[base + 3] as Vector3.Vector3

    // Project each homogeneous CP back to its weighted form for the
    // `fromBezierPoints` constructor. The constructor re-lifts internally;
    // the round-trip is exact to within 1–2 ULPs for finite positive weights
    // and the conversion is a one-shot, not a hot path.
    curves.push(
      RationalCubicCurve2d.fromBezierPoints(
        Vector2.makeWeighted(h0.x / h0.z, h0.y / h0.z, h0.z),
        Vector2.makeWeighted(h1.x / h1.z, h1.y / h1.z, h1.z),
        Vector2.makeWeighted(h2.x / h2.z, h2.y / h2.z, h2.z),
        Vector2.makeWeighted(h3.x / h3.z, h3.y / h3.z, h3.z),
      ),
    )
  }

  return RationalCubicPath2d.fromArray(curves)
}

export const subdivide = dual<
  (u: number) => (r: RationalBezier2d) => [RationalBezier2d, RationalBezier2d],
  (r: RationalBezier2d, u: number) => [RationalBezier2d, RationalBezier2d]
>(2, (r: RationalBezier2d, u: number): [RationalBezier2d, RationalBezier2d] => {
  invariant(u > 0 && u < 1, 'subdivide parameter u must be in the open interval (0, 1)')

  const homogeneous = homogeneousOf(r)
  const segmentCount = (homogeneous.length - 1) / 3
  const t = u * segmentCount
  const i = Math.floor(t)
  const localT = t - i

  // exact segment boundary: no de Casteljau needed, just slice
  if (localT === 0) {
    return [
      new RationalBezier2dImpl(homogeneous.slice(0, i * 3 + 1)),
      new RationalBezier2dImpl(homogeneous.slice(i * 3)),
    ]
  }

  const p0 = homogeneous[i * 3] as Vector3.Vector3
  const p1 = homogeneous[i * 3 + 1] as Vector3.Vector3
  const p2 = homogeneous[i * 3 + 2] as Vector3.Vector3
  const p3 = homogeneous[i * 3 + 3] as Vector3.Vector3

  // de Casteljau split in homogeneous space — the new control points sit on
  // the lifted curve, so projecting them back yields valid rational beziers
  // on each side. The split point is shared by both halves.
  const q0x = p0.x + (p1.x - p0.x) * localT
  const q0y = p0.y + (p1.y - p0.y) * localT
  const q0w = p0.z + (p1.z - p0.z) * localT
  const q1x = p1.x + (p2.x - p1.x) * localT
  const q1y = p1.y + (p2.y - p1.y) * localT
  const q1w = p1.z + (p2.z - p1.z) * localT
  const q2x = p2.x + (p3.x - p2.x) * localT
  const q2y = p2.y + (p3.y - p2.y) * localT
  const q2w = p2.z + (p3.z - p2.z) * localT

  const r0x = q0x + (q1x - q0x) * localT
  const r0y = q0y + (q1y - q0y) * localT
  const r0w = q0w + (q1w - q0w) * localT
  const r1x = q1x + (q2x - q1x) * localT
  const r1y = q1y + (q2y - q1y) * localT
  const r1w = q1w + (q2w - q1w) * localT

  const sx = r0x + (r1x - r0x) * localT
  const sy = r0y + (r1y - r0y) * localT
  const sw = r0w + (r1w - r0w) * localT

  const q0 = Vector3.make(q0x, q0y, q0w)
  const r0 = Vector3.make(r0x, r0y, r0w)
  const sLeft = Vector3.make(sx, sy, sw)
  const sRight = Vector3.make(sx, sy, sw)
  const r1 = Vector3.make(r1x, r1y, r1w)
  const q2 = Vector3.make(q2x, q2y, q2w)

  const leftPoints: Array<Vector3.Vector3> = [...homogeneous.slice(0, i * 3 + 1), q0, r0, sLeft]
  const rightPoints: Array<Vector3.Vector3> = [sRight, r1, q2, ...homogeneous.slice(i * 3 + 3)]

  return [new RationalBezier2dImpl(leftPoints), new RationalBezier2dImpl(rightPoints)]
})

// Bridge consumed by `Bezier2d.fromRational`. Lives here (not in the bezier
// module) so the value-import dependency is one-directional: the rational
// module pulls only types from `./bezier2d`, never vice versa. Returns the
// raw control-point array; the bezier module wraps it in its own type.
export const toBezierPoints = (
  r: RationalBezier2d,
): Solution.AtMostOne<ReadonlyArray<Vector2.Vector2>> => {
  const homogeneous = homogeneousOf(r)
  const w0 = (homogeneous[0] as Vector3.Vector3).z
  const points: Array<Vector2.Vector2> = []
  for (const h of homogeneous) {
    if (!epsEquals(h.z, w0)) {
      return Solution.none
    }
    points.push(Vector2.make(h.x / h.z, h.y / h.z))
  }
  return Solution.one(points)
}
