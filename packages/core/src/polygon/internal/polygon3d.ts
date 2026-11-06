import {
  coordinateMagnitude,
  isDegenerate,
  onPlaneTolerance,
  vectorArea,
} from '../../internal/vectorArea.ts'
import { RELATIVE_TOLERANCE } from '../../number.ts'
import * as plane3d from '../../plane/internal/plane3d.ts'
import type { Plane3d } from '../../plane/plane3d.ts'
import * as Solution from '../../solution/solution.ts'
import type { Affine3d } from '../../transform/affine3d.ts'
import * as affine3d from '../../transform/internal/affine3d.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import * as vector3 from '../../vector/internal/vector3.ts'
import type { Vector3 } from '../../vector/vector3.ts'
import type { Polygon3d, Split } from '../polygon3d.ts'
import type { Convex, Planar } from './traits.ts'
import { PolygonTraits } from './traits.ts'

const Polygon3dTypeId = '~curvy/Polygon3d'

class Polygon3dImpl extends Value(Polygon3dTypeId) implements Polygon3d<unknown> {
  declare readonly [PolygonTraits]: unknown
  readonly vertices: ReadonlyArray<Vector3>

  constructor(vertices: ReadonlyArray<Vector3>) {
    super()
    this.vertices = vertices
  }

  [Symbol.iterator](): Iterator<Vector3> {
    return this.vertices[Symbol.iterator]()
  }

  toString() {
    return `Polygon3d(${this.vertices.map((v) => `(${v.x}, ${v.y}, ${v.z})`).join(', ')})`
  }
}

/**
 * A polygon from vertices already known to be convex and planar, unchecked
 * and uncopied. Results of an operation that keeps convexity by
 * construction (clip, split, a polyhedron's faces) skip the public
 * validation and carry the brands.
 *
 * @internal
 */
export const convex = (vertices: ReadonlyArray<Vector3>): Polygon3d<Convex & Planar> =>
  new Polygon3dImpl(vertices) as Polygon3d<Convex & Planar>

// A convex 3D polygon is planar by definition, so the brand only needs
// widening.
const planar = (p: Polygon3d<Convex>): Polygon3d<Convex & Planar> => p as Polygon3d<Convex & Planar>

/** @internal */
export const isPolygon3d = (p: unknown): p is Polygon3d =>
  typeof p === 'object' && p !== null && Polygon3dTypeId in p

/** @internal */
export const fromArray = (vertices: ReadonlyArray<Vector3>): Polygon3d => {
  invariant(vertices.length >= 3, 'Polygon3d requires at least 3 vertices')
  for (const v of vertices) {
    invariant(
      Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z),
      'Polygon3d requires finite vertex coordinates',
    )
  }
  return new Polygon3dImpl(vertices.slice())
}

/** @internal */
export const make = (
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  ...rest: ReadonlyArray<Vector3>
): Polygon3d => fromArray([p0, p1, p2, ...rest])

/** @internal */
export const fromTuples = (tuples: ReadonlyArray<readonly [number, number, number]>): Polygon3d =>
  fromArray(tuples.map(([x, y, z]) => vector3.make(x, y, z)))

/** @internal */
export const equals = dual<
  (b: Polygon3d) => (a: Polygon3d) => boolean,
  (a: Polygon3d, b: Polygon3d) => boolean
>(2, (a: Polygon3d, b: Polygon3d): boolean => {
  if (a.vertices.length !== b.vertices.length) {
    return false
  }
  for (let i = 0; i < a.vertices.length; i++) {
    if (!vector3.equals(a.vertices[i]!, b.vertices[i]!)) {
      return false
    }
  }
  return true
})

// ---------------------------------------------------------------------------
// Measures
// ---------------------------------------------------------------------------

/** @internal */
export const normal = (p: Polygon3d): Solution.AtMostOne<Vector3> => {
  const a = vectorArea(p.vertices)
  if (isDegenerate(a)) {
    return Solution.none
  }
  const length = Math.hypot(a.x, a.y, a.z)
  return Solution.one(vector3.make(a.x / length, a.y / length, a.z / length))
}

/** @internal */
export const area = (p: Polygon3d): number => {
  const a = vectorArea(p.vertices)
  return Math.hypot(a.x, a.y, a.z) / 2
}

/** @internal */
export const perimeter = (p: Polygon3d): number => {
  const vs = p.vertices
  let total = 0
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i]!
    const b = vs[(i + 1) % vs.length]!
    total += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
  }
  return total
}

/** @internal */
export const centroid = (p: Polygon3d): Solution.AtMostOne<Vector3> => {
  const vs = p.vertices
  const a = vectorArea(vs)
  if (isDegenerate(a)) {
    return Solution.none
  }
  // A fan of triangles from the first vertex, each weighted by its doubled
  // area measured along the polygon's normal, so triangles that fold back
  // count negatively, as the shoelace centroid does in 2D.
  const length = Math.hypot(a.x, a.y, a.z)
  const nx = a.x / length
  const ny = a.y / length
  const nz = a.z / length
  const p0 = vs[0]!
  let cx = 0
  let cy = 0
  let cz = 0
  for (let i = 1; i < vs.length - 1; i++) {
    const q1x = vs[i]!.x - p0.x
    const q1y = vs[i]!.y - p0.y
    const q1z = vs[i]!.z - p0.z
    const q2x = vs[i + 1]!.x - p0.x
    const q2y = vs[i + 1]!.y - p0.y
    const q2z = vs[i + 1]!.z - p0.z
    const w =
      (q1y * q2z - q1z * q2y) * nx + (q1z * q2x - q1x * q2z) * ny + (q1x * q2y - q1y * q2x) * nz
    cx += (q1x + q2x) * w
    cy += (q1y + q2y) * w
    cz += (q1z + q2z) * w
  }
  // The weights sum to the doubled area, `length`, and each triangle's
  // centroid is a third of the way along its two edges.
  const k = 1 / (3 * length)
  return Solution.one(vector3.make(p0.x + cx * k, p0.y + cy * k, p0.z + cz * k))
}

// The fitted plane when every vertex lies on it, under the band clipping
// uses to call a vertex on a plane (PRECISION.md regime 2).
const flatPlane = (vertices: ReadonlyArray<Vector3>): Solution.AtMostOne<Plane3d> => {
  const fitted = plane3d.fit(vertices)
  if (Solution.isNone(fitted)) {
    return fitted
  }
  const { normal: n, offset } = fitted.value
  const flat = onPlaneTolerance(Math.max(coordinateMagnitude(vertices), Math.abs(offset)))
  for (const v of vertices) {
    if (Math.abs(n.x * v.x + n.y * v.y + n.z * v.z - offset) > flat) {
      return Solution.none
    }
  }
  return fitted
}

/** @internal */
export const isPlanar = <T>(p: Polygon3d<T>): p is Polygon3d<T & Planar> =>
  !Solution.isNone(flatPlane(p.vertices))

/** @internal */
export const asPlanar = <T>(p: Polygon3d<T>): Polygon3d<T & Planar> => {
  invariant(isPlanar(p), 'polygon is not planar')
  return p
}

/** @internal */
export const plane = (p: Polygon3d<Planar>): Plane3d => {
  const fitted = plane3d.fit(p.vertices)
  // Reachable only through a cast: every Planar polygon has area.
  invariant(!Solution.isNone(fitted), 'polygon has no area')
  return fitted.value
}

// ---------------------------------------------------------------------------
// Convexity
// ---------------------------------------------------------------------------

const withoutRepeats = (vertices: ReadonlyArray<Vector3>): Array<Vector3> => {
  const out: Array<Vector3> = []
  for (const v of vertices) {
    if (out.length === 0 || !vector3.equals(out[out.length - 1]!, v)) {
      out.push(v)
    }
  }
  while (out.length > 1 && vector3.equals(out[out.length - 1]!, out[0]!)) {
    out.pop()
  }
  return out
}

/** @internal */
export const isConvex = <T>(p: Polygon3d<T>): p is Polygon3d<T & Convex & Planar> => {
  const fitted = flatPlane(p.vertices)
  if (Solution.isNone(fitted)) {
    return false
  }
  const n = fitted.value.normal
  const vs = withoutRepeats(p.vertices)
  const count = vs.length
  if (count < 3) {
    return false
  }
  const m = coordinateMagnitude(vs)
  // Convex: seen along the normal, every corner turns the same way and the
  // outline goes around once. The turn is cross(e1, e2) measured along the
  // normal, with the band of PRECISION.md regime 3.
  let turning = 0
  for (let i = 0; i < count; i++) {
    const prev = vs[(i + count - 1) % count]!
    const v = vs[i]!
    const next = vs[(i + 1) % count]!
    const e1x = v.x - prev.x
    const e1y = v.y - prev.y
    const e1z = v.z - prev.z
    const e2x = next.x - v.x
    const e2y = next.y - v.y
    const e2z = next.z - v.z
    const turn =
      (e1y * e2z - e1z * e2y) * n.x + (e1z * e2x - e1x * e2z) * n.y + (e1x * e2y - e1y * e2x) * n.z
    const dot = e1x * e2x + e1y * e2y + e1z * e2z
    const l1 = Math.abs(e1x) + Math.abs(e1y) + Math.abs(e1z)
    const l2 = Math.abs(e2x) + Math.abs(e2y) + Math.abs(e2z)
    if (Math.abs(turn) <= RELATIVE_TOLERANCE * (l1 * l2 + m * (l1 + l2))) {
      // Straight through is fine. Doubling back is a spike.
      if (dot < 0) {
        return false
      }
      continue
    }
    // The normal follows the winding, so a convex outline turns positively
    // about it at every corner.
    if (turn < 0) {
      return false
    }
    turning += Math.atan2(turn, dot)
  }
  // A pentagram turns positively at every corner too, through 4 * pi.
  return turning < 3 * Math.PI
}

/** @internal */
export const asConvex = <T>(p: Polygon3d<T>): Polygon3d<T & Convex & Planar> => {
  invariant(isConvex(p), 'polygon is not convex and planar')
  return p
}

// ---------------------------------------------------------------------------
// Cutting (Sutherland–Hodgman)
// ---------------------------------------------------------------------------

interface Cut {
  readonly distances: ReadonlyArray<number>
  readonly sides: ReadonlyArray<-1 | 0 | 1>
  readonly hasFront: boolean
  readonly hasBack: boolean
}

// Each vertex's signed distance from the plane, and its side: 0 within the
// on-plane band (PRECISION.md regime 2).
const cut = (vertices: ReadonlyArray<Vector3>, pl: Plane3d): Cut => {
  const tolerance = onPlaneTolerance(Math.max(coordinateMagnitude(vertices), Math.abs(pl.offset)))
  const n = pl.normal
  const distances: Array<number> = []
  const sides: Array<-1 | 0 | 1> = []
  let hasFront = false
  let hasBack = false
  for (const v of vertices) {
    const d = n.x * v.x + n.y * v.y + n.z * v.z - pl.offset
    distances.push(d)
    if (d > tolerance) {
      sides.push(1)
      hasFront = true
    } else if (d < -tolerance) {
      sides.push(-1)
      hasBack = true
    } else {
      sides.push(0)
    }
  }
  return { distances, sides, hasFront, hasBack }
}

const piece = (
  vertices: ReadonlyArray<Vector3>,
  c: Cut,
  keep: -1 | 1,
): Solution.AtMostOne<Polygon3d<Convex & Planar>> => {
  const count = vertices.length
  const out: Array<Vector3> = []
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count
    const si = c.sides[i]!
    const sj = c.sides[j]!
    if (si === keep || si === 0) {
      out.push(vertices[i]!)
    }
    if (si * sj === -1) {
      const a = vertices[i]!
      const b = vertices[j]!
      const t = c.distances[i]! / (c.distances[i]! - c.distances[j]!)
      out.push(vector3.make(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t))
    }
  }
  if (out.length < 3 || isDegenerate(vectorArea(out))) {
    return Solution.none
  }
  return Solution.one(convex(out))
}

/** @internal */
export const clip = dual<
  (pl: Plane3d) => (p: Polygon3d<Convex>) => Solution.AtMostOne<Polygon3d<Convex & Planar>>,
  (p: Polygon3d<Convex>, pl: Plane3d) => Solution.AtMostOne<Polygon3d<Convex & Planar>>
>(2, (p: Polygon3d<Convex>, pl: Plane3d): Solution.AtMostOne<Polygon3d<Convex & Planar>> => {
  const c = cut(p.vertices, pl)
  // Nothing behind keeps the whole face, including a face lying in the
  // plane, which the closed front side contains.
  if (!c.hasBack) {
    return Solution.one(planar(p))
  }
  if (!c.hasFront) {
    return Solution.none
  }
  return piece(p.vertices, c, 1)
})

/** @internal */
export const split = dual<
  (pl: Plane3d) => (p: Polygon3d<Convex>) => Split,
  (p: Polygon3d<Convex>, pl: Plane3d) => Split
>(2, (p: Polygon3d<Convex>, pl: Plane3d): Split => {
  const c = cut(p.vertices, pl)
  const whole = Solution.one(planar(p))
  if (!c.hasBack) {
    // A face lying in the plane is on both closed sides, like a vertex on it.
    return { front: whole, back: c.hasFront ? Solution.none : whole }
  }
  if (!c.hasFront) {
    return { front: Solution.none, back: whole }
  }
  return { front: piece(p.vertices, c, 1), back: piece(p.vertices, c, -1) }
})

/** @internal */
export const inset = dual<
  (distance: number) => (p: Polygon3d<Convex>) => Solution.AtMostOne<Polygon3d<Convex & Planar>>,
  (p: Polygon3d<Convex>, distance: number) => Solution.AtMostOne<Polygon3d<Convex & Planar>>
>(2, (p: Polygon3d<Convex>, distance: number): Solution.AtMostOne<Polygon3d<Convex & Planar>> => {
  invariant(
    Number.isFinite(distance) && distance >= 0,
    'inset requires a finite, non-negative distance',
  )
  if (distance === 0) {
    return Solution.one(planar(p))
  }
  const fitted = plane3d.fit(p.vertices)
  // Reachable only through a cast: every Convex polygon has area.
  invariant(!Solution.isNone(fitted), 'polygon has no area')
  const n = fitted.value.normal
  // As in 2D: the polygon is the intersection of the inner sides of its
  // edges, here planes through each edge perpendicular to the face. Pushing
  // each inward by `distance` and clipping by it in turn drops edges that
  // collapse, and leaves nothing once the inset passes the inradius.
  const vs = p.vertices
  let current: ReadonlyArray<Vector3> = vs
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i]!
    const b = vs[(i + 1) % vs.length]!
    if (vector3.equals(a, b)) {
      continue
    }
    // cross(n, b - a) points into a polygon running counterclockwise
    // about n.
    const ex = b.x - a.x
    const ey = b.y - a.y
    const ez = b.z - a.z
    const mx = n.y * ez - n.z * ey
    const my = n.z * ex - n.x * ez
    const mz = n.x * ey - n.y * ex
    const length = Math.hypot(mx, my, mz)
    const m = vector3.make(mx / length, my / length, mz / length)
    const c = cut(current, plane3d.fromUnit(m, m.x * a.x + m.y * a.y + m.z * a.z + distance))
    if (!c.hasFront) {
      return Solution.none
    }
    if (c.hasBack) {
      const next = piece(current, c, 1)
      if (Solution.isNone(next)) {
        return Solution.none
      }
      current = next.value.vertices
    }
  }
  return Solution.one(convex(current))
})

// ---------------------------------------------------------------------------
// Transformation
// ---------------------------------------------------------------------------

/** @internal */
export const reverse = <T>(p: Polygon3d<T>): Polygon3d<T> =>
  new Polygon3dImpl(p.vertices.toReversed()) as Polygon3d<T>

/** @internal */
export const transform = dual<
  (a: Affine3d) => (p: Polygon3d) => Polygon3d,
  (p: Polygon3d, a: Affine3d) => Polygon3d
>(
  2,
  (p: Polygon3d, a: Affine3d): Polygon3d =>
    new Polygon3dImpl(p.vertices.map((v) => affine3d.apply(a, v))),
)
