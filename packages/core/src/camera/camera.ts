import type { Bounds2d } from '../interval/interval2d.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine3d } from '../transform/affine3d.ts'
import type { Frame3d } from '../transform/frame3d.ts'
import type { Value } from '../utils/value.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Vector3 } from '../vector/vector3.ts'
import * as internal from './internal/camera.ts'

/**
 * A camera that projects 3D points onto a 2D viewport in SVG coordinates,
 * either `Camera.Perspective` or `Camera.Orthographic`.
 *
 * A camera combines three things:
 *
 * - where the eye is and which way it looks, as `eye` and `frame`
 * - a lens, which sets how much of the scene fits in view
 * - a viewport, the screen rectangle the view fills, with y pointing down
 *
 * `project` sends a point through all three. The view's `up` lands toward
 * the top of the viewport and its `right` toward the right, so a scene
 * modeled with y up appears upright in an SVG viewport.
 *
 * @since 2.0.0
 */
export type Camera = Perspective | Orthographic

/**
 * A camera with a perspective lens, where distant things look smaller.
 *
 * @since 2.0.0
 */
export interface Perspective extends Value.Instance {
  readonly '~curvy/Camera': '~curvy/Camera'
  /** Discriminates the `Camera` union. */
  readonly kind: 'perspective'
  /** The position of the eye. */
  readonly eye: Vector3
  /**
   * The camera's directions. `forward` points from the eye toward the
   * target, `up` is the screen's up, and `right` is the screen's right.
   */
  readonly frame: Frame3d
  /** The vertical field of view, in radians: the angle from the viewport's top edge to its bottom edge. */
  readonly fovY: number
  /**
   * The distance from the eye to the near plane, in world units. `project`
   * returns `none` for points closer than this.
   */
  readonly near: number
  /**
   * The distance from the eye to the far plane, in world units, or
   * `Infinity` when the camera has none. `project` returns `none` for
   * points farther than this.
   */
  readonly far: number
  /** The screen rectangle the view fills, in SVG user units. */
  readonly viewport: Bounds2d
}

/**
 * A camera with an orthographic lens, where size doesn't change with
 * distance.
 *
 * @since 2.0.0
 */
export interface Orthographic extends Value.Instance {
  readonly '~curvy/Camera': '~curvy/Camera'
  /** Discriminates the `Camera` union. */
  readonly kind: 'orthographic'
  /** The position of the eye. */
  readonly eye: Vector3
  /**
   * The camera's directions. `forward` points from the eye toward the
   * target, `up` is the screen's up, and `right` is the screen's right.
   */
  readonly frame: Frame3d
  /** How many world units fit between the viewport's top and bottom edges. */
  readonly height: number
  /**
   * The distance from the eye to the far plane, in world units, or
   * `Infinity` when the camera has none. `project` returns `none` for
   * points farther than this.
   */
  readonly far: number
  /** The screen rectangle the view fills, in SVG user units. */
  readonly viewport: Bounds2d
}

/**
 * The settings `Camera.perspective` takes.
 *
 * @since 2.0.0
 */
export interface PerspectiveConfig {
  /** The position of the eye. */
  readonly eye: Vector3
  /** A point the camera looks at. It must differ from `eye`. */
  readonly target: Vector3
  /**
   * The direction that should appear as up on screen. The camera uses the
   * direction perpendicular to the view that is nearest this one. Must not
   * be parallel to the view. Defaults to `+y`.
   */
  readonly up?: Vector3
  /**
   * The vertical field of view, in radians, strictly between `0` and
   * `pi`. The horizontal field follows from the viewport's aspect ratio.
   */
  readonly fovY: number
  /**
   * The distance from the eye to the near plane, in world units. Must be
   * positive. Points closer than this don't project.
   */
  readonly near: number
  /**
   * The distance from the eye to the far plane, in world units. Must be
   * greater than `near`. Points farther than this don't project. Defaults
   * to `Infinity`, which keeps every point beyond `near`.
   */
  readonly far?: number
  /**
   * The screen rectangle the view fills, in SVG user units with y pointing
   * down. An `Interval2d` works, as does `{ x: { start, end }, y: { start, end } }`.
   */
  readonly viewport: Bounds2d
}

/**
 * The settings `Camera.orthographic` takes.
 *
 * @since 2.0.0
 */
export interface OrthographicConfig {
  /** The position of the eye. */
  readonly eye: Vector3
  /** A point the camera looks at. It must differ from `eye`. */
  readonly target: Vector3
  /**
   * The direction that should appear as up on screen. The camera uses the
   * direction perpendicular to the view that is nearest this one. Must not
   * be parallel to the view. Defaults to `+y`.
   */
  readonly up?: Vector3
  /**
   * How many world units fit between the viewport's top and bottom edges.
   * Must be positive. The visible width follows from the viewport's aspect
   * ratio.
   */
  readonly height: number
  /**
   * The distance from the eye to the far plane, in world units, measured
   * along the view. Must be positive. Points farther than this don't
   * project. Defaults to `Infinity`, which keeps every point.
   */
  readonly far?: number
  /**
   * The screen rectangle the view fills, in SVG user units with y pointing
   * down. An `Interval2d` works, as does `{ x: { start, end }, y: { start, end } }`.
   */
  readonly viewport: Bounds2d
}

/**
 * A point after projection, as `project` returns it.
 *
 * @since 2.0.0
 */
export interface ProjectedPoint {
  /** The position in the viewport, in SVG user units. */
  readonly point: Vector2
  /**
   * How far in front of the eye the original point lies, in world units,
   * measured along the view direction. Larger is farther away, so sorting
   * by descending depth paints back to front.
   */
  readonly depth: number
}

/**
 * Checks if a value is a `Camera` of either kind.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `Camera`, `false` otherwise.
 * @since 2.0.0
 */
export const isCamera: (c: unknown) => c is Camera = internal.isCamera

/**
 * Checks if a value is a perspective `Camera`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `Camera.Perspective`, `false` otherwise.
 * @since 2.0.0
 */
export const isPerspective: (c: unknown) => c is Perspective = internal.isPerspective

/**
 * Checks if a value is an orthographic `Camera`.
 *
 * @param c - The value to check.
 * @returns `true` if the value is a `Camera.Orthographic`, `false` otherwise.
 * @since 2.0.0
 */
export const isOrthographic: (c: unknown) => c is Orthographic = internal.isOrthographic

/**
 * Creates a perspective camera at `eye`, looking at `target`.
 *
 * @param config - The eye, target, optional up, field of view, near
 *   distance, optional far distance, and viewport.
 * @returns The camera.
 * @throws `Error` when the target equals the eye, `up` is zero or
 *   parallel to the view, `fovY` is not strictly between `0` and `pi`,
 *   `near` is not positive, `far` is not greater than `near`, or the
 *   viewport has zero width or height. Any non-finite input except
 *   an infinite `far` also throws.
 * @example
 * ```ts
 * const camera = Camera.perspective({
 *   eye: Vector3.make(0, 0, 10),
 *   target: Vector3.zero,
 *   fovY: Math.PI / 4,
 *   near: 0.1,
 *   viewport: Interval2d.fromCorners(Vector2.zero, Vector2.make(800, 600)),
 * })
 *
 * Camera.project(camera, Vector3.zero) // Solution.one({ point: Vector2(400, 300), depth: 10 })
 * ```
 * @since 2.0.0
 */
export const perspective: (config: PerspectiveConfig) => Perspective = internal.perspective

/**
 * Creates an orthographic camera at `eye`, looking at `target`.
 *
 * Only the view direction matters for where points land. The eye's
 * distance from the scene changes nothing but `depth`.
 *
 * @param config - The eye, target, optional up, visible height,
 *   optional far distance, and viewport.
 * @returns The camera.
 * @throws `Error` when the target equals the eye, `up` is zero or
 *   parallel to the view, `height` or `far` is not positive, or the
 *   viewport has zero width or height. Any non-finite input except
 *   an infinite `far` also throws.
 * @since 2.0.0
 */
export const orthographic: (config: OrthographicConfig) => Orthographic = internal.orthographic

/**
 * The transform from world coordinates to the camera's eye space.
 *
 * Eye space puts the eye at the origin with `right` along `+x` and `up`
 * along `+y`, looking down `-z`. That is the OpenGL convention, and it keeps
 * the transform a rotation plus a translation. A point's `depth` is the
 * negative of its eye-space z.
 *
 * @param c - The camera.
 * @returns The rigid transform taking world points to eye space.
 * @since 2.0.0
 */
export const view: (c: Camera) => Affine3d = internal.view

export const project: {
  /**
   * Projects a point onto the camera's viewport.
   *
   * A perspective camera divides by depth, so the result is undefined for
   * points at or behind the eye. It returns `none` for any point closer
   * than the near plane or farther than the far plane. A point on either
   * plane, to within rounding, still projects, so polygons clipped against
   * those planes project whole.
   *
   * An orthographic camera projects every point up to its far plane,
   * including ones behind the eye, which come back with a negative `depth`.
   *
   * @param c - The camera.
   * @param p - The point, in world coordinates.
   * @returns The viewport position and depth, or `none` for a point
   *   beyond the far plane or in front of a perspective camera's near
   *   plane.
   * @example
   * ```ts
   * // A point one unit above the target lands above the viewport center.
   * Camera.project(camera, Vector3.make(0, 1, 0))
   * // Solution.one({ point: Vector2(400, 227.57...), depth: 10 })
   * ```
   * @since 2.0.0
   */
  (c: Camera, p: Vector3): Solution.AtMostOne<ProjectedPoint>
  /**
   * Projects a point onto the piped-in camera's viewport.
   *
   * @param p - The point, in world coordinates.
   * @returns A function that takes a camera and returns the viewport
   *   position and depth, or `none`.
   * @since 2.0.0
   */
  (p: Vector3): (c: Camera) => Solution.AtMostOne<ProjectedPoint>
} = internal.project

/**
 * Curried point-first form of `project`: fixes the camera and returns a
 * function over points, the shape `Array.prototype.map` wants. It computes
 * the camera's screen mapping once, so it suits projecting many points.
 *
 * @param c - The camera.
 * @returns A function that takes a world point and returns its viewport
 *   position and depth, or `none`.
 * @example
 * ```ts
 * const projected = vertices.map(Camera.projectTo(camera))
 * ```
 * @since 2.0.0
 */
export const projectTo: (c: Camera) => (p: Vector3) => Solution.AtMostOne<ProjectedPoint> =
  internal.projectTo

export const equals: {
  /**
   * Checks whether two cameras have the same kind, pose, lens, and
   * viewport, comparing each number with `coincident` from `curvy/number`.
   *
   * @param a - The first camera.
   * @param b - The second camera.
   * @returns `true` when every setting matches.
   * @since 2.0.0
   */
  (a: Camera, b: Camera): boolean
  /**
   * Checks whether two cameras have the same kind, pose, lens, and
   * viewport.
   *
   * @param b - The camera to compare against.
   * @returns A function that takes a camera and returns whether it equals `b`.
   * @since 2.0.0
   */
  (b: Camera): (a: Camera) => boolean
} = internal.equals
