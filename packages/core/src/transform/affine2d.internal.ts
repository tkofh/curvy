import * as matrix2x2 from '../matrix/matrix2x2.internal.ts'
import type { Matrix2x2 } from '../matrix/matrix2x2.ts'
import * as matrix3x3 from '../matrix/matrix3x3.internal.ts'
import type { Matrix3x3 } from '../matrix/matrix3x3.ts'
import { coincident, EPSILON, RELATIVE_TOLERANCE } from '../number.ts'
import * as Solution from '../solution/solution.ts'
import { dual, invariant, Pipeable } from '../utils.ts'
import * as vector2 from '../vector/vector2.internal.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Affine2d } from './affine2d.ts'
import type { Invertible } from './traits.ts'
import { AffineTraits } from './traits.ts'

export const Affine2dTypeId: unique symbol = Symbol.for('curvy/transform/affine2d')
export type Affine2dTypeId = typeof Affine2dTypeId

class Affine2dImpl extends Pipeable implements Affine2d<unknown> {
  readonly [Affine2dTypeId]: Affine2dTypeId = Affine2dTypeId
  declare readonly [AffineTraits]: unknown
  readonly matrix: Matrix3x3

  constructor(matrix: Matrix3x3) {
    super()
    this.matrix = matrix
  }

  get [Symbol.toStringTag]() {
    const m = this.matrix
    return `Affine2d([${m.m00}, ${m.m01}, ${m.m02}], [${m.m10}, ${m.m11}, ${m.m12}])`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

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
  const zeroBand = { absolute: EPSILON + RELATIVE_TOLERANCE * scale }
  invariant(
    coincident(matrix.m20, 0, zeroBand) &&
      coincident(matrix.m21, 0, zeroBand) &&
      coincident(matrix.m22, 1),
    'Affine2d requires the third row of its matrix to be [0, 0, 1]',
  )
  return new Affine2dImpl(matrix)
}

/** @internal */
export const identity: Affine2d = new Affine2dImpl(matrix3x3.identity)

/** @internal */
export const translate = (tx: number, ty: number): Affine2d =>
  new Affine2dImpl(matrix3x3.make(1, 0, tx, 0, 1, ty, 0, 0, 1))

/** @internal */
export const translateBy = (v: Vector2): Affine2d => translate(v.x, v.y)

/** @internal */
export const scale = (sx: number, sy?: number): Affine2d => {
  const y = sy ?? sx
  return new Affine2dImpl(matrix3x3.make(sx, 0, 0, 0, y, 0, 0, 0, 1))
}

/** @internal */
export const scaleAround = (sx: number, sy: number, origin: Vector2): Affine2d => {
  // T(o) · S(sx, sy) · T(-o), expanded so the third row stays exact.
  return new Affine2dImpl(
    matrix3x3.make(sx, 0, origin.x * (1 - sx), 0, sy, origin.y * (1 - sy), 0, 0, 1),
  )
}

/** @internal */
export const rotate = (theta: number): Affine2d => {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return new Affine2dImpl(matrix3x3.make(c, -s, 0, s, c, 0, 0, 0, 1))
}

/** @internal */
export const rotateAround = (theta: number, origin: Vector2): Affine2d => {
  // T(o) · R(θ) · T(-o), expanded.
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return new Affine2dImpl(
    matrix3x3.make(
      c,
      -s,
      origin.x - origin.x * c + origin.y * s,
      s,
      c,
      origin.y - origin.x * s - origin.y * c,
      0,
      0,
      1,
    ),
  )
}

/** @internal */
export const reflectX: Affine2d = new Affine2dImpl(matrix3x3.make(1, 0, 0, 0, -1, 0, 0, 0, 1))

/** @internal */
export const reflectY: Affine2d = new Affine2dImpl(matrix3x3.make(-1, 0, 0, 0, 1, 0, 0, 0, 1))

/** @internal */
export const reflectAcrossLine = (origin: Vector2, direction: Vector2): Affine2d => {
  const mag = vector2.magnitude(direction)
  invariant(mag > 0, 'reflectAcrossLine requires a non-zero direction vector')
  const dx = direction.x / mag
  const dy = direction.y / mag

  // Householder-style reflection across the line through `origin` with unit
  // direction (dx, dy):
  //   M = [dx² - dy²,   2 dx dy  ]
  //       [ 2 dx dy,   dy² - dx² ]
  // Then translate so the line passes through `origin` instead of the origin.
  const a = dx * dx - dy * dy
  const b = 2 * dx * dy
  const negA = -a // dy² - dx²

  return new Affine2dImpl(
    matrix3x3.make(
      a,
      b,
      origin.x - a * origin.x - b * origin.y,
      b,
      negA,
      origin.y - b * origin.x - negA * origin.y,
      0,
      0,
      1,
    ),
  )
}

/** @internal */
export const shear = (kx: number, ky: number): Affine2d =>
  new Affine2dImpl(matrix3x3.make(1, kx, 0, ky, 1, 0, 0, 0, 1))

/** @internal */
export const andThen = dual<
  (b: Affine2d) => (a: Affine2d) => Affine2d,
  (a: Affine2d, b: Affine2d) => Affine2d
>(
  2,
  // `andThen(a, b)` (or `a.pipe(andThen(b))`) means "apply `a` first, then
  // `b`". For column-vector points that is `b · a`.
  (a: Affine2d, b: Affine2d) => new Affine2dImpl(matrix3x3.multiply(b.matrix, a.matrix)),
)

/** @internal */
export const isInvertible = <T>(a: Affine2d<T>): a is Affine2d<T & Invertible> =>
  matrix3x3.isInvertible(a.matrix)

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
  const inv = matrix3x3.inverse(a.matrix)
  if (Solution.isNone(inv)) {
    return Solution.none
  }
  return Solution.one(new Affine2dImpl(inv.value) as Affine2d<T>)
}

/** @internal */
export const inverseUnsafe = (a: Affine2d): Affine2d =>
  new Affine2dImpl(matrix3x3.inverseUnsafe(a.matrix))

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
export const linear = (a: Affine2d): Matrix2x2 => {
  const m = a.matrix
  return matrix2x2.make(m.m00, m.m01, m.m10, m.m11)
}

/** @internal */
export const translation = (a: Affine2d): Vector2 => vector2.make(a.matrix.m02, a.matrix.m12)

/** @internal */
export const linearPart = (a: Affine2d): Affine2d => {
  const m = a.matrix
  return new Affine2dImpl(matrix3x3.make(m.m00, m.m01, 0, m.m10, m.m11, 0, 0, 0, 1))
}

/** @internal */
export const equals = dual<
  (b: Affine2d) => (a: Affine2d) => boolean,
  (a: Affine2d, b: Affine2d) => boolean
>(2, (a: Affine2d, b: Affine2d) => matrix3x3.equals(a.matrix, b.matrix))
