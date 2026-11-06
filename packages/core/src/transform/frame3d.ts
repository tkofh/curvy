import type { Quaternion, Unit } from '../quaternion/quaternion.ts'
import type { Value } from '../utils/value.ts'
import type { Vector3 } from '../vector/vector3.ts'
import * as internal from './internal/frame3d.ts'
import type { Rotation3d } from './rotation3d.ts'

/**
 * A choice of which directions count as up, forward, and right for an
 * object or a space. Operations that speak in those terms take one, such as
 * yaw, pitch, and roll, or turning to look at something.
 *
 * curvy gives the coordinate axes no meaning of their own, so a frame is
 * where that meaning comes from. A character modeled facing `+z` and a
 * camera looking down `-z` each get a frame, and the same angles then mean
 * the same motions for both.
 *
 * `right` follows from the other two as `cross(forward, up)`. It is the
 * right-hand side of someone standing along `up` and facing `forward`.
 *
 * @since 2.0.0
 */
export interface Frame3d extends Value.Instance {
  readonly '~curvy/Frame3d': '~curvy/Frame3d'
  /** The unit direction to the frame's right: `cross(forward, up)`. */
  readonly right: Vector3
  /** The unit direction the frame calls up. */
  readonly up: Vector3
  /** The unit direction the frame faces. */
  readonly forward: Vector3
}

/**
 * The directions that define a `Frame3d`, as `make` takes them.
 *
 * @since 2.0.0
 */
export interface Frame3dConfig {
  /** The direction the frame calls up. Any non-zero length works. */
  readonly up: Vector3
  /**
   * The direction the frame faces. Any non-zero length works, but it must
   * be perpendicular to `up`.
   */
  readonly forward: Vector3
}

/**
 * Three angles describing an orientation relative to a `Frame3d`, as
 * `fromYawPitchRoll` takes them and `toYawPitchRoll` returns them. Each
 * turns one of the frame's directions toward another.
 *
 * @since 2.0.0
 */
export interface YawPitchRoll {
  /**
   * The turn about `up`, in radians. Positive turns `forward` toward
   * `right`.
   */
  readonly yaw: number
  /**
   * The turn about the yawed `right`, in radians. Positive turns `forward`
   * toward `up`.
   */
  readonly pitch: number
  /**
   * The turn about the yawed and pitched `forward`, in radians. Positive
   * turns `up` toward `right`.
   */
  readonly roll: number
}

/**
 * Checks if a value is a `Frame3d`.
 *
 * @param f - The value to check.
 * @returns `true` if the value is a `Frame3d`, `false` otherwise.
 * @since 2.0.0
 */
export const isFrame3d: (f: unknown) => f is Frame3d = internal.isFrame3d

/**
 * Creates a `Frame3d` from its up and forward directions.
 *
 * @param config - The `up` and `forward` directions. Both are normalized,
 *   and they must be perpendicular.
 * @returns The frame, with `right` set to `cross(forward, up)`.
 * @throws `Error` when either direction is zero or not finite, or the two
 *   are not perpendicular. After normalizing, their dot product must be
 *   within `EPSILON` of zero.
 * @example
 * ```ts
 * // A character modeled facing the viewer, along +z, with +y up.
 * const body = Frame3d.make({ up: Vector3.unitY, forward: Vector3.unitZ })
 *
 * body.right // Vector3(-1, 0, 0): its own right is the viewer's left
 * ```
 * @since 2.0.0
 */
export const make: (config: Frame3dConfig) => Frame3d = internal.make

export const equals: {
  /**
   * Checks whether two frames have the same up and forward directions,
   * comparing each with `Vector3.equals`.
   *
   * @param a - The first frame.
   * @param b - The second frame.
   * @returns `true` when both directions match.
   * @since 2.0.0
   */
  (a: Frame3d, b: Frame3d): boolean
  /**
   * Checks whether two frames have the same up and forward directions.
   *
   * @param b - The frame to compare against.
   * @returns A function that takes a frame and returns whether it equals `b`.
   * @since 2.0.0
   */
  (b: Frame3d): (a: Frame3d) => boolean
} = internal.equals

export const fromYawPitchRoll: {
  /**
   * The rotation that yaws, then pitches, then rolls an object whose
   * directions are given by a frame.
   *
   * Each turn is about the object's own axes as the previous turns left
   * them. The yaw turns `forward` toward `right` about `up`. The pitch
   * then tilts the new forward toward the new up, about the new right. The
   * roll then turns about where forward ends up. These are the aircraft
   * conventions: nose right, nose up, right wing down.
   *
   * @param f - The frame naming the object's directions at rest.
   * @param angles - The yaw, pitch, and roll in radians. A missing angle
   *   is `0`.
   * @returns The rotation, in the coordinates the frame is written in.
   * @example
   * ```ts
   * const body = Frame3d.make({ up: Vector3.unitY, forward: Vector3.unitZ })
   * const turned = Frame3d.fromYawPitchRoll(body, { yaw: Math.PI / 2 })
   *
   * // Facing its own right now.
   * Rotation3d.apply(turned, body.forward) // Vector3(-1, 0, 0), up to rounding
   * ```
   * @since 2.0.0
   */
  (f: Frame3d, angles: Partial<YawPitchRoll>): Rotation3d
  /**
   * The rotation that yaws, then pitches, then rolls an object whose
   * directions are given by the piped-in frame.
   *
   * @param angles - The yaw, pitch, and roll in radians. A missing angle
   *   is `0`.
   * @returns A function that takes a frame and returns the rotation.
   * @since 2.0.0
   */
  (angles: Partial<YawPitchRoll>): (f: Frame3d) => Rotation3d
} = internal.fromYawPitchRoll

export const toYawPitchRoll: {
  /**
   * The yaw, pitch, and roll that `fromYawPitchRoll` would turn into a
   * rotation, relative to a frame.
   *
   * The pitch lies in `[-pi/2, pi/2]`, and the yaw and roll in
   * `[-pi, pi]`. Pitching straight up or down lines the roll axis up with
   * the yaw axis, and only their combined turn is determined. There the
   * roll is `0` and the yaw carries the whole turn.
   *
   * @param f - The frame naming the object's directions at rest.
   * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
   * @returns The angles in radians.
   * @since 2.0.0
   */
  (f: Frame3d, r: Rotation3d | Quaternion<Unit>): YawPitchRoll
  /**
   * The yaw, pitch, and roll of a rotation, relative to the piped-in frame.
   *
   * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`.
   * @returns A function that takes a frame and returns the angles.
   * @since 2.0.0
   */
  (r: Rotation3d | Quaternion<Unit>): (f: Frame3d) => YawPitchRoll
} = internal.toYawPitchRoll

/**
 * The rotation that turns a frame's `forward` to face a direction, keeping
 * its `up` as close to an up hint as it can.
 *
 * The result sends `forward` exactly to `direction`. It sends `up` to the
 * direction perpendicular to `direction` that is nearest the hint, so
 * looking around never rolls the object.
 *
 * Looking straight along the hint leaves the roll undetermined. There the
 * result is the smallest rotation from `forward` to `direction`, as
 * `Rotation3d.between` computes it.
 *
 * @param f - The frame naming the object's directions at rest.
 * @param direction - The direction to face. Any non-zero length works.
 * @param up - The up hint. Any non-zero length works. Defaults to the
 *   frame's own `up`.
 * @returns The rotation.
 * @throws `Error` when `direction` or `up` is zero or not finite.
 * @example
 * ```ts
 * const camera = Frame3d.make({ up: Vector3.unitY, forward: Vector3.make(0, 0, -1) })
 * const r = Frame3d.lookRotation(camera, Vector3.make(1, 0, 0))
 *
 * Rotation3d.apply(r, camera.forward) // Vector3(1, 0, 0), up to rounding
 * Rotation3d.apply(r, camera.up) // Vector3(0, 1, 0): no roll
 * ```
 * @since 2.0.0
 */
export const lookRotation: (f: Frame3d, direction: Vector3, up?: Vector3) => Rotation3d =
  internal.lookRotation
