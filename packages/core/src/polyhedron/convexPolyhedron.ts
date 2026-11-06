import type { Plane3d } from '../plane/plane3d.ts'
import type { Convex, Planar, Polygon3d } from '../polygon/polygon3d.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine3d } from '../transform/affine3d.ts'
import type { Value } from '../utils/value.ts'
import type { Vector3 } from '../vector/vector3.ts'
import * as internal from './internal/convexPolyhedron.ts'

/**
 * A bounded convex solid with flat faces, stored as indexed geometry: a
 * shared list of corner points, and faces that index into it.
 *
 * Build one with `fromHalfSpaces`, which intersects half-spaces given as
 * outward-facing planes. Every face keeps the plane it came from and that
 * plane's label, so a face can be traced back to the half-space that made
 * it.
 *
 * Faces run counterclockwise seen from outside, in the usual right-handed
 * picture, so `Polygon3d.normal` of each face points out of the solid. See
 * `CONVENTIONS.md`.
 *
 * @since 2.0.0
 */
export interface ConvexPolyhedron<out Label = unknown> extends Value.Instance {
  readonly '~curvy/ConvexPolyhedron': '~curvy/ConvexPolyhedron'
  /** The corners, each listed once and shared by the faces that meet there. */
  readonly vertices: ReadonlyArray<Vector3>
  /** The faces, in the order of the half-spaces that made them. */
  readonly faces: ReadonlyArray<Face<Label>>
}

/**
 * One face of a `ConvexPolyhedron`.
 *
 * @since 2.0.0
 */
export interface Face<out Label = unknown> {
  /**
   * The face's corners as indices into the solid's `vertices`,
   * counterclockwise seen from outside. The closing edge runs from the last
   * back to the first.
   */
  readonly indices: ReadonlyArray<number>
  /** The input plane the face lies in, facing out of the solid. */
  readonly plane: Plane3d
  /**
   * The label of the half-space that made the face. When the half-spaces
   * were bare planes, it is that plane's index in the input array.
   */
  readonly label: Label
}

/**
 * A labeled half-space for `fromHalfSpaces`: the points on the back side
 * of `plane`, or on it.
 *
 * @since 2.0.0
 */
export interface HalfSpace<out Label = unknown> {
  /** The bounding plane, facing out of the half-space. */
  readonly plane: Plane3d
  /** Any value. The face this half-space makes carries it. */
  readonly label: Label
}

/**
 * Checks if a value is a `ConvexPolyhedron`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `ConvexPolyhedron`, `false` otherwise.
 * @since 2.0.0
 */
export const isConvexPolyhedron: (p: unknown) => p is ConvexPolyhedron = internal.isConvexPolyhedron

export const fromHalfSpaces: {
  /**
   * Builds the convex solid that lies inside every one of a set of
   * half-spaces.
   *
   * Each half-space is the back side of a plane, the side its normal points
   * away from, so the planes face out of the solid. The solid includes its
   * boundary. A plane that only touches the solid at a corner or along an
   * edge, or misses it, makes no face. A plane repeating an earlier face
   * makes no face either, so the earlier label wins.
   *
   * Every vertex is the meeting point of three input planes, solved
   * directly, so corners land where the planes put them rather than
   * accumulating error from repeated clipping. The search tries every
   * triple of planes, which suits solids with tens of faces.
   *
   * @param halfSpaces - The half-spaces, as outward-facing planes. Each face
   *   is labeled with its plane's index in this array.
   * @returns The solid, or `none` when the half-spaces don't enclose a
   *   bounded region with volume: when they share no point, or only a flat
   *   or lower-dimensional piece, or leave the region open in some
   *   direction. Points count as on a plane within a band that scales with
   *   the coordinates. See `PRECISION.md`.
   * @example
   * ```ts
   * // The unit cube: the back sides of x = 1, x = 0, and so on.
   * const cube = ConvexPolyhedron.fromHalfSpaces([
   *   Plane3d.make(Vector3.unitX, 1),
   *   Plane3d.make(Vector3.make(-1, 0, 0), 0),
   *   Plane3d.make(Vector3.unitY, 1),
   *   Plane3d.make(Vector3.make(0, -1, 0), 0),
   *   Plane3d.make(Vector3.unitZ, 1),
   *   Plane3d.make(Vector3.make(0, 0, -1), 0),
   * ])
   * // Solution.one(ConvexPolyhedron(8 vertices, 6 faces))
   * ```
   * @since 2.0.0
   */
  (halfSpaces: ReadonlyArray<Plane3d>): Solution.AtMostOne<ConvexPolyhedron<number>>
  /**
   * Builds the convex solid that lies inside every one of a set of labeled
   * half-spaces, under the same rules as for bare planes.
   *
   * @param halfSpaces - The half-spaces, each an outward-facing plane and
   *   a label for the face it makes.
   * @returns The solid, with each face carrying its half-space's label, or
   *   `none` when the half-spaces don't enclose a bounded region with
   *   volume.
   * @example
   * ```ts
   * const wedge = ConvexPolyhedron.fromHalfSpaces([
   *   { plane: Plane3d.make(Vector3.make(0, 0, -1), 0), label: 'floor' },
   *   { plane: Plane3d.make(Vector3.make(-1, 0, 0), 0), label: 'back' },
   *   { plane: Plane3d.make(Vector3.make(0, -1, 0), 0), label: 'left' },
   *   { plane: Plane3d.make(Vector3.make(0, 1, 0), 1), label: 'right' },
   *   { plane: Plane3d.make(Vector3.make(1, 0, 1), 1), label: 'roof' },
   * ])
   *
   * if (Solution.isSome(wedge)) {
   *   wedge.value.faces.map((face) => face.label)
   *   // ['floor', 'back', 'left', 'right', 'roof']
   * }
   * ```
   * @since 2.0.0
   */
  <L>(halfSpaces: ReadonlyArray<HalfSpace<L>>): Solution.AtMostOne<ConvexPolyhedron<L>>
} = internal.fromHalfSpaces as never

export const contains: {
  /**
   * Checks whether a point lies in a solid, boundary included.
   *
   * A point within rounding distance of a face's plane counts as on it,
   * with a cutoff that scales with the coordinates. See `PRECISION.md`.
   *
   * @param p - The solid.
   * @param point - The point.
   * @returns `true` when the point is inside the solid or on its surface.
   * @since 2.0.0
   */
  (p: ConvexPolyhedron, point: Vector3): boolean
  /**
   * Checks whether a point lies in the piped-in solid, boundary included.
   *
   * @param point - The point.
   * @returns A function that takes a solid and returns whether it contains
   *   `point`.
   * @since 2.0.0
   */
  (point: Vector3): (p: ConvexPolyhedron) => boolean
} = internal.contains

/**
 * A solid's faces as polygons, in the order of `faces`.
 *
 * Each polygon runs counterclockwise seen from outside, so its normal
 * points out of the solid, and carries the `Convex` and `Planar` brands
 * ready for `Polygon3d.clip` and `Camera.clip`.
 *
 * @param p - The solid.
 * @returns One polygon per face, built from that face's vertices.
 * @since 2.0.0
 */
export const polygons: (p: ConvexPolyhedron) => ReadonlyArray<Polygon3d<Convex & Planar>> =
  internal.polygons

export const transform: {
  /**
   * Applies an `Affine3d` transform to a solid: its vertices move, and each
   * face's plane follows by `Plane3d.transform`.
   *
   * Faces stay counterclockwise from outside, and planes keep facing out,
   * including under a transform that mirrors space. A mirror reverses each
   * face's `indices` to keep that order. Labels carry over unchanged.
   *
   * @param p - The solid.
   * @param a - The transform.
   * @returns The transformed solid.
   * @throws `Error` when the transform is singular, so it flattens the
   *   solid.
   * @example
   * ```ts
   * // A left-hand part from a right-hand one, still wound outward.
   * const left = ConvexPolyhedron.transform(right, Affine3d.scale(-1, 1, 1))
   * ```
   * @since 2.0.0
   */
  <L>(p: ConvexPolyhedron<L>, a: Affine3d): ConvexPolyhedron<L>
  /**
   * Applies an `Affine3d` transform to a solid.
   *
   * @param a - The transform.
   * @returns A function that takes a solid and returns the transformed
   *   solid.
   * @throws `Error` when the transform is singular.
   * @since 2.0.0
   */
  (a: Affine3d): <L>(p: ConvexPolyhedron<L>) => ConvexPolyhedron<L>
} = internal.transform
