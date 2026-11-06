import { EPSILON, RELATIVE_TOLERANCE } from '../number.ts'
import type { Vector3 } from '../vector/vector3.ts'

/**
 * Twice the vector area of a closed 3D polygon, with the rounding scale
 * its degeneracy test needs.
 *
 * The sum of `cross(v_i, v_(i+1))` over the edges is Newell's normal. It
 * points along the polygon's normal by the right-hand rule, its length is
 * twice the area the polygon encloses seen along that normal, and it
 * averages out small departures from planarity. Summing the same cross
 * products as a fan from the first vertex gives the identical vector for
 * any closed polygon, and keeps each term small when the polygon sits far
 * from the origin.
 *
 * `scale` bounds the sum's rounding error (PRECISION.md regime 3): the
 * products' magnitudes, plus `M` times the edge lengths for the error
 * each coordinate difference carries.
 *
 * @internal
 */
export interface VectorArea {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly scale: number
}

/** @internal */
export const coordinateMagnitude = (vertices: ReadonlyArray<Vector3>): number => {
  let m = 0
  for (const v of vertices) {
    m = Math.max(m, Math.abs(v.x), Math.abs(v.y), Math.abs(v.z))
  }
  return m
}

/** @internal */
export const vectorArea = (vertices: ReadonlyArray<Vector3>): VectorArea => {
  const p0 = vertices[0]!
  const m = coordinateMagnitude(vertices)
  let x = 0
  let y = 0
  let z = 0
  let scale = 0
  for (let i = 1; i < vertices.length - 1; i++) {
    const a = vertices[i]!
    const b = vertices[i + 1]!
    const ax = a.x - p0.x
    const ay = a.y - p0.y
    const az = a.z - p0.z
    const bx = b.x - p0.x
    const by = b.y - p0.y
    const bz = b.z - p0.z
    x += ay * bz - az * by
    y += az * bx - ax * bz
    z += ax * by - ay * bx
    const la = Math.abs(ax) + Math.abs(ay) + Math.abs(az)
    const lb = Math.abs(bx) + Math.abs(by) + Math.abs(bz)
    scale += la * lb + m * (la + lb)
  }
  return { x, y, z, scale }
}

/** @internal */
export const isDegenerate = (a: VectorArea): boolean =>
  Math.hypot(a.x, a.y, a.z) <= RELATIVE_TOLERANCE * a.scale

/**
 * The band within which a point counts as on a plane: `EPSILON` near the
 * origin, growing with the largest coordinate in play (PRECISION.md
 * regime 2).
 *
 * @internal
 */
export const onPlaneTolerance = (magnitude: number): number =>
  EPSILON + RELATIVE_TOLERANCE * magnitude
