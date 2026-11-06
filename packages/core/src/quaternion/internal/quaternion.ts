import { EPSILON, coincident } from '../../number.ts'
import * as Solution from '../../solution/solution.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import type { Quaternion } from '../quaternion.ts'
import type { Unit } from './traits.ts'
import { QuaternionTraits } from './traits.ts'

const QuaternionTypeId = '~curvy/Quaternion'

class QuaternionImpl extends Value(QuaternionTypeId) implements Quaternion<unknown> {
  declare readonly [QuaternionTraits]: unknown
  readonly x: number
  readonly y: number
  readonly z: number
  readonly w: number

  constructor(x: number, y: number, z: number, w: number) {
    super()
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  toString() {
    return `Quaternion(${this.x}, ${this.y}, ${this.z}, ${this.w})`
  }
}

/** @internal */
export const isQuaternion = (q: unknown): q is Quaternion =>
  typeof q === 'object' && q !== null && QuaternionTypeId in q

/** @internal */
export const make = (x: number, y: number, z: number, w: number): Quaternion =>
  new QuaternionImpl(x, y, z, w)

// For results that are unit by construction. Rounding leaves them within an
// ulp or two of length 1, well inside the `Unit` band.
/** @internal */
export const makeUnit = (x: number, y: number, z: number, w: number): Quaternion<Unit> =>
  new QuaternionImpl(x, y, z, w) as Quaternion<Unit>

/** @internal */
export const identity: Quaternion<Unit> = makeUnit(0, 0, 0, 1)

/** @internal */
export const equals = dual<
  (b: Quaternion) => (a: Quaternion) => boolean,
  (a: Quaternion, b: Quaternion) => boolean
>(
  2,
  (a: Quaternion, b: Quaternion): boolean =>
    coincident(a.x, b.x) && coincident(a.y, b.y) && coincident(a.z, b.z) && coincident(a.w, b.w),
)

/** @internal */
export const dot = dual<
  (b: Quaternion) => (a: Quaternion) => number,
  (a: Quaternion, b: Quaternion) => number
>(2, (a: Quaternion, b: Quaternion): number => a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w)

/** @internal */
export const magnitude = (q: Quaternion): number => Math.hypot(q.x, q.y, q.z, q.w)

/** @internal */
export const conjugate = <T>(q: Quaternion<T>): Quaternion<T> =>
  new QuaternionImpl(-q.x, -q.y, -q.z, q.w) as Quaternion<T>

// The Hamilton product a * b, on raw components.
/** @internal */
export const product = (
  ax: number,
  ay: number,
  az: number,
  aw: number,
  bx: number,
  by: number,
  bz: number,
  bw: number,
): Quaternion =>
  new QuaternionImpl(
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  )

// The product of two unit quaternions is unit, up to rounding, so the brand
// carries through. The public overloads say so in the types.
/** @internal */
export const multiply = dual<
  (b: Quaternion) => (a: Quaternion) => Quaternion,
  (a: Quaternion, b: Quaternion) => Quaternion
>(2, (a: Quaternion, b: Quaternion): Quaternion => product(a.x, a.y, a.z, a.w, b.x, b.y, b.z, b.w))

/** @internal */
export const isUnit = <T>(q: Quaternion<T>): q is Quaternion<T & Unit> =>
  // A unit quaternion's length lives on a fixed scale, so the band is the
  // absolute one of a normalized domain (PRECISION.md regime 1).
  Math.abs(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w - 1) <= EPSILON

/** @internal */
export const asUnit = <T>(q: Quaternion<T>): Quaternion<T & Unit> => {
  invariant(isUnit(q), 'quaternion is not unit length')
  return q
}

/** @internal */
export const normalize = (q: Quaternion): Solution.AtMostOne<Quaternion<Unit>> => {
  const m = magnitude(q)
  if (m === 0 || !Number.isFinite(m)) {
    return Solution.none
  }
  return Solution.one(makeUnit(q.x / m, q.y / m, q.z / m, q.w / m))
}

/** @internal */
export const inverse = <T>(q: Quaternion<T>): Solution.AtMostOne<Quaternion<T>> => {
  const n = q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w
  if (n === 0 || !Number.isFinite(n)) {
    return Solution.none
  }
  return Solution.one(new QuaternionImpl(-q.x / n, -q.y / n, -q.z / n, q.w / n) as Quaternion<T>)
}
