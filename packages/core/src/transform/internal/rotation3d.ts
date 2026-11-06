import * as matrix3x3 from '../../matrix/internal/matrix3x3.ts'
import type { Matrix3x3 } from '../../matrix/matrix3x3.ts'
import { EPSILON, coincident } from '../../number.ts'
import * as quaternion from '../../quaternion/internal/quaternion.ts'
import type { Unit } from '../../quaternion/internal/traits.ts'
import type { Quaternion } from '../../quaternion/quaternion.ts'
import * as Solution from '../../solution/solution.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import * as vector3 from '../../vector/internal/vector3.ts'
import type { Vector3 } from '../../vector/vector3.ts'
import type { AxisAngle, EulerOrder, Rotation3d, SwingTwist } from '../rotation3d.ts'

const Rotation3dTypeId = '~curvy/Rotation3d'

const UNIT_X = vector3.make(1, 0, 0)
const UNIT_Y = vector3.make(0, 1, 0)

class Rotation3dImpl extends Value(Rotation3dTypeId) implements Rotation3d {
  readonly quaternion: Quaternion<Unit>

  constructor(q: Quaternion<Unit>) {
    super()
    this.quaternion = q
  }

  toString() {
    const q = this.quaternion
    return `Rotation3d(${q.x}, ${q.y}, ${q.z}, ${q.w})`
  }
}

type Input = Rotation3d | Quaternion<Unit>

/** @internal */
export const isRotation3d = (r: unknown): r is Rotation3d =>
  typeof r === 'object' && r !== null && Rotation3dTypeId in r

// Every operation reads a rotation through this, so a `Quaternion<Unit>`
// works anywhere a `Rotation3d` does.
const q = (r: Input): Quaternion<Unit> => (isRotation3d(r) ? r.quaternion : r)

const fromComponents = (x: number, y: number, z: number, w: number): Rotation3d =>
  new Rotation3dImpl(quaternion.makeUnit(x, y, z, w))

const fromProduct = (p: Quaternion): Rotation3d => new Rotation3dImpl(p as Quaternion<Unit>)

/** @internal */
export const identity: Rotation3d = new Rotation3dImpl(quaternion.identity)

/** @internal */
export const fromQuaternion = (unit: Quaternion<Unit>): Rotation3d => new Rotation3dImpl(unit)

const unitAxis = (label: string, axis: Vector3): Vector3 => {
  const m = vector3.magnitude(axis)
  invariant(Number.isFinite(m) && m > 0, `${label} requires a non-zero finite axis`)
  return vector3.make(axis.x / m, axis.y / m, axis.z / m)
}

/** @internal */
export const fromAxisAngle = (axis: Vector3, angle: number): Rotation3d => {
  invariant(Number.isFinite(angle), 'fromAxisAngle requires a finite angle')
  const n = unitAxis('fromAxisAngle', axis)
  const s = Math.sin(angle / 2)
  return fromComponents(n.x * s, n.y * s, n.z * s, Math.cos(angle / 2))
}

/** @internal */
export const aboutX = (angle: number): Rotation3d =>
  fromComponents(Math.sin(angle / 2), 0, 0, Math.cos(angle / 2))

/** @internal */
export const aboutY = (angle: number): Rotation3d =>
  fromComponents(0, Math.sin(angle / 2), 0, Math.cos(angle / 2))

/** @internal */
export const aboutZ = (angle: number): Rotation3d =>
  fromComponents(0, 0, Math.sin(angle / 2), Math.cos(angle / 2))

/** @internal */
export const between = (from: Vector3, to: Vector3): Rotation3d => {
  const u = unitAxis('between', from)
  const v = unitAxis('between', to)
  const d = vector3.dot(u, v)
  if (1 + d <= EPSILON) {
    // Opposite directions: every half turn about an axis perpendicular to
    // `from` qualifies. Cross with whichever basis axis is far from `from`.
    const c = Math.abs(u.x) < 0.9 ? vector3.cross(u, UNIT_X) : vector3.cross(u, UNIT_Y)
    const n = vector3.normalize(c)
    return fromComponents(n.x, n.y, n.z, 0)
  }
  // The half-angle quaternion (cross(u, v), 1 + dot(u, v)), normalized.
  const c = vector3.cross(u, v)
  const w = 1 + d
  const m = Math.hypot(c.x, c.y, c.z, w)
  return fromComponents(c.x / m, c.y / m, c.z / m, w / m)
}

/** @internal */
export const andThen = dual<
  (b: Input) => (a: Input) => Rotation3d,
  (a: Input, b: Input) => Rotation3d
>(2, (a: Input, b: Input): Rotation3d => {
  // Apply a, then b: the product b * a.
  const p = q(a)
  const r = q(b)
  return fromProduct(quaternion.product(r.x, r.y, r.z, r.w, p.x, p.y, p.z, p.w))
})

/** @internal */
export const inverse = (r: Input): Rotation3d => new Rotation3dImpl(quaternion.conjugate(q(r)))

/** @internal */
export const apply = dual<(v: Vector3) => (r: Input) => Vector3, (r: Input, v: Vector3) => Vector3>(
  2,
  (r: Input, v: Vector3): Vector3 => {
    // v + w*t + cross(u, t) with t = 2 * cross(u, v), which expands
    // q * v * conjugate(q) without forming the products.
    const { x, y, z, w } = q(r)
    const tx = 2 * (y * v.z - z * v.y)
    const ty = 2 * (z * v.x - x * v.z)
    const tz = 2 * (x * v.y - y * v.x)
    return vector3.make(
      v.x + w * tx + (y * tz - z * ty),
      v.y + w * ty + (z * tx - x * tz),
      v.z + w * tz + (x * ty - y * tx),
    )
  },
)

/** @internal */
export const applyTo =
  (r: Input) =>
  (v: Vector3): Vector3 =>
    apply(r, v)

/** @internal */
export const toMatrix3x3 = (r: Input): Matrix3x3 => {
  const { x, y, z, w } = q(r)
  return matrix3x3.make(
    1 - 2 * (y * y + z * z),
    2 * (x * y - z * w),
    2 * (x * z + y * w),
    2 * (x * y + z * w),
    1 - 2 * (x * x + z * z),
    2 * (y * z - x * w),
    2 * (x * z - y * w),
    2 * (y * z + x * w),
    1 - 2 * (x * x + y * y),
  )
}

/** @internal */
export const fromMatrix3x3 = (m: Matrix3x3): Solution.AtMostOne<Rotation3d> => {
  // A rotation matrix has orthonormal columns and determinant +1. Entries
  // of an orthonormal matrix are bounded by 1, so the checks use the
  // absolute band of a normalized domain (PRECISION.md regime 1).
  const c0x = m.m00
  const c0y = m.m10
  const c0z = m.m20
  const c1x = m.m01
  const c1y = m.m11
  const c1z = m.m21
  const c2x = m.m02
  const c2y = m.m12
  const c2z = m.m22
  const gram = [
    c0x * c0x + c0y * c0y + c0z * c0z - 1,
    c1x * c1x + c1y * c1y + c1z * c1z - 1,
    c2x * c2x + c2y * c2y + c2z * c2z - 1,
    c0x * c1x + c0y * c1y + c0z * c1z,
    c0x * c2x + c0y * c2y + c0z * c2z,
    c1x * c2x + c1y * c2y + c1z * c2z,
  ]
  if (!gram.every((g) => Math.abs(g) <= EPSILON)) {
    return Solution.none
  }
  if (matrix3x3.determinant(m) <= 0) {
    return Solution.none
  }
  return Solution.one(fromOrthonormal(m))
}

// The rotation of a matrix already known to be one, built by an operation
// that guarantees orthonormal columns with determinant +1.
/** @internal */
export const fromOrthonormal = (m: Matrix3x3): Rotation3d => {
  // Shepperd's method: divide by the largest of the four candidate
  // components, so the square root never sees a value near zero.
  const trace = m.m00 + m.m11 + m.m22
  if (trace > 0) {
    const s = 2 * Math.sqrt(trace + 1)
    return fromComponents((m.m21 - m.m12) / s, (m.m02 - m.m20) / s, (m.m10 - m.m01) / s, s / 4)
  }
  if (m.m00 > m.m11 && m.m00 > m.m22) {
    const s = 2 * Math.sqrt(1 + m.m00 - m.m11 - m.m22)
    return fromComponents(s / 4, (m.m01 + m.m10) / s, (m.m02 + m.m20) / s, (m.m21 - m.m12) / s)
  }
  if (m.m11 > m.m22) {
    const s = 2 * Math.sqrt(1 + m.m11 - m.m00 - m.m22)
    return fromComponents((m.m01 + m.m10) / s, s / 4, (m.m12 + m.m21) / s, (m.m02 - m.m20) / s)
  }
  const s = 2 * Math.sqrt(1 + m.m22 - m.m00 - m.m11)
  return fromComponents((m.m02 + m.m20) / s, (m.m12 + m.m21) / s, s / 4, (m.m10 - m.m01) / s)
}

/** @internal */
export const toAxisAngle = (r: Input): AxisAngle => {
  const { x, y, z, w } = q(r)
  // q and -q are the same rotation. Taking w >= 0 picks the representative
  // whose angle lies in [0, pi].
  const sign = w < 0 ? -1 : 1
  const s = Math.hypot(x, y, z)
  if (s === 0) {
    return { axis: UNIT_X, angle: 0 }
  }
  return {
    axis: vector3.make((sign * x) / s, (sign * y) / s, (sign * z) / s),
    angle: 2 * Math.atan2(s, sign * w),
  }
}

// ---------------------------------------------------------------------------
// Euler angles
// ---------------------------------------------------------------------------

const AXIS_INDEX = { X: 0, Y: 1, Z: 2 } as const

const axisRotation = (axis: 0 | 1 | 2, angle: number): Quaternion => {
  const s = Math.sin(angle / 2)
  const c = Math.cos(angle / 2)
  return quaternion.make(axis === 0 ? s : 0, axis === 1 ? s : 0, axis === 2 ? s : 0, c)
}

const EULER_ORDERS: ReadonlySet<string> = new Set(['XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX'])

const axesOf = (label: string, order: EulerOrder): readonly [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2] => {
  invariant(EULER_ORDERS.has(order), `${label} requires an order such as 'XYZ'`)
  return [AXIS_INDEX[order[0] as 'X'], AXIS_INDEX[order[1] as 'X'], AXIS_INDEX[order[2] as 'X']]
}

/** @internal */
export const fromEuler = (angles: Vector3, order: EulerOrder = 'XYZ'): Rotation3d => {
  const axes = axesOf('fromEuler', order)
  const values = [angles.x, angles.y, angles.z]
  // The order names the factors of the product left to right, so 'XYZ' is
  // Rx * Ry * Rz: Z applies first in the parent frame.
  let p: Quaternion = quaternion.identity
  for (const axis of axes) {
    p = quaternion.multiply(p, axisRotation(axis, values[axis]!))
  }
  return fromProduct(p)
}

// Below this cosine of the middle angle, the first and third axes are too
// close to aligned to separate. The two branches err in opposite ways: the
// general one by about Number.EPSILON / cosine, the aligned one by about the
// cosine it drops. sqrt(Number.EPSILON) balances them near 1.5e-8.
const GIMBAL_COSINE = Math.sqrt(Number.EPSILON)

/** @internal */
export const toEuler = (r: Input, order: EulerOrder = 'XYZ'): Vector3 => {
  const [i, j, k] = axesOf('toEuler', order)
  const m = toMatrix3x3(r)
  const rows = [
    [m.m00, m.m01, m.m02],
    [m.m10, m.m11, m.m12],
    [m.m20, m.m21, m.m22],
  ] as const
  const at = (row: number, column: number) => rows[row]![column]!
  // +1 for the cyclic orders (XYZ, YZX, ZXY), -1 for the others.
  const parity = (j - i + 3) % 3 === 1 ? 1 : -1

  const cosine = Math.hypot(at(j, k), at(k, k))
  const middle = Math.atan2(parity * at(i, k), cosine)
  let first: number
  let last: number
  if (cosine > GIMBAL_COSINE) {
    first = Math.atan2(-parity * at(j, k), at(k, k))
    last = Math.atan2(-parity * at(i, j), at(i, i))
  } else {
    // Gimbal lock: only the sum (or difference) of the outer angles is
    // determined. Put all of it in the first angle.
    first = Math.atan2(parity * at(k, j), at(j, j))
    last = 0
  }
  const out = [0, 0, 0]
  out[i] = first
  out[j] = middle
  out[k] = last
  return vector3.make(out[0]!, out[1]!, out[2]!)
}

// ---------------------------------------------------------------------------
// Comparison and interpolation
// ---------------------------------------------------------------------------

/** @internal */
export const equals = dual<(b: Input) => (a: Input) => boolean, (a: Input, b: Input) => boolean>(
  2,
  (a: Input, b: Input): boolean => {
    const p = q(a)
    const r = q(b)
    const same =
      coincident(p.x, r.x) && coincident(p.y, r.y) && coincident(p.z, r.z) && coincident(p.w, r.w)
    // q and -q are the same rotation.
    return (
      same ||
      (coincident(p.x, -r.x) &&
        coincident(p.y, -r.y) &&
        coincident(p.z, -r.z) &&
        coincident(p.w, -r.w))
    )
  },
)

// The angle between two unit quaternions as 4-vectors, after flipping `b`
// into `a`'s hemisphere, along with the flip. 2 * atan2(|a - b|, |a + b|)
// stays accurate at small angles, where acos(dot) loses half its digits.
const separation = (
  a: Quaternion,
  b: Quaternion,
): { readonly angle: number; readonly sign: 1 | -1 } => {
  const sign = quaternion.dot(a, b) < 0 ? -1 : 1
  const diff = Math.hypot(a.x - sign * b.x, a.y - sign * b.y, a.z - sign * b.z, a.w - sign * b.w)
  const sum = Math.hypot(a.x + sign * b.x, a.y + sign * b.y, a.z + sign * b.z, a.w + sign * b.w)
  return { angle: 2 * Math.atan2(diff, sum), sign }
}

/** @internal */
export const angleBetween = dual<
  (b: Input) => (a: Input) => number,
  (a: Input, b: Input) => number
>(
  2,
  // A rotation by theta sits theta / 2 from the identity as a 4-vector.
  (a: Input, b: Input): number => 2 * separation(q(a), q(b)).angle,
)

/** @internal */
export const slerp = dual<
  (b: Input, t: number) => (a: Input) => Rotation3d,
  (a: Input, b: Input, t: number) => Rotation3d
>(3, (a: Input, b: Input, t: number): Rotation3d => {
  const p = q(a)
  const r = q(b)
  const { angle, sign } = separation(p, r)
  if (angle === 0) {
    return isRotation3d(a) ? a : new Rotation3dImpl(p)
  }
  const s = Math.sin(angle)
  const wa = Math.sin((1 - t) * angle) / s
  const wb = (sign * Math.sin(t * angle)) / s
  return fromComponents(
    wa * p.x + wb * r.x,
    wa * p.y + wb * r.y,
    wa * p.z + wb * r.z,
    wa * p.w + wb * r.w,
  )
})

/** @internal */
export const nlerp = dual<
  (b: Input, t: number) => (a: Input) => Rotation3d,
  (a: Input, b: Input, t: number) => Rotation3d
>(3, (a: Input, b: Input, t: number): Rotation3d => {
  const p = q(a)
  const r = q(b)
  const sign = quaternion.dot(p, r) < 0 ? -1 : 1
  const x = (1 - t) * p.x + t * sign * r.x
  const y = (1 - t) * p.y + t * sign * r.y
  const z = (1 - t) * p.z + t * sign * r.z
  const w = (1 - t) * p.w + t * sign * r.w
  // In the shared hemisphere the blend never passes near zero for t in
  // [0, 1]: its length is at least 1 / sqrt(2).
  const m = Math.hypot(x, y, z, w)
  return fromComponents(x / m, y / m, z / m, w / m)
})

/** @internal */
export const swingTwist = dual<
  (axis: Vector3) => (r: Input) => SwingTwist,
  (r: Input, axis: Vector3) => SwingTwist
>(2, (r: Input, axis: Vector3): SwingTwist => {
  const n = unitAxis('swingTwist', axis)
  const p = q(r)
  // The twist keeps the part of the rotation's axis along `n`.
  const along = p.x * n.x + p.y * n.y + p.z * n.z
  const m = Math.hypot(along, p.w)
  // A half turn about an axis perpendicular to `n` has no twist part to
  // keep: any twist would do, and the identity is the natural choice.
  const twist =
    m <= EPSILON
      ? identity
      : fromComponents((n.x * along) / m, (n.y * along) / m, (n.z * along) / m, p.w / m)
  const t = twist.quaternion
  // r = swing * twist, so swing = r * conjugate(twist).
  const swing = fromProduct(quaternion.product(p.x, p.y, p.z, p.w, -t.x, -t.y, -t.z, t.w))
  return { swing, twist }
})
