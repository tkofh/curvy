import { onPlaneTolerance } from '../../internal/vectorArea.ts'
import * as matrix3x3 from '../../matrix/internal/matrix3x3.ts'
import * as plane3d from '../../plane/internal/plane3d.ts'
import type { Plane3d } from '../../plane/plane3d.ts'
import * as polygon3d from '../../polygon/internal/polygon3d.ts'
import type { Convex, Planar } from '../../polygon/internal/traits.ts'
import type { Polygon3d } from '../../polygon/polygon3d.ts'
import * as Solution from '../../solution/solution.ts'
import type { Affine3d } from '../../transform/affine3d.ts'
import * as affine3d from '../../transform/internal/affine3d.ts'
import { dual } from '../../utils/function.ts'
import { Value } from '../../utils/value.ts'
import * as vector3 from '../../vector/internal/vector3.ts'
import type { Vector3 } from '../../vector/vector3.ts'
import type { ConvexPolyhedron, Face, HalfSpace } from '../convexPolyhedron.ts'

const ConvexPolyhedronTypeId = '~curvy/ConvexPolyhedron'

class ConvexPolyhedronImpl
  extends Value(ConvexPolyhedronTypeId)
  implements ConvexPolyhedron<unknown>
{
  readonly vertices: ReadonlyArray<Vector3>
  readonly faces: ReadonlyArray<Face<unknown>>

  constructor(vertices: ReadonlyArray<Vector3>, faces: ReadonlyArray<Face<unknown>>) {
    super()
    this.vertices = vertices
    this.faces = faces
  }

  toString() {
    return `ConvexPolyhedron(${this.vertices.length} vertices, ${this.faces.length} faces)`
  }
}

/** @internal */
export const isConvexPolyhedron = (p: unknown): p is ConvexPolyhedron =>
  typeof p === 'object' && p !== null && ConvexPolyhedronTypeId in p

const distance = (pl: Plane3d, q: Vector3): number =>
  pl.normal.x * q.x + pl.normal.y * q.y + pl.normal.z * q.z - pl.offset

const magnitude = (q: Vector3): number => Math.max(Math.abs(q.x), Math.abs(q.y), Math.abs(q.z))

interface Corner {
  readonly point: Vector3
  // Indices of the planes the corner lies on, ascending.
  readonly on: Array<number>
}

// Orthonormal (u, v) spanning the plane perpendicular to the unit `n`, with
// cross(u, v) = n, so increasing angle from u toward v runs counterclockwise
// about n.
const unitX = vector3.make(1, 0, 0)
const unitY = vector3.make(0, 1, 0)

const basis = (n: Vector3): readonly [Vector3, Vector3] => {
  const seed = Math.abs(n.x) < 0.9 ? unitX : unitY
  const u = vector3.normalize(vector3.cross(seed, n))
  return [u, vector3.cross(n, u)]
}

/** @internal */
export const fromHalfSpaces = (
  input: ReadonlyArray<Plane3d | HalfSpace<unknown>>,
): Solution.AtMostOne<ConvexPolyhedron<unknown>> => {
  const spaces: ReadonlyArray<HalfSpace<unknown>> = input.map((h, i) =>
    plane3d.isPlane3d(h) ? { plane: h, label: i } : h,
  )
  const planes = spaces.map((s) => s.plane)
  const count = planes.length
  if (count < 4) {
    return Solution.none
  }
  let offsets = 0
  for (const pl of planes) {
    offsets = Math.max(offsets, Math.abs(pl.offset))
  }

  // Every corner of the solid is where three of its planes meet, so the
  // candidates are the meeting points of every triple that no half-space
  // excludes. Each is an exact solve of input planes rather than the end of
  // a chain of clips. The search is cubic in the plane count, and the
  // feasibility check makes it quartic: fine for the tens of planes a
  // modeled part has.
  const points: Array<Vector3> = []
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      for (let k = j + 1; k < count; k++) {
        const meet = plane3d.intersection(planes[i]!, planes[j]!, planes[k]!)
        if (Solution.isNone(meet)) {
          continue
        }
        const q = meet.value
        const tolerance = onPlaneTolerance(Math.max(magnitude(q), offsets))
        if (planes.every((pl) => distance(pl, q) <= tolerance)) {
          points.push(q)
        }
      }
    }
  }
  if (points.length < 4) {
    return Solution.none
  }

  // One band for incidence and welding, from the solid's own scale
  // (PRECISION.md regime 2).
  let scale = offsets
  for (const q of points) {
    scale = Math.max(scale, magnitude(q))
  }
  const tolerance = onPlaneTolerance(scale)

  // Weld the candidates. Where more than three planes meet, several triples
  // find the same corner, and an ill-conditioned triple can land it farther
  // off than the band. Corners on the same set of planes are the same
  // corner whatever their distance, since three of those planes pin it.
  const corners: Array<Corner> = []
  const byPlanes = new Map<string, Corner>()
  for (const q of points) {
    const on: Array<number> = []
    for (let l = 0; l < count; l++) {
      if (Math.abs(distance(planes[l]!, q)) <= tolerance) {
        on.push(l)
      }
    }
    const key = on.join(',')
    const same =
      byPlanes.get(key) ??
      corners.find(
        (c) =>
          Math.abs(c.point.x - q.x) <= tolerance &&
          Math.abs(c.point.y - q.y) <= tolerance &&
          Math.abs(c.point.z - q.z) <= tolerance,
      )
    if (same === undefined) {
      const corner = { point: q, on }
      corners.push(corner)
      byPlanes.set(key, corner)
    } else {
      for (const l of on) {
        if (!same.on.includes(l)) {
          same.on.push(l)
        }
      }
    }
  }

  // A face for each plane holding three or more corners, in input order.
  // A plane repeating an earlier face adds nothing.
  const faces: Array<{ readonly corners: ReadonlyArray<number>; readonly space: number }> = []
  const seen = new Set<string>()
  for (let l = 0; l < count; l++) {
    const on: Array<number> = []
    for (let c = 0; c < corners.length; c++) {
      if (corners[c]!.on.includes(l)) {
        on.push(c)
      }
    }
    const key = on.join(',')
    if (on.length < 3 || seen.has(key)) {
      continue
    }
    seen.add(key)
    // The corners of a face are the extreme points of a convex polygon, so
    // sorting by angle about their average orders them. Counterclockwise
    // about the outward normal is counterclockwise seen from outside.
    const n = planes[l]!.normal
    const [u, v] = basis(n)
    let cx = 0
    let cy = 0
    let cz = 0
    for (const c of on) {
      cx += corners[c]!.point.x
      cy += corners[c]!.point.y
      cz += corners[c]!.point.z
    }
    cx /= on.length
    cy /= on.length
    cz /= on.length
    const angle = new Map<number, number>()
    for (const c of on) {
      const p = corners[c]!.point
      const dx = p.x - cx
      const dy = p.y - cy
      const dz = p.z - cz
      angle.set(c, Math.atan2(dx * v.x + dy * v.y + dz * v.z, dx * u.x + dy * u.y + dz * u.z))
    }
    on.sort((a, b) => angle.get(a)! - angle.get(b)!)
    faces.push({ corners: on, space: l })
  }

  // A bounded solid is closed: every edge borders exactly two faces, which
  // run along it in opposite directions. An unbounded region leaves some
  // edge with one face, and a flat one has fewer than four faces.
  if (faces.length < 4) {
    return Solution.none
  }
  const edges = new Set<string>()
  for (const f of faces) {
    for (let i = 0; i < f.corners.length; i++) {
      const key = `${f.corners[i]},${f.corners[(i + 1) % f.corners.length]}`
      if (edges.has(key)) {
        return Solution.none
      }
      edges.add(key)
    }
  }
  for (const f of faces) {
    for (let i = 0; i < f.corners.length; i++) {
      if (!edges.has(`${f.corners[(i + 1) % f.corners.length]},${f.corners[i]}`)) {
        return Solution.none
      }
    }
  }

  // Keep only the corners some face uses, numbered in discovery order.
  const index = new Map<number, number>()
  const vertices: Array<Vector3> = []
  for (let c = 0; c < corners.length; c++) {
    if (faces.some((f) => f.corners.includes(c))) {
      index.set(c, vertices.length)
      // Adding zero turns the solver's -0 into 0.
      const q = corners[c]!.point
      vertices.push(vector3.make(q.x + 0, q.y + 0, q.z + 0))
    }
  }
  return Solution.one(
    new ConvexPolyhedronImpl(
      vertices,
      faces.map((f) => ({
        indices: f.corners.map((c) => index.get(c)!),
        plane: spaces[f.space]!.plane,
        label: spaces[f.space]!.label,
      })),
    ),
  )
}

/** @internal */
export const contains = dual<
  (point: Vector3) => (p: ConvexPolyhedron<unknown>) => boolean,
  (p: ConvexPolyhedron<unknown>, point: Vector3) => boolean
>(2, (p: ConvexPolyhedron<unknown>, point: Vector3): boolean => {
  const m = magnitude(point)
  return p.faces.every(
    (f) => distance(f.plane, point) <= onPlaneTolerance(Math.max(m, Math.abs(f.plane.offset))),
  )
})

/** @internal */
export const polygons = (p: ConvexPolyhedron<unknown>): ReadonlyArray<Polygon3d<Convex & Planar>> =>
  p.faces.map((f) => polygon3d.convex(f.indices.map((i) => p.vertices[i]!)))

/** @internal */
export const transform = dual<
  (a: Affine3d) => <L>(p: ConvexPolyhedron<L>) => ConvexPolyhedron<L>,
  <L>(p: ConvexPolyhedron<L>, a: Affine3d) => ConvexPolyhedron<L>
>(2, <L>(p: ConvexPolyhedron<L>, a: Affine3d): ConvexPolyhedron<L> => {
  // A mirror reverses every face's winding, so reverse the indices to keep
  // them counterclockwise from outside. `Plane3d.transform` already keeps
  // the planes facing out.
  const mirror = matrix3x3.determinant(affine3d.linear(a)) < 0
  return new ConvexPolyhedronImpl(
    p.vertices.map((v) => affine3d.apply(a, v)),
    p.faces.map((f) => ({
      indices: mirror ? f.indices.toReversed() : f.indices,
      plane: plane3d.transform(f.plane, a),
      label: f.label,
    })),
  ) as ConvexPolyhedron<L>
})
