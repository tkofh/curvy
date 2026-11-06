import type { Matrix3x3 } from '../matrix/matrix3x3.ts'
import type { Quaternion, Unit } from '../quaternion/quaternion.ts'
import type * as Solution from '../solution/solution.ts'
import type { Value } from '../utils/value.ts'
import type { Vector3 } from '../vector/vector3.ts'
import * as internal from './internal/rotation3d.ts'

/**
 * A rotation in 3D about an axis through the origin, stored as a unit
 * quaternion.
 *
 * Every operation that reads a rotation also accepts a `Quaternion<Unit>`
 * in its place, and every operation that builds one returns a
 * `Rotation3d`.
 *
 * Positive angles follow the right-hand rule. A rotation about `+z` turns
 * `+x` toward `+y`, the same sense as `Affine2d.rotate` in the plane.
 * `CONVENTIONS.md` at the repo root sets out the full set of conventions.
 *
 * @since 2.0.0
 */
export interface Rotation3d extends Value.Instance {
  readonly '~curvy/Rotation3d': '~curvy/Rotation3d'
  /**
   * The unit quaternion representing the rotation. `q` and `-q` represent
   * the same rotation, and this is whichever one the constructing
   * operation produced.
   */
  readonly quaternion: Quaternion<Unit>
}

/**
 * A rotation as an axis and an angle, as `toAxisAngle` returns it.
 *
 * @since 2.0.0
 */
export interface AxisAngle {
  /** The unit axis of rotation. */
  readonly axis: Vector3
  /**
   * The angle in radians, in `[0, pi]`, turning by the right-hand rule
   * about `axis`.
   */
  readonly angle: number
}

/**
 * A rotation split into a twist about a chosen axis and a swing that
 * moves that axis, as `swingTwist` returns them. The original rotation is
 * the twist followed by the swing.
 *
 * @since 2.0.0
 */
export interface SwingTwist {
  /** The rotation applied second. Its axis is perpendicular to the chosen axis. */
  readonly swing: Rotation3d
  /** The rotation applied first, about the chosen axis. */
  readonly twist: Rotation3d
}

/**
 * The order in which `fromEuler` and `toEuler` combine three rotations
 * about the coordinate axes.
 *
 * The letters name the factors of a matrix product from left to right, so
 * `'YXZ'` is `Ry * Rx * Rz`. Read with moving axes, that rotates about Y,
 * then about the rotated X, then about the twice-rotated Z. Read with
 * fixed axes, it applies Z first, then X, then Y. three.js uses the same
 * convention.
 *
 * @since 2.0.0
 */
export type EulerOrder = 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX'

/**
 * Checks if a value is a `Rotation3d`.
 *
 * A `Quaternion<Unit>` is not a `Rotation3d`, even though every
 * `Rotation3d` operation accepts one.
 *
 * @param r - The value to check.
 * @returns `true` if the value is a `Rotation3d`, `false` otherwise.
 * @since 2.0.0
 */
export const isRotation3d: (r: unknown) => r is Rotation3d = internal.isRotation3d

/**
 * The rotation that leaves every vector where it is.
 *
 * @since 2.0.0
 */
export const identity: Rotation3d = internal.identity

/**
 * Wraps a unit quaternion as a `Rotation3d`.
 *
 * Operations accept the quaternion directly, so wrapping is only needed
 * where a value must be a `Rotation3d`, such as a field typed that way.
 *
 * @param q - The unit quaternion. `Quaternion.normalize` or
 *   `Quaternion.asUnit` produces one from any quaternion.
 * @returns A rotation whose `quaternion` is `q` itself.
 * @since 2.0.0
 */
export const fromQuaternion: (q: Quaternion<Unit>) => Rotation3d = internal.fromQuaternion

/**
 * A rotation by an angle about an axis through the origin.
 *
 * @param axis - The axis of rotation. Any non-zero length works, since only
 *   its direction is used.
 * @param angle - The angle in radians. Positive angles turn by the
 *   right-hand rule: with the thumb along `axis`, the fingers curl the
 *   positive way.
 * @returns The rotation.
 * @throws `Error` when `axis` is zero or not finite, or `angle` is not
 *   finite.
 * @example
 * ```ts
 * const quarter = Rotation3d.fromAxisAngle(Vector3.unitZ, Math.PI / 2)
 *
 * Rotation3d.apply(quarter, Vector3.unitX) // Vector3(0, 1, 0), up to rounding
 * ```
 * @since 2.0.0
 */
export const fromAxisAngle: (axis: Vector3, angle: number) => Rotation3d = internal.fromAxisAngle

/**
 * A rotation about the `+x` axis, turning `+y` toward `+z` for a positive
 * angle.
 *
 * @param angle - The angle in radians.
 * @returns The rotation.
 * @since 2.0.0
 */
export const aboutX: (angle: number) => Rotation3d = internal.aboutX

/**
 * A rotation about the `+y` axis, turning `+z` toward `+x` for a positive
 * angle.
 *
 * @param angle - The angle in radians.
 * @returns The rotation.
 * @since 2.0.0
 */
export const aboutY: (angle: number) => Rotation3d = internal.aboutY

/**
 * A rotation about the `+z` axis, turning `+x` toward `+y` for a positive
 * angle.
 *
 * @param angle - The angle in radians.
 * @returns The rotation.
 * @since 2.0.0
 */
export const aboutZ: (angle: number) => Rotation3d = internal.aboutZ

/**
 * The smallest rotation that turns one direction into another.
 *
 * The rotation's axis is perpendicular to both directions. For opposite
 * directions every such axis gives a half turn, and the result is a half
 * turn about one of them, chosen deterministically.
 *
 * @param from - The starting direction. Any non-zero length works.
 * @param to - The target direction. Any non-zero length works.
 * @returns The rotation taking the direction of `from` to the direction of
 *   `to`.
 * @throws `Error` when either vector is zero or not finite.
 * @example
 * ```ts
 * const r = Rotation3d.between(Vector3.unitX, Vector3.make(0, 3, 0))
 *
 * Rotation3d.toAxisAngle(r) // { axis: Vector3(0, 0, 1), angle: pi / 2 }
 * ```
 * @since 2.0.0
 */
export const between: (from: Vector3, to: Vector3) => Rotation3d = internal.between

/**
 * A rotation from three angles about the coordinate axes.
 *
 * Each component of `angles` is the angle about the axis it names, and
 * `order` sets how the three combine. Angles are in radians and turn by
 * the right-hand rule.
 *
 * @param angles - The angles about X, Y, and Z, as the `x`, `y`, and `z`
 *   components.
 * @param order - The order of the product of the three axis rotations.
 *   `'YXZ'` is `Ry * Rx * Rz`. Defaults to `'XYZ'`.
 * @returns The rotation.
 * @throws `Error` when `order` is not one of the six `EulerOrder` values.
 * @example
 * ```ts
 * // Turn about Y, then tilt about the turned X.
 * const r = Rotation3d.fromEuler(Vector3.make(Math.PI / 6, Math.PI / 4, 0), 'YXZ')
 *
 * // The same rotation, composed by hand: Rx applies first.
 * Rotation3d.equals(
 *   r,
 *   Rotation3d.andThen(Rotation3d.aboutX(Math.PI / 6), Rotation3d.aboutY(Math.PI / 4)),
 * ) // true
 * ```
 * @since 2.0.0
 */
export const fromEuler: (angles: Vector3, order?: EulerOrder) => Rotation3d = internal.fromEuler

/**
 * The angles about the coordinate axes that `fromEuler` would combine, in
 * the given order, into this rotation.
 *
 * The middle angle of the order lies in `[-pi/2, pi/2]`, and the outer two
 * in `[-pi, pi]`. At the middle angle's extremes, the first and third axes
 * line up and only their combined turn is determined. That is gimbal
 * lock. There the third angle is `0` and the first carries the whole
 * turn. `fromEuler(toEuler(r, order), order)` reproduces `r` everywhere,
 * to within about `1e-8` near gimbal lock and to rounding elsewhere.
 *
 * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
 * @param order - The order of the product, as in `fromEuler`. Defaults to
 *   `'XYZ'`.
 * @returns The angles about X, Y, and Z, as the `x`, `y`, and `z`
 *   components.
 * @throws `Error` when `order` is not one of the six `EulerOrder` values.
 * @since 2.0.0
 */
export const toEuler: (r: Rotation3d | Quaternion<Unit>, order?: EulerOrder) => Vector3 =
  internal.toEuler

/**
 * Converts a rotation matrix to a rotation.
 *
 * The matrix must have orthonormal columns and determinant `+1`, with each
 * column's length and each pair's dot product within `EPSILON` of a
 * rotation's. Scaling, shear, and reflection all fail that test.
 *
 * @param m - The matrix, acting on column vectors.
 * @returns The rotation, or `none` when `m` is not a rotation matrix.
 * @since 2.0.0
 */
export const fromMatrix3x3: (m: Matrix3x3) => Solution.AtMostOne<Rotation3d> =
  internal.fromMatrix3x3

/**
 * The 3x3 matrix of a rotation, acting on column vectors, so that
 * `Matrix3x3.vectorProductLeft(toMatrix3x3(r), v)` equals `apply(r, v)`.
 *
 * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
 * @returns The rotation matrix.
 * @since 2.0.0
 */
export const toMatrix3x3: (r: Rotation3d | Quaternion<Unit>) => Matrix3x3 = internal.toMatrix3x3

/**
 * The axis and angle of a rotation.
 *
 * The angle is in `[0, pi]`, so a rotation by `-pi/2` about an axis comes
 * back as `pi/2` about the opposite axis. The identity has no axis. It
 * comes back as an angle of `0` about `+x`.
 *
 * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
 * @returns The unit axis and the angle in radians.
 * @since 2.0.0
 */
export const toAxisAngle: (r: Rotation3d | Quaternion<Unit>) => AxisAngle = internal.toAxisAngle

export const andThen: {
  /**
   * Sequences two rotations: `andThen(a, b)` applies `a` first, then `b`.
   *
   * Both rotations turn about the fixed axes of the space they act in. To
   * turn about axes that `a` has already moved, swap the arguments.
   *
   * @param a - The rotation applied first, as a `Rotation3d` or a
   *   `Quaternion<Unit>`.
   * @param b - The rotation applied second, in either form.
   * @returns The combined rotation.
   * @example
   * ```ts
   * const r = Rotation3d.andThen(Rotation3d.aboutZ(Math.PI / 2), Rotation3d.aboutX(Math.PI / 2))
   *
   * // +x turns to +y about Z, then +y turns to +z about X.
   * Rotation3d.apply(r, Vector3.unitX) // Vector3(0, 0, 1), up to rounding
   * ```
   * @since 2.0.0
   */
  (a: Rotation3d | Quaternion<Unit>, b: Rotation3d | Quaternion<Unit>): Rotation3d
  /**
   * Sequences two rotations. `andThen(b)(a)` applies `a`, then `b`.
   *
   * @param b - The rotation applied after the piped-in rotation.
   * @returns A function that takes the rotation to apply first and returns the
   *   combined rotation.
   * @since 2.0.0
   */
  (b: Rotation3d | Quaternion<Unit>): (a: Rotation3d | Quaternion<Unit>) => Rotation3d
} = internal.andThen

/**
 * The rotation that undoes this one: the same axis, turned the other way.
 *
 * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
 * @returns The inverse rotation.
 * @since 2.0.0
 */
export const inverse: (r: Rotation3d | Quaternion<Unit>) => Rotation3d = internal.inverse

export const apply: {
  /**
   * Rotates a vector.
   *
   * Points and directions rotate the same way, since a rotation about the
   * origin has no translation to treat differently.
   *
   * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
   * @param v - The vector to rotate.
   * @returns The rotated vector, with the same length as `v`.
   * @since 2.0.0
   */
  (r: Rotation3d | Quaternion<Unit>, v: Vector3): Vector3
  /**
   * Rotates a vector by the piped-in rotation.
   *
   * @param v - The vector to rotate.
   * @returns A function that takes a rotation and returns `v` rotated by it.
   * @since 2.0.0
   */
  (v: Vector3): (r: Rotation3d | Quaternion<Unit>) => Vector3
} = internal.apply

/**
 * Curried point-first form of `apply`: fixes the rotation and returns a
 * function over vectors, the shape `Array.prototype.map` wants.
 *
 * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
 * @returns A function that takes a vector and returns it rotated by `r`.
 * @example
 * ```ts
 * const turn = Rotation3d.aboutY(Math.PI / 3)
 *
 * const rotated = vertices.map(Rotation3d.applyTo(turn))
 * ```
 * @since 2.0.0
 */
export const applyTo: (r: Rotation3d | Quaternion<Unit>) => (v: Vector3) => Vector3 =
  internal.applyTo

export const equals: {
  /**
   * Checks whether two rotations turn every vector the same way.
   *
   * `q` and `-q` represent the same rotation, so this compares the
   * quaternions up to sign, each component with `coincident` from
   * `curvy/number`.
   *
   * @param a - The first rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
   * @param b - The second rotation, in either form.
   * @returns `true` when the rotations are the same.
   * @since 2.0.0
   */
  (a: Rotation3d | Quaternion<Unit>, b: Rotation3d | Quaternion<Unit>): boolean
  /**
   * Checks whether two rotations turn every vector the same way.
   *
   * @param b - The rotation to compare against.
   * @returns A function that takes a rotation and returns whether it equals `b`.
   * @since 2.0.0
   */
  (b: Rotation3d | Quaternion<Unit>): (a: Rotation3d | Quaternion<Unit>) => boolean
} = internal.equals

export const angleBetween: {
  /**
   * The angle of the smallest rotation that takes `a` to `b`.
   *
   * @param a - The first rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
   * @param b - The second rotation, in either form.
   * @returns The angle in radians, in `[0, pi]`.
   * @since 2.0.0
   */
  (a: Rotation3d | Quaternion<Unit>, b: Rotation3d | Quaternion<Unit>): number
  /**
   * The angle of the smallest rotation between two rotations.
   *
   * @param b - The second rotation.
   * @returns A function that takes a rotation and returns its angle to `b`.
   * @since 2.0.0
   */
  (b: Rotation3d | Quaternion<Unit>): (a: Rotation3d | Quaternion<Unit>) => number
} = internal.angleBetween

export const slerp: {
  /**
   * Interpolates between two rotations along the shortest path, at a
   * constant angular speed.
   *
   * `t = 0` gives `a` and `t = 1` gives `b`. Values outside `[0, 1]`
   * continue along the same great arc past either end. Between `a` and
   * `b`, the result turns by `t * angleBetween(a, b)` from `a`.
   *
   * @param a - The rotation at `t = 0`, as a `Rotation3d` or a
   *   `Quaternion<Unit>`.
   * @param b - The rotation at `t = 1`, in either form.
   * @param t - The interpolation parameter.
   * @returns The interpolated rotation.
   * @example
   * ```ts
   * const halfway = Rotation3d.slerp(Rotation3d.identity, Rotation3d.aboutZ(Math.PI / 2), 0.5)
   *
   * Rotation3d.equals(halfway, Rotation3d.aboutZ(Math.PI / 4)) // true
   * ```
   * @since 2.0.0
   */
  (a: Rotation3d | Quaternion<Unit>, b: Rotation3d | Quaternion<Unit>, t: number): Rotation3d
  /**
   * Interpolates from the piped-in rotation toward `b` along the shortest
   * path.
   *
   * @param b - The rotation at `t = 1`.
   * @param t - The interpolation parameter.
   * @returns A function that takes the rotation at `t = 0` and returns the
   *   interpolated rotation.
   * @since 2.0.0
   */
  (b: Rotation3d | Quaternion<Unit>, t: number): (a: Rotation3d | Quaternion<Unit>) => Rotation3d
} = internal.slerp

export const nlerp: {
  /**
   * Interpolates between two rotations by blending their quaternions and
   * normalizing the blend.
   *
   * The path matches `slerp`'s, and so do the endpoints, but the angular
   * speed is not constant. It runs fastest at `t = 0.5`, and the
   * difference grows with the angle between `a` and `b`. Use it where the
   * speed doesn't matter, such as per-frame smoothing toward a target.
   *
   * @param a - The rotation at `t = 0`, as a `Rotation3d` or a
   *   `Quaternion<Unit>`.
   * @param b - The rotation at `t = 1`, in either form.
   * @param t - The interpolation parameter, in `[0, 1]`. Outside that range
   *   the result stays on the path but no longer moves at a predictable
   *   rate.
   * @returns The interpolated rotation.
   * @since 2.0.0
   */
  (a: Rotation3d | Quaternion<Unit>, b: Rotation3d | Quaternion<Unit>, t: number): Rotation3d
  /**
   * Interpolates from the piped-in rotation toward `b` by normalized
   * blending.
   *
   * @param b - The rotation at `t = 1`.
   * @param t - The interpolation parameter, in `[0, 1]`.
   * @returns A function that takes the rotation at `t = 0` and returns the
   *   interpolated rotation.
   * @since 2.0.0
   */
  (b: Rotation3d | Quaternion<Unit>, t: number): (a: Rotation3d | Quaternion<Unit>) => Rotation3d
} = internal.nlerp

export const swingTwist: {
  /**
   * Splits a rotation into a twist about an axis and a swing that moves
   * the axis.
   *
   * The twist turns about `axis`. The swing turns about an axis
   * perpendicular to `axis`. Applying the twist, then the swing, gives back
   * `r`. The swing alone carries `axis` to the same place `r` does, so it
   * is the part of `r` that changes where the axis points.
   *
   * A half turn about an axis perpendicular to `axis` has no twist part.
   * There the twist is the identity and the swing is all of `r`.
   *
   * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
   * @param axis - The twist axis. Any non-zero length works.
   * @returns The `swing` and `twist` rotations.
   * @throws `Error` when `axis` is zero or not finite.
   * @example
   * ```ts
   * // An eye that tilts up and spins about its own view axis (+z).
   * const spin = Rotation3d.aboutZ(0.3)
   * const tilt = Rotation3d.aboutX(-0.2)
   * const { swing, twist } = Rotation3d.swingTwist(Rotation3d.andThen(spin, tilt), Vector3.unitZ)
   *
   * Rotation3d.equals(twist, spin) // true
   * Rotation3d.equals(swing, tilt) // true
   * ```
   * @since 2.0.0
   */
  (r: Rotation3d | Quaternion<Unit>, axis: Vector3): SwingTwist
  /**
   * Splits the piped-in rotation into a twist about `axis` and a swing.
   *
   * @param axis - The twist axis. Any non-zero length works.
   * @returns A function that takes a rotation and returns its `swing` and
   *   `twist`.
   * @throws `Error` when `axis` is zero or not finite.
   * @since 2.0.0
   */
  (axis: Vector3): (r: Rotation3d | Quaternion<Unit>) => SwingTwist
} = internal.swingTwist
