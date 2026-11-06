import * as matrix2x2 from '../../matrix/internal/matrix2x2.ts'
import type { Matrix2x2 } from '../../matrix/matrix2x2.ts'
import * as matrix3x3 from '../../matrix/internal/matrix3x3.ts'
import type { Matrix3x3 } from '../../matrix/matrix3x3.ts'
import { coincident, EPSILON, RELATIVE_TOLERANCE } from '../../number.ts'
import * as Solution from '../../solution/solution.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import * as vector2 from '../../vector/internal/vector2.ts'
import type { Vector2 } from '../../vector/vector2.ts'
import type { Affine2d } from '../affine2d.ts'
import type { Invertible } from './traits.ts'
import { AffineTraits } from './traits.ts'

const Affine2dTypeId = '~curvy/Affine2d'

class Affine2dImpl extends Value(Affine2dTypeId) implements Affine2d<unknown> {
  declare readonly [AffineTraits]: unknown
  readonly matrix: Matrix3x3

  constructor(matrix: Matrix3x3) {
    super()
    this.matrix = matrix
  }

  toString() {
    const m = this.matrix
    return `Affine2d([${m.m00}, ${m.m01}, ${m.m02}], [${m.m10}, ${m.m11}, ${m.m12}])`
  }
}

const affineMatrix = (
  m00: number,
  m01: number,
  m02: number,
  m10: number,
  m11: number,
  m12: number,
): Matrix3x3 => matrix3x3.make(m00, m01, m02, m10, m11, m12, 0, 0, 1)

/** @internal */
export const isAffine2d = (a: unknown): a is Affine2d =>
  typeof a === 'object' && a !== null && Affine2dTypeId in a

/** @internal */
export const fromMatrix = (matrix: Matrix3x3): Affine2d => {
  // The last row of an affine matrix is structural — anything else is a
  // projective transform, which doesn't preserve the polynomial form of a
  // curve's control points. The zero checks widen with the magnitude of the
  // matrix's other entries: a transform with large terms carries
  // proportionally large rounding noise in every computed slot, so "zero"
  // there means "zero at this matrix's scale".
  const scale = Math.max(
    Math.abs(matrix.m00),
    Math.abs(matrix.m01),
    Math.abs(matrix.m02),
    Math.abs(matrix.m10),
    Math.abs(matrix.m11),
    Math.abs(matrix.m12),
  )
  const zeroTolerance = EPSILON + RELATIVE_TOLERANCE * scale
  invariant(
    coincident(matrix.m20, 0, zeroTolerance) &&
      coincident(matrix.m21, 0, zeroTolerance) &&
      coincident(matrix.m22, 1),
    'Affine2d requires the third row of its matrix to be [0, 0, 1]',
  )
  return new Affine2dImpl(matrix)
}

/** @internal */
export const identity: Affine2d = new Affine2dImpl(matrix3x3.identity)

// Each constructor that takes per-axis numbers also takes them as one vector,
// and the ones with a fixed point take it as an optional last argument that
// defaults to the origin. Argument types tell the call shapes apart.

/** @internal */
export const translate = (tx: number | Vector2, ty?: number): Affine2d => {
  const x = typeof tx === 'number' ? tx : tx.x
  const y = typeof tx === 'number' ? ty! : tx.y
  return new Affine2dImpl(matrix3x3.make(1, 0, x, 0, 1, y, 0, 0, 1))
}

/** @internal */
export const scale = (sx: number | Vector2, sy?: number | Vector2, origin?: Vector2): Affine2d => {
  let x: number
  let y: number
  let o: Vector2 | undefined
  if (typeof sx !== 'number') {
    x = sx.x
    y = sx.y
    o = sy as Vector2 | undefined
  } else if (typeof sy === 'number') {
    x = sx
    y = sy
    o = origin
  } else {
    x = sx
    y = sx
    o = sy
  }
  if (o === undefined) {
    return new Affine2dImpl(affineMatrix(x, 0, 0, 0, y, 0))
  }
  // T(o) * S(x, y) * T(-o), expanded so the third row stays exact.
  return new Affine2dImpl(affineMatrix(x, 0, o.x * (1 - x), 0, y, o.y * (1 - y)))
}

/** @internal */
export const rotate = (theta: number, origin?: Vector2): Affine2d => {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  if (origin === undefined) {
    return new Affine2dImpl(affineMatrix(c, -s, 0, s, c, 0))
  }
  // T(o) * R(theta) * T(-o), expanded.
  return new Affine2dImpl(
    affineMatrix(
      c,
      -s,
      origin.x - origin.x * c + origin.y * s,
      s,
      c,
      origin.y - origin.x * s - origin.y * c,
    ),
  )
}

/** @internal */
export const reflectX: Affine2d = new Affine2dImpl(affineMatrix(1, 0, 0, 0, -1, 0))

/** @internal */
export const reflectY: Affine2d = new Affine2dImpl(affineMatrix(-1, 0, 0, 0, 1, 0))

/** @internal */
export const reflectAcrossLine = (direction: Vector2, origin?: Vector2): Affine2d => {
  const mag = vector2.magnitude(direction)
  invariant(mag > 0, 'reflectAcrossLine requires a non-zero direction vector')
  const dx = direction.x / mag
  const dy = direction.y / mag

  // Householder-style reflection across the line through `origin` with unit
  // direction (dx, dy):
  //   M = [dx^2 - dy^2,   2 dx dy  ]
  //       [ 2 dx dy,   dy^2 - dx^2 ]
  // Then translate so the line passes through `origin` instead of the origin.
  const a = dx * dx - dy * dy
  const b = 2 * dx * dy
  const negA = -a // dy^2 - dx^2

  if (origin === undefined) {
    return new Affine2dImpl(affineMatrix(a, b, 0, b, negA, 0))
  }
  return new Affine2dImpl(
    affineMatrix(
      a,
      b,
      origin.x - a * origin.x - b * origin.y,
      b,
      negA,
      origin.y - b * origin.x - negA * origin.y,
    ),
  )
}

/** @internal */
export const shear = (kx: number, ky: number, origin?: Vector2): Affine2d =>
  // About o: x' = x + kx * (y - o.y) and y' = y + ky * (x - o.x).
  origin === undefined
    ? new Affine2dImpl(affineMatrix(1, kx, 0, ky, 1, 0))
    : new Affine2dImpl(affineMatrix(1, kx, -kx * origin.y, ky, 1, -ky * origin.x))

/** @internal */
export const andThen = dual<
  (b: Affine2d) => (a: Affine2d) => Affine2d,
  (a: Affine2d, b: Affine2d) => Affine2d
>(
  2,
  // `andThen(a, b)` (or `a.pipe(andThen(b))`) means "apply `a` first, then
  // `b`". For column-vector points that is `b * a`.
  (a: Affine2d, b: Affine2d) => new Affine2dImpl(matrix3x3.multiply(b.matrix, a.matrix)),
)

// Invertibility and the inverse depend only on the linear part. Translation
// never makes an affine map singular, so it stays out of the Hadamard bound:
// folding the translation column into the row norms would call a small scale
// far from the origin singular.
const linearDeterminant = (m: Matrix3x3): number => m.m00 * m.m11 - m.m01 * m.m10

const linearSingular = (m: Matrix3x3, det: number): boolean =>
  Math.abs(det) <= RELATIVE_TOLERANCE * Math.hypot(m.m00, m.m01) * Math.hypot(m.m10, m.m11)

// [L | t]^-1 = [L^-1 | -L^-1 * t]
const buildInverse = (m: Matrix3x3, det: number): Affine2d => {
  const i00 = m.m11 / det
  const i01 = -m.m01 / det
  const i10 = -m.m10 / det
  const i11 = m.m00 / det
  return new Affine2dImpl(
    affineMatrix(i00, i01, -(i00 * m.m02 + i01 * m.m12), i10, i11, -(i10 * m.m02 + i11 * m.m12)),
  )
}

/** @internal */
export const isInvertible = <T>(a: Affine2d<T>): a is Affine2d<T & Invertible> =>
  !linearSingular(a.matrix, linearDeterminant(a.matrix))

/** @internal */
export const asInvertible = <T>(a: Affine2d<T>): Affine2d<T & Invertible> => {
  invariant(isInvertible(a), 'affine2d is not invertible')
  return a
}

// On `Invertible`-branded transforms the empty branch is provably unreachable,
// but TS can't see that — the cast at the public overload pairs the type-level
// promise with the runtime brand check.
/** @internal */
export const inverse = <T>(a: Affine2d<T>): Solution.AtMostOne<Affine2d<T>> => {
  const det = linearDeterminant(a.matrix)
  if (linearSingular(a.matrix, det)) {
    return Solution.none
  }
  return Solution.one(buildInverse(a.matrix, det) as Affine2d<T>)
}

/** @internal */
export const inverseUnsafe = (a: Affine2d): Affine2d => {
  const det = linearDeterminant(a.matrix)
  invariant(!linearSingular(a.matrix, det), 'cannot invert singular affine2d')
  return buildInverse(a.matrix, det)
}

/** @internal */
export const apply = dual<
  (p: Vector2) => (a: Affine2d) => Vector2,
  (a: Affine2d, p: Vector2) => Vector2
>(2, (a: Affine2d, p: Vector2) => {
  const m = a.matrix
  return vector2.make(m.m00 * p.x + m.m01 * p.y + m.m02, m.m10 * p.x + m.m11 * p.y + m.m12)
})

/** @internal */
export const applyTo =
  (a: Affine2d) =>
  (p: Vector2): Vector2 =>
    apply(a, p)

/** @internal */
export const applyDirection = dual<
  (d: Vector2) => (a: Affine2d) => Vector2,
  (a: Affine2d, d: Vector2) => Vector2
>(2, (a: Affine2d, d: Vector2) => {
  const m = a.matrix
  return vector2.make(m.m00 * d.x + m.m01 * d.y, m.m10 * d.x + m.m11 * d.y)
})

/** @internal */
export const applyNormal = dual<
  (n: Vector2) => (a: Affine2d) => Vector2,
  (a: Affine2d, n: Vector2) => Vector2
>(2, (a: Affine2d, n: Vector2) => {
  // A normal maps by the inverse transpose of the linear part, which keeps
  // it perpendicular to the mapped edge. The inverse transpose of
  // [a b; c d] is [d -c; -b a] / det. Dividing by det keeps the side
  // a reflection would otherwise flip; normalizing removes the scale.
  const m = a.matrix
  const det = linearDeterminant(m)
  invariant(!linearSingular(m, det), 'applyNormal requires an invertible transform')
  const x = (m.m11 * n.x - m.m10 * n.y) / det
  const y = (-m.m01 * n.x + m.m00 * n.y) / det
  const length = Math.hypot(x, y)
  return vector2.make(x / length, y / length)
})

/** @internal */
export const linear = (a: Affine2d): Matrix2x2 => {
  const m = a.matrix
  return matrix2x2.make(m.m00, m.m01, m.m10, m.m11)
}

/** @internal */
export const translation = (a: Affine2d): Vector2 => vector2.make(a.matrix.m02, a.matrix.m12)

/** @internal */
export const linearPart = (a: Affine2d): Affine2d => {
  const m = a.matrix
  return new Affine2dImpl(affineMatrix(m.m00, m.m01, 0, m.m10, m.m11, 0))
}

/** @internal */
export const equals = dual<
  (b: Affine2d) => (a: Affine2d) => boolean,
  (a: Affine2d, b: Affine2d) => boolean
>(2, (a: Affine2d, b: Affine2d) => matrix3x3.equals(a.matrix, b.matrix))
