import {
  coordinateMagnitude,
  isDegenerate,
  onPlaneTolerance,
  vectorArea,
} from '../../internal/vectorArea.ts'
import { coincident, EPSILON } from '../../number.ts'
import * as Solution from '../../solution/solution.ts'
import type { Affine3d } from '../../transform/affine3d.ts'
import * as affine3d from '../../transform/internal/affine3d.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import * as vector3 from '../../vector/internal/vector3.ts'
import type { Vector3 } from '../../vector/vector3.ts'
import type { Plane3d } from '../plane3d.ts'

const Plane3dTypeId = '~curvy/Plane3d'

class Plane3dImpl extends Value(Plane3dTypeId) implements Plane3d {
  readonly normal: Vector3
  readonly offset: number

  constructor(normal: Vector3, offset: number) {
    super()
    this.normal = normal
    this.offset = offset
  }

  toString() {
    const n = this.normal
    return `Plane3d(normal (${n.x}, ${n.y}, ${n.z}), offset ${this.offset})`
  }
}

/**
 * A plane from a normal the caller has already normalized, unchecked.
 *
 * @internal
 */
export const fromUnit = (normal: Vector3, offset: number): Plane3d =>
  new Plane3dImpl(normal, offset)

const isFiniteVector = (v: Vector3): boolean =>
  Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z)

const unit = (label: string, name: string, v: Vector3): Vector3 => {
  const m = vector3.magnitude(v)
  invariant(Number.isFinite(m) && m > 0, `${label} requires a non-zero finite ${name}`)
  return vector3.make(v.x / m, v.y / m, v.z / m)
}

/** @internal */
export const isPlane3d = (p: unknown): p is Plane3d =>
  typeof p === 'object' && p !== null && Plane3dTypeId in p

/** @internal */
export const make = (normal: Vector3, offset: number): Plane3d => {
  invariant(Number.isFinite(offset), 'Plane3d requires a finite offset')
  const m = vector3.magnitude(normal)
  invariant(Number.isFinite(m) && m > 0, 'Plane3d requires a non-zero finite normal')
  // Scaling the normal and the offset together keeps the same points.
  return new Plane3dImpl(vector3.make(normal.x / m, normal.y / m, normal.z / m), offset / m)
}

/** @internal */
export const fromPointNormal = (point: Vector3, normal: Vector3): Plane3d => {
  invariant(isFiniteVector(point), 'fromPointNormal requires a finite point')
  const n = unit('fromPointNormal', 'normal', normal)
  return new Plane3dImpl(n, vector3.dot(n, point))
}

/**
 * The plane best fitting a closed polygon's vertices: Newell's normal,
 * through the vertices' average. `none` when the vertices enclose no area
 * at working precision.
 *
 * @internal
 */
export const fit = (vertices: ReadonlyArray<Vector3>): Solution.AtMostOne<Plane3d> => {
  const area = vectorArea(vertices)
  if (isDegenerate(area)) {
    return Solution.none
  }
  const length = Math.hypot(area.x, area.y, area.z)
  const n = vector3.make(area.x / length, area.y / length, area.z / length)
  let sx = 0
  let sy = 0
  let sz = 0
  for (const v of vertices) {
    sx += v.x
    sy += v.y
    sz += v.z
  }
  const k = 1 / vertices.length
  return Solution.one(new Plane3dImpl(n, n.x * sx * k + n.y * sy * k + n.z * sz * k))
}

/** @internal */
export const through = (a: Vector3, b: Vector3, c: Vector3): Solution.AtMostOne<Plane3d> => {
  invariant(
    isFiniteVector(a) && isFiniteVector(b) && isFiniteVector(c),
    'through requires finite points',
  )
  return fit([a, b, c])
}

/** @internal */
export const equals = dual<
  (b: Plane3d) => (a: Plane3d) => boolean,
  (a: Plane3d, b: Plane3d) => boolean
>(
  2,
  (a: Plane3d, b: Plane3d): boolean =>
    vector3.equals(a.normal, b.normal) && coincident(a.offset, b.offset),
)

/** @internal */
export const signedDistance = dual<
  (point: Vector3) => (plane: Plane3d) => number,
  (plane: Plane3d, point: Vector3) => number
>(2, (plane: Plane3d, point: Vector3): number => vector3.dot(plane.normal, point) - plane.offset)

/** @internal */
export const closestPoint = dual<
  (point: Vector3) => (plane: Plane3d) => Vector3,
  (plane: Plane3d, point: Vector3) => Vector3
>(2, (plane: Plane3d, point: Vector3): Vector3 => {
  const n = plane.normal
  const d = vector3.dot(n, point) - plane.offset
  return vector3.make(point.x - n.x * d, point.y - n.y * d, point.z - n.z * d)
})

/** @internal */
export const flip = (plane: Plane3d): Plane3d => {
  const n = plane.normal
  // `0 - x` rather than `-x`, so a zero component stays 0 and not -0.
  return new Plane3dImpl(vector3.make(0 - n.x, 0 - n.y, 0 - n.z), 0 - plane.offset)
}

/** @internal */
export const shift = dual<
  (distance: number) => (plane: Plane3d) => Plane3d,
  (plane: Plane3d, distance: number) => Plane3d
>(2, (plane: Plane3d, distance: number): Plane3d => {
  invariant(Number.isFinite(distance), 'shift requires a finite distance')
  return new Plane3dImpl(plane.normal, plane.offset + distance)
})

/** @internal */
export const transform = dual<
  (a: Affine3d) => (plane: Plane3d) => Plane3d,
  (plane: Plane3d, a: Affine3d) => Plane3d
>(2, (plane: Plane3d, a: Affine3d): Plane3d => {
  // The image of the front half-space is the front half-space of the image
  // plane under the inverse transpose, mirror or not, so `applyNormal`
  // carries the orientation through. Any point of the plane fixes the
  // offset; the one nearest the origin is the simplest.
  const n = affine3d.applyNormal(a, plane.normal)
  const p = affine3d.apply(a, vector3.scale(plane.normal, plane.offset))
  return new Plane3dImpl(n, vector3.dot(n, p))
})

/** @internal */
export const intersection = (a: Plane3d, b: Plane3d, c: Plane3d): Solution.AtMostOne<Vector3> => {
  const bc = vector3.cross(b.normal, c.normal)
  const det = vector3.dot(a.normal, bc)
  // The normals are unit vectors, so the determinant is the volume of a
  // unit-edged parallelepiped, on a fixed scale (PRECISION.md regime 1).
  if (Math.abs(det) <= EPSILON) {
    return Solution.none
  }
  const ca = vector3.cross(c.normal, a.normal)
  const ab = vector3.cross(a.normal, b.normal)
  const k = 1 / det
  return Solution.one(
    vector3.make(
      (a.offset * bc.x + b.offset * ca.x + c.offset * ab.x) * k,
      (a.offset * bc.y + b.offset * ca.y + c.offset * ab.y) * k,
      (a.offset * bc.z + b.offset * ca.z + c.offset * ab.z) * k,
    ),
  )
}

/** @internal */
export const intersectRay = dual<
  (origin: Vector3, direction: Vector3) => (plane: Plane3d) => Solution.AtMostOne<Vector3>,
  (plane: Plane3d, origin: Vector3, direction: Vector3) => Solution.AtMostOne<Vector3>
>(3, (plane: Plane3d, origin: Vector3, direction: Vector3): Solution.AtMostOne<Vector3> => {
  invariant(isFiniteVector(origin), 'intersectRay requires a finite origin')
  const d = unit('intersectRay', 'direction', direction)
  const n = plane.normal
  // How far the plane lies ahead of the origin, along the normal.
  const gap = plane.offset - vector3.dot(n, origin)
  if (
    Math.abs(gap) <=
    onPlaneTolerance(Math.max(coordinateMagnitude([origin]), Math.abs(plane.offset)))
  ) {
    return Solution.one(origin)
  }
  const along = vector3.dot(n, d)
  // Both are unit vectors, so this is the cosine of the angle between the
  // ray and the plane's normal (PRECISION.md regime 1).
  if (Math.abs(along) <= EPSILON) {
    return Solution.none
  }
  const t = gap / along
  if (t < 0) {
    return Solution.none
  }
  return Solution.one(vector3.make(origin.x + d.x * t, origin.y + d.y * t, origin.z + d.z * t))
})
