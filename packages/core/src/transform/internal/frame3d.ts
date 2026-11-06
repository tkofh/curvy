import * as matrix3x3 from '../../matrix/internal/matrix3x3.ts'
import { EPSILON } from '../../number.ts'
import * as quaternion from '../../quaternion/internal/quaternion.ts'
import type { Unit } from '../../quaternion/internal/traits.ts'
import type { Quaternion } from '../../quaternion/quaternion.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import * as vector3 from '../../vector/internal/vector3.ts'
import type { Vector3 } from '../../vector/vector3.ts'
import type { Frame3d, Frame3dConfig, YawPitchRoll } from '../frame3d.ts'
import type { Rotation3d } from '../rotation3d.ts'
import * as rotation3d from './rotation3d.ts'

const Frame3dTypeId = '~curvy/Frame3d'

const show = (v: Vector3) => `(${v.x}, ${v.y}, ${v.z})`

class Frame3dImpl extends Value(Frame3dTypeId) implements Frame3d {
  readonly right: Vector3
  readonly up: Vector3
  readonly forward: Vector3

  constructor(right: Vector3, up: Vector3, forward: Vector3) {
    super()
    this.right = right
    this.up = up
    this.forward = forward
  }

  toString() {
    return `Frame3d(up ${show(this.up)}, forward ${show(this.forward)})`
  }
}

const unit = (label: string, name: string, v: Vector3): Vector3 => {
  const m = vector3.magnitude(v)
  invariant(Number.isFinite(m) && m > 0, `${label} requires a non-zero finite ${name}`)
  return vector3.make(v.x / m, v.y / m, v.z / m)
}

/** @internal */
export const isFrame3d = (f: unknown): f is Frame3d =>
  typeof f === 'object' && f !== null && Frame3dTypeId in f

/** @internal */
export const make = (config: Frame3dConfig): Frame3d => {
  const up = unit('Frame3d', 'up', config.up)
  const forward = unit('Frame3d', 'forward', config.forward)
  // Unit vectors live on a fixed scale, so perpendicularity uses the
  // absolute band of a normalized domain (PRECISION.md regime 1).
  invariant(
    Math.abs(vector3.dot(up, forward)) <= EPSILON,
    'Frame3d requires up and forward to be perpendicular',
  )
  return new Frame3dImpl(vector3.cross(forward, up), up, forward)
}

/** @internal */
export const equals = dual<
  (b: Frame3d) => (a: Frame3d) => boolean,
  (a: Frame3d, b: Frame3d) => boolean
>(
  2,
  (a: Frame3d, b: Frame3d): boolean =>
    vector3.equals(a.up, b.up) && vector3.equals(a.forward, b.forward),
)

// Each angle turns one frame direction toward another, which fixes its
// axis without any appeal to handedness: turning a toward b is a positive
// rotation about cross(a, b). With right = cross(forward, up):
// - yaw turns forward toward right, about cross(forward, right) = -up
// - pitch turns forward toward up, about cross(forward, up) = right
// - roll turns up toward right, about cross(up, right) = forward

/** @internal */
export const fromYawPitchRoll = dual<
  (angles: Partial<YawPitchRoll>) => (f: Frame3d) => Rotation3d,
  (f: Frame3d, angles: Partial<YawPitchRoll>) => Rotation3d
>(2, (f: Frame3d, angles: Partial<YawPitchRoll>): Rotation3d => {
  const yaw = rotation3d.fromAxisAngle(vector3.make(-f.up.x, -f.up.y, -f.up.z), angles.yaw ?? 0)
  const pitch = rotation3d.fromAxisAngle(f.right, angles.pitch ?? 0)
  const roll = rotation3d.fromAxisAngle(f.forward, angles.roll ?? 0)
  // Yaw, then pitch about the yawed right, then roll about the moved
  // forward. In fixed axes that is roll first, then pitch, then yaw.
  return rotation3d.andThen(rotation3d.andThen(roll, pitch), yaw)
})

/** @internal */
export const toYawPitchRoll = dual<
  (r: Rotation3d | Quaternion<Unit>) => (f: Frame3d) => YawPitchRoll,
  (f: Frame3d, r: Rotation3d | Quaternion<Unit>) => YawPitchRoll
>(2, (f: Frame3d, r: Rotation3d | Quaternion<Unit>): YawPitchRoll => {
  // Rewrite the rotation in the frame's own coordinates, with axes
  // (right, up, back). That basis has determinant +1, so the rotation keeps
  // its angle and only its axis changes coordinates. There, yaw is about
  // -Y, pitch about +X, and roll about -Z, so the frame rotation is
  // Ry(-yaw) * Rx(pitch) * Rz(-roll): Euler order 'YXZ'.
  const q = rotation3d.isRotation3d(r) ? r.quaternion : r
  const v = vector3.make(q.x, q.y, q.z)
  const local = quaternion.makeUnit(
    vector3.dot(v, f.right),
    vector3.dot(v, f.up),
    -vector3.dot(v, f.forward),
    q.w,
  )
  const angles = rotation3d.toEuler(local, 'YXZ')
  // `0 - x` rather than `-x`, so a zero angle comes back as 0 and not -0.
  return { yaw: 0 - angles.y, pitch: angles.x, roll: 0 - angles.z }
})

/** @internal */
export const lookRotation = (f: Frame3d, direction: Vector3, up?: Vector3): Rotation3d => {
  const forward = unit('lookRotation', 'direction', direction)
  const hint = up === undefined ? f.up : unit('lookRotation', 'up', up)
  const crossed = vector3.cross(forward, hint)
  const length = vector3.magnitude(crossed)
  if (length <= EPSILON) {
    // Looking straight along the up hint leaves the roll undetermined. The
    // smallest turn from the frame's forward is the natural choice.
    return rotation3d.between(f.forward, forward)
  }
  const right = vector3.make(crossed.x / length, crossed.y / length, crossed.z / length)
  const newUp = vector3.cross(right, forward)
  // The rotation taking the frame's (right, up, forward) to the new one:
  // R = T * B^T, with each basis as the columns of T and B.
  const entry = (i: 'x' | 'y' | 'z', j: 'x' | 'y' | 'z') =>
    right[i] * f.right[j] + newUp[i] * f.up[j] + forward[i] * f.forward[j]
  return rotation3d.fromOrthonormal(
    matrix3x3.make(
      entry('x', 'x'),
      entry('x', 'y'),
      entry('x', 'z'),
      entry('y', 'x'),
      entry('y', 'y'),
      entry('y', 'z'),
      entry('z', 'x'),
      entry('z', 'y'),
      entry('z', 'z'),
    ),
  )
}
