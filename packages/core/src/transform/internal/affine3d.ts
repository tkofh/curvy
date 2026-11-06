import * as matrix3x3 from '../../matrix/internal/matrix3x3.ts'
import * as matrix4x4 from '../../matrix/internal/matrix4x4.ts'
import type { Matrix3x3 } from '../../matrix/matrix3x3.ts'
import type { Matrix4x4 } from '../../matrix/matrix4x4.ts'
import { coincident, EPSILON, RELATIVE_TOLERANCE } from '../../number.ts'
import type { Unit } from '../../quaternion/internal/traits.ts'
import type { Quaternion } from '../../quaternion/quaternion.ts'
import * as Solution from '../../solution/solution.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import * as vector3 from '../../vector/internal/vector3.ts'
import type { Vector3 } from '../../vector/vector3.ts'
import type { Affine3d, ComposeConfig, Decomposition, Shear } from '../affine3d.ts'
import type { Rotation3d } from '../rotation3d.ts'
import * as rotation3d from './rotation3d.ts'
import type { Invertible } from './traits.ts'
import { AffineTraits } from './traits.ts'

const Affine3dTypeId = '~curvy/Affine3d'

class Affine3dImpl extends Value(Affine3dTypeId) implements Affine3d<unknown> {
  declare readonly [AffineTraits]: unknown
  readonly matrix: Matrix4x4

  constructor(matrix: Matrix4x4) {
    super()
    this.matrix = matrix
  }

  toString() {
    const m = this.matrix
    return `Affine3d([${m.m00}, ${m.m01}, ${m.m02}, ${m.m03}], [${m.m10}, ${m.m11}, ${m.m12}, ${m.m13}], [${m.m20}, ${m.m21}, ${m.m22}, ${m.m23}])`
  }
}

// A 4x4 homogeneous matrix from its linear rows and translation column, with
// the structural bottom row [0, 0, 0, 1].
const affine = (
  l00: number,
  l01: number,
  l02: number,
  t0: number,
  l10: number,
  l11: number,
  l12: number,
  t1: number,
  l20: number,
  l21: number,
  l22: number,
  t2: number,
): Affine3d =>
  new Affine3dImpl(
    matrix4x4.make(l00, l01, l02, t0, l10, l11, l12, t1, l20, l21, l22, t2, 0, 0, 0, 1),
  )

const fromLinear = (l: Matrix3x3, t0 = 0, t1 = 0, t2 = 0): Affine3d =>
  affine(l.m00, l.m01, l.m02, t0, l.m10, l.m11, l.m12, t1, l.m20, l.m21, l.m22, t2)

const linearOf = (m: Matrix4x4): Matrix3x3 =>
  matrix3x3.make(m.m00, m.m01, m.m02, m.m10, m.m11, m.m12, m.m20, m.m21, m.m22)

/** @internal */
export const isAffine3d = (a: unknown): a is Affine3d =>
  typeof a === 'object' && a !== null && Affine3dTypeId in a

/** @internal */
export const fromMatrix = (matrix: Matrix4x4): Affine3d => {
  // As in Affine2d: the bottom row is structural, and "zero" there means
  // zero at the scale of the matrix's other entries.
  const m = matrix
  const scale = Math.max(
    Math.abs(m.m00),
    Math.abs(m.m01),
    Math.abs(m.m02),
    Math.abs(m.m03),
    Math.abs(m.m10),
    Math.abs(m.m11),
    Math.abs(m.m12),
    Math.abs(m.m13),
    Math.abs(m.m20),
    Math.abs(m.m21),
    Math.abs(m.m22),
    Math.abs(m.m23),
  )
  const zeroTolerance = EPSILON + RELATIVE_TOLERANCE * scale
  invariant(
    coincident(m.m30, 0, zeroTolerance) &&
      coincident(m.m31, 0, zeroTolerance) &&
      coincident(m.m32, 0, zeroTolerance) &&
      coincident(m.m33, 1),
    'Affine3d requires the fourth row of its matrix to be [0, 0, 0, 1]',
  )
  return new Affine3dImpl(matrix)
}

/** @internal */
export const identity: Affine3d = new Affine3dImpl(matrix4x4.identity)

// Each constructor that takes per-axis numbers also takes them as one vector,
// and the ones with a fixed point take it as an optional last argument that
// defaults to the origin. Argument types tell the call shapes apart.

/** @internal */
export const translate = (tx: number | Vector3, ty?: number, tz?: number): Affine3d =>
  typeof tx === 'number'
    ? affine(1, 0, 0, tx, 0, 1, 0, ty!, 0, 0, 1, tz!)
    : affine(1, 0, 0, tx.x, 0, 1, 0, tx.y, 0, 0, 1, tx.z)

/** @internal */
export const scale = (
  sx: number | Vector3,
  sy?: number | Vector3,
  sz?: number,
  origin?: Vector3,
): Affine3d => {
  let x: number
  let y: number
  let z: number
  let o: Vector3 | undefined
  if (typeof sx !== 'number') {
    x = sx.x
    y = sx.y
    z = sx.z
    o = sy as Vector3 | undefined
  } else if (typeof sy === 'number') {
    x = sx
    y = sy
    z = sz!
    o = origin
  } else {
    x = sx
    y = sx
    z = sx
    o = sy
  }
  if (o === undefined) {
    return affine(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0)
  }
  // T(o) * S * T(-o), expanded so the bottom row stays exact.
  return affine(x, 0, 0, o.x * (1 - x), 0, y, 0, o.y * (1 - y), 0, 0, z, o.z * (1 - z))
}

type RotationInput = Rotation3d | Quaternion<Unit>

/** @internal */
export const rotate = (r: RotationInput, origin?: Vector3): Affine3d => {
  const l = rotation3d.toMatrix3x3(r)
  if (origin === undefined) {
    return fromLinear(l)
  }
  // T(o) * R * T(-o) = [R | o - R * o]
  const moved = matrix3x3.vectorProductLeft(l, origin)
  return fromLinear(l, origin.x - moved.x, origin.y - moved.y, origin.z - moved.z)
}

/** @internal */
export const shear = (s: Partial<Shear>, origin?: Vector3): Affine3d => {
  const xy = s.xy ?? 0
  const xz = s.xz ?? 0
  const yx = s.yx ?? 0
  const yz = s.yz ?? 0
  const zx = s.zx ?? 0
  const zy = s.zy ?? 0
  if (origin === undefined) {
    return affine(1, xy, xz, 0, yx, 1, yz, 0, zx, zy, 1, 0)
  }
  // About o, each coordinate gains its coefficients times the other
  // coordinates' offsets from o: [H | o - H * o], where o - H * o has only
  // the off-diagonal terms.
  const o = origin
  return affine(
    1,
    xy,
    xz,
    -(xy * o.y + xz * o.z),
    yx,
    1,
    yz,
    -(yx * o.x + yz * o.z),
    zx,
    zy,
    1,
    -(zx * o.x + zy * o.y),
  )
}

/** @internal */
export const andThen = dual<
  (b: Affine3d) => (a: Affine3d) => Affine3d,
  (a: Affine3d, b: Affine3d) => Affine3d
>(
  2,
  // Apply a, then b: the product b * a on column vectors.
  (a: Affine3d, b: Affine3d) => new Affine3dImpl(matrix4x4.multiply(b.matrix, a.matrix)),
)

// ---------------------------------------------------------------------------
// Inversion. Only the 3x3 linear part decides invertibility: translation never
// makes an affine map singular, so it stays out of the Hadamard bound.
// ---------------------------------------------------------------------------

/** @internal */
export const isInvertible = <T>(a: Affine3d<T>): a is Affine3d<T & Invertible> =>
  matrix3x3.isInvertible(linearOf(a.matrix))

/** @internal */
export const asInvertible = <T>(a: Affine3d<T>): Affine3d<T & Invertible> => {
  invariant(isInvertible(a), 'affine3d is not invertible')
  return a
}

// [L | t]^-1 = [L^-1 | -L^-1 * t]
const fromInverseLinear = (inv: Matrix3x3, m: Matrix4x4): Affine3d => {
  const t = matrix3x3.vectorProductLeft(inv, vector3.make(m.m03, m.m13, m.m23))
  return fromLinear(inv, -t.x, -t.y, -t.z)
}

/** @internal */
export const inverse = <T>(a: Affine3d<T>): Solution.AtMostOne<Affine3d<T>> => {
  const inv = matrix3x3.inverse(linearOf(a.matrix))
  if (Solution.isNone(inv)) {
    return Solution.none
  }
  return Solution.one(fromInverseLinear(inv.value, a.matrix) as Affine3d<T>)
}

/** @internal */
export const inverseUnsafe = (a: Affine3d): Affine3d => {
  const inv = matrix3x3.inverse(linearOf(a.matrix))
  invariant(Solution.isSome(inv), 'cannot invert singular affine3d')
  return fromInverseLinear(inv.value, a.matrix)
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

/** @internal */
export const apply = dual<
  (p: Vector3) => (a: Affine3d) => Vector3,
  (a: Affine3d, p: Vector3) => Vector3
>(2, (a: Affine3d, p: Vector3): Vector3 => {
  const m = a.matrix
  return vector3.make(
    m.m00 * p.x + m.m01 * p.y + m.m02 * p.z + m.m03,
    m.m10 * p.x + m.m11 * p.y + m.m12 * p.z + m.m13,
    m.m20 * p.x + m.m21 * p.y + m.m22 * p.z + m.m23,
  )
})

/** @internal */
export const applyTo =
  (a: Affine3d) =>
  (p: Vector3): Vector3 =>
    apply(a, p)

/** @internal */
export const applyDirection = dual<
  (d: Vector3) => (a: Affine3d) => Vector3,
  (a: Affine3d, d: Vector3) => Vector3
>(2, (a: Affine3d, d: Vector3): Vector3 => {
  const m = a.matrix
  return vector3.make(
    m.m00 * d.x + m.m01 * d.y + m.m02 * d.z,
    m.m10 * d.x + m.m11 * d.y + m.m12 * d.z,
    m.m20 * d.x + m.m21 * d.y + m.m22 * d.z,
  )
})

/** @internal */
export const applyNormal = dual<
  (n: Vector3) => (a: Affine3d) => Vector3,
  (a: Affine3d, n: Vector3) => Vector3
>(2, (a: Affine3d, n: Vector3): Vector3 => {
  // Normals map by the inverse transpose of the linear part, which keeps
  // them perpendicular to mapped tangents and on the side mapped points
  // move to. n^T * L^-1 is (L^-1)^T * n as a row.
  const inv = matrix3x3.inverse(linearOf(a.matrix))
  invariant(Solution.isSome(inv), 'applyNormal requires an invertible transform')
  const mapped = matrix3x3.vectorProductRight(inv.value, n)
  return vector3.normalize(mapped)
})

/** @internal */
export const linear = (a: Affine3d): Matrix3x3 => linearOf(a.matrix)

/** @internal */
export const translation = (a: Affine3d): Vector3 =>
  vector3.make(a.matrix.m03, a.matrix.m13, a.matrix.m23)

/** @internal */
export const linearPart = (a: Affine3d): Affine3d => fromLinear(linearOf(a.matrix))

/** @internal */
export const equals = dual<
  (b: Affine3d) => (a: Affine3d) => boolean,
  (a: Affine3d, b: Affine3d) => boolean
>(2, (a: Affine3d, b: Affine3d) => matrix4x4.equals(a.matrix, b.matrix))

// ---------------------------------------------------------------------------
// Composition from parts, and decomposition into them
// ---------------------------------------------------------------------------

/** @internal */
export const compose = (config: ComposeConfig): Affine3d => {
  const t = config.translation ?? vector3.make(0, 0, 0)
  const r =
    config.rotation === undefined ? matrix3x3.identity : rotation3d.toMatrix3x3(config.rotation)
  const s =
    typeof config.scale === 'number'
      ? vector3.make(config.scale, config.scale, config.scale)
      : (config.scale ?? vector3.make(1, 1, 1))
  const h = config.shear ?? {}
  // L = R * H * D: scale first, then shear, then rotate.
  const hd = matrix3x3.make(
    s.x,
    (h.xy ?? 0) * s.y,
    (h.xz ?? 0) * s.z,
    (h.yx ?? 0) * s.x,
    s.y,
    (h.yz ?? 0) * s.z,
    (h.zx ?? 0) * s.x,
    (h.zy ?? 0) * s.y,
    s.z,
  )
  return fromLinear(matrix3x3.multiply(r, hd), t.x, t.y, t.z)
}

/** @internal */
export const decompose = (a: Affine3d): Solution.AtMostOne<Decomposition> => {
  const m = a.matrix
  const l = linearOf(m)
  if (!matrix3x3.isInvertible(l)) {
    return Solution.none
  }
  // Modified Gram–Schmidt on the columns: L = Q * U with Q orthonormal and
  // U upper triangular. U's diagonal is the scale, and its off-diagonal
  // entries divided by the scale of their column are the shear, since
  // U = H * D with H unit upper triangular.
  let q0x = m.m00
  let q0y = m.m10
  let q0z = m.m20
  let sx = Math.hypot(q0x, q0y, q0z)
  q0x /= sx
  q0y /= sx
  q0z /= sx

  let c1x = m.m01
  let c1y = m.m11
  let c1z = m.m21
  let a01 = q0x * c1x + q0y * c1y + q0z * c1z
  c1x -= a01 * q0x
  c1y -= a01 * q0y
  c1z -= a01 * q0z
  const sy = Math.hypot(c1x, c1y, c1z)
  const q1x = c1x / sy
  const q1y = c1y / sy
  const q1z = c1z / sy

  let c2x = m.m02
  let c2y = m.m12
  let c2z = m.m22
  let a02 = q0x * c2x + q0y * c2y + q0z * c2z
  c2x -= a02 * q0x
  c2y -= a02 * q0y
  c2z -= a02 * q0z
  const a12 = q1x * c2x + q1y * c2y + q1z * c2z
  c2x -= a12 * q1x
  c2y -= a12 * q1y
  c2z -= a12 * q1z
  const sz = Math.hypot(c2x, c2y, c2z)
  const q2x = c2x / sz
  const q2y = c2y / sz
  const q2z = c2z / sz

  // A reflection leaves Q with determinant -1, which no rotation has. Moving
  // the sign onto the x scale flips Q's first column and U's first row.
  if (matrix3x3.determinant(l) < 0) {
    q0x = -q0x
    q0y = -q0y
    q0z = -q0z
    sx = -sx
    a01 = -a01
    a02 = -a02
  }

  const rotation = rotation3d.fromOrthonormal(
    matrix3x3.make(q0x, q1x, q2x, q0y, q1y, q2y, q0z, q1z, q2z),
  )
  return Solution.one({
    translation: vector3.make(m.m03, m.m13, m.m23),
    rotation,
    scale: vector3.make(sx, sy, sz),
    shear: { xy: a01 / sy, xz: a02 / sz, yz: a12 / sz, yx: 0, zx: 0, zy: 0 },
  })
}
