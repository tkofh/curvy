import type * as Solution from '../solution/solution.ts'
import type { Affine3d } from '../transform/affine3d.ts'
import type { Value } from '../utils/value.ts'
import type { Vector3 } from '../vector/vector3.ts'
import * as internal from './internal/plane3d.ts'

/**
 * A plane in 3D: the points `p` where `Vector3.dot(normal, p) = offset`.
 *
 * The normal is a unit vector, so `offset` is the plane's signed distance
 * from the origin along it. The normal also picks a side. The **front** is
 * the side it points toward, where `signedDistance` is positive, and the
 * back is the other. `Polygon3d.clip` keeps the front.
 *
 * @since 2.0.0
 */
export interface Plane3d extends Value.Instance {
  readonly '~curvy/Plane3d': '~curvy/Plane3d'
  /** The unit normal, pointing toward the plane's front side. */
  readonly normal: Vector3
  /** The plane's signed distance from the origin, measured along `normal`. */
  readonly offset: number
}

/**
 * Checks if a value is a `Plane3d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `Plane3d`, `false` otherwise.
 * @since 2.0.0
 */
export const isPlane3d: (p: unknown) => p is Plane3d = internal.isPlane3d

/**
 * Creates the plane of points `p` where `Vector3.dot(normal, p) = offset`.
 *
 * The normal needn't be a unit vector. The plane stores it normalized,
 * with the offset divided by the same length, so the same points satisfy
 * the equation.
 *
 * @param normal - The plane's normal, pointing toward its front side. Its
 *   length scales `offset`.
 * @param offset - The right-hand side of the plane's equation.
 * @returns The plane.
 * @throws `Error` when `normal` is zero or not finite, or `offset` is not
 *   finite.
 * @example
 * ```ts
 * Plane3d.make(Vector3.make(0, 2, 0), 6) // Plane3d(normal (0, 1, 0), offset 3): the plane y = 3
 * ```
 * @since 2.0.0
 */
export const make: (normal: Vector3, offset: number) => Plane3d = internal.make

/**
 * Creates the plane through a point, perpendicular to a normal.
 *
 * @param point - Any point on the plane.
 * @param normal - The plane's normal, pointing toward its front side. Its
 *   length doesn't matter.
 * @returns The plane.
 * @throws `Error` when `normal` is zero or not finite, or `point` is not
 *   finite.
 * @since 2.0.0
 */
export const fromPointNormal: (point: Vector3, normal: Vector3) => Plane3d =
  internal.fromPointNormal

/**
 * Creates the plane through three points.
 *
 * The normal is `cross(b - a, c - a)`, normalized. The points run
 * counterclockwise seen from the front, in the usual right-handed picture.
 *
 * @param a - The first point.
 * @param b - The second point.
 * @param c - The third point.
 * @returns The plane, or `none` when the points are collinear at working
 *   precision. See `PRECISION.md`.
 * @throws `Error` when a point is not finite.
 * @example
 * ```ts
 * Plane3d.through(Vector3.zero, Vector3.unitX, Vector3.unitY)
 * // Solution.one(Plane3d(normal (0, 0, 1), offset 0))
 * ```
 * @since 2.0.0
 */
export const through: (a: Vector3, b: Vector3, c: Vector3) => Solution.AtMostOne<Plane3d> =
  internal.through

export const equals: {
  /**
   * Checks whether two planes have the same normal and offset, comparing
   * each number with `coincident` from `curvy/number`.
   *
   * A plane and its `flip` hold the same points but face opposite ways, so
   * they are not equal.
   *
   * @param a - The first plane.
   * @param b - The second plane.
   * @returns `true` when the normals and offsets match.
   * @since 2.0.0
   */
  (a: Plane3d, b: Plane3d): boolean
  /**
   * Checks whether two planes have the same normal and offset.
   *
   * @param b - The plane to compare against.
   * @returns A function that takes a plane and returns whether it equals `b`.
   * @since 2.0.0
   */
  (b: Plane3d): (a: Plane3d) => boolean
} = internal.equals

export const signedDistance: {
  /**
   * The distance from a plane to a point, positive on the front side and
   * negative on the back.
   *
   * @param plane - The plane.
   * @param point - The point.
   * @returns `Vector3.dot(plane.normal, point) - plane.offset`.
   * @since 2.0.0
   */
  (plane: Plane3d, point: Vector3): number
  /**
   * The distance from the piped-in plane to a point, positive on its front
   * side.
   *
   * @param point - The point.
   * @returns A function that takes a plane and returns the signed distance.
   * @since 2.0.0
   */
  (point: Vector3): (plane: Plane3d) => number
} = internal.signedDistance

export const closestPoint: {
  /**
   * The point on a plane nearest a given point: its foot along the normal.
   *
   * @param plane - The plane.
   * @param point - The point.
   * @returns The point on `plane` nearest `point`.
   * @since 2.0.0
   */
  (plane: Plane3d, point: Vector3): Vector3
  /**
   * The point on the piped-in plane nearest a given point.
   *
   * @param point - The point.
   * @returns A function that takes a plane and returns the point on it
   *   nearest `point`.
   * @since 2.0.0
   */
  (point: Vector3): (plane: Plane3d) => Vector3
} = internal.closestPoint

/**
 * The same plane facing the other way, which swaps its front and back.
 *
 * @param plane - The plane.
 * @returns The plane with its normal and offset negated.
 * @since 2.0.0
 */
export const flip: (plane: Plane3d) => Plane3d = internal.flip

export const shift: {
  /**
   * Moves a plane along its normal.
   *
   * @param plane - The plane.
   * @param distance - How far to move, toward the front for a positive
   *   distance and toward the back for a negative one.
   * @returns The parallel plane at that distance.
   * @throws `Error` when `distance` is not finite.
   * @example
   * ```ts
   * // Pull a solid's face planes in by 0.1 to inset the solid.
   * const inner = faces.map(Plane3d.shift(-0.1))
   * ```
   * @since 2.0.0
   */
  (plane: Plane3d, distance: number): Plane3d
  /**
   * Moves a plane along its normal.
   *
   * @param distance - How far to move, toward the front for a positive
   *   distance.
   * @returns A function that takes a plane and returns the moved plane.
   * @throws `Error` when `distance` is not finite.
   * @since 2.0.0
   */
  (distance: number): (plane: Plane3d) => Plane3d
} = internal.shift

export const transform: {
  /**
   * Applies an `Affine3d` transform to a plane: the result holds the
   * images of the plane's points.
   *
   * The front side maps to the front side, including under a transform
   * that mirrors space, so the normal of a solid's face still points out
   * of the transformed solid.
   *
   * @param plane - The plane.
   * @param a - The transform.
   * @returns The transformed plane.
   * @throws `Error` when the transform is singular, so it flattens space
   *   and has no image plane.
   * @since 2.0.0
   */
  (plane: Plane3d, a: Affine3d): Plane3d
  /**
   * Applies an `Affine3d` transform to a plane.
   *
   * @param a - The transform.
   * @returns A function that takes a plane and returns the transformed
   *   plane.
   * @throws `Error` when the transform is singular.
   * @since 2.0.0
   */
  (a: Affine3d): (plane: Plane3d) => Plane3d
} = internal.transform

/**
 * The single point where three planes meet.
 *
 * Three faces of a solid meet at a corner, so this finds a polyhedron's
 * vertices from its face planes.
 *
 * @param a - The first plane.
 * @param b - The second plane.
 * @param c - The third plane.
 * @returns The common point, or `none` when two of the planes are parallel
 *   or all three share a line. The test compares the determinant of the
 *   unit normals against `EPSILON`, so arrangements that close to either
 *   case also count as meeting nowhere. See `PRECISION.md`.
 * @example
 * ```ts
 * Plane3d.intersection(
 *   Plane3d.make(Vector3.unitX, 1),
 *   Plane3d.make(Vector3.unitY, 2),
 *   Plane3d.make(Vector3.unitZ, 3),
 * ) // Solution.one(Vector3(1, 2, 3))
 * ```
 * @since 2.0.0
 */
export const intersection: (a: Plane3d, b: Plane3d, c: Plane3d) => Solution.AtMostOne<Vector3> =
  internal.intersection

export const intersectRay: {
  /**
   * The point where a ray meets a plane.
   *
   * The ray starts at `origin` and runs along `direction`, never
   * backward. A ray that starts on the plane, within rounding, meets it at
   * `origin`, whichever way it points.
   *
   * @param plane - The plane.
   * @param origin - The ray's starting point.
   * @param direction - The ray's direction. Its length doesn't matter.
   * @returns The meeting point, or `none` when the ray points away from the
   *   plane or runs parallel to it. Parallel means within `EPSILON` of
   *   perpendicular to the normal.
   * @throws `Error` when `direction` is zero or not finite, or `origin` is
   *   not finite.
   * @example
   * ```ts
   * const ground = Plane3d.make(Vector3.unitY, 0)
   *
   * Plane3d.intersectRay(ground, Vector3.make(0, 5, 0), Vector3.make(1, -1, 0))
   * // Solution.one(Vector3(5, 0, 0))
   * ```
   * @since 2.0.0
   */
  (plane: Plane3d, origin: Vector3, direction: Vector3): Solution.AtMostOne<Vector3>
  /**
   * The point where a ray meets the piped-in plane.
   *
   * @param origin - The ray's starting point.
   * @param direction - The ray's direction. Its length doesn't matter.
   * @returns A function that takes a plane and returns the meeting point,
   *   or `none`.
   * @throws `Error` when `direction` is zero or not finite, or `origin` is
   *   not finite.
   * @since 2.0.0
   */
  (origin: Vector3, direction: Vector3): (plane: Plane3d) => Solution.AtMostOne<Vector3>
} = internal.intersectRay
