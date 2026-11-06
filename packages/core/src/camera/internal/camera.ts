import type { Bounds2d } from '../../interval/interval2d.ts'
import * as matrix4x4 from '../../matrix/internal/matrix4x4.ts'
import { before, coincident, EPSILON } from '../../number.ts'
import * as Solution from '../../solution/solution.ts'
import type { Affine3d } from '../../transform/affine3d.ts'
import type { Frame3d } from '../../transform/frame3d.ts'
import * as affine3d from '../../transform/internal/affine3d.ts'
import * as frame3d from '../../transform/internal/frame3d.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import * as vector2 from '../../vector/internal/vector2.ts'
import * as vector3 from '../../vector/internal/vector3.ts'
import type { Vector3 } from '../../vector/vector3.ts'
import type {
  Camera,
  Orthographic,
  OrthographicConfig,
  Perspective,
  PerspectiveConfig,
  ProjectedPoint,
} from '../camera.ts'

const CameraTypeId = '~curvy/Camera'

const CameraBase = Value(CameraTypeId)

const show = (v: Vector3) => `(${v.x}, ${v.y}, ${v.z})`
const showViewport = (b: Bounds2d) => `[${b.x.start}, ${b.x.end}] x [${b.y.start}, ${b.y.end}]`

class PerspectiveImpl extends CameraBase implements Perspective {
  readonly kind = 'perspective' as const
  readonly eye: Vector3
  readonly frame: Frame3d
  readonly fovY: number
  readonly near: number
  readonly viewport: Bounds2d

  constructor(eye: Vector3, frame: Frame3d, fovY: number, near: number, viewport: Bounds2d) {
    super()
    this.eye = eye
    this.frame = frame
    this.fovY = fovY
    this.near = near
    this.viewport = viewport
  }

  toString() {
    return `Camera.Perspective(eye ${show(this.eye)}, forward ${show(this.frame.forward)}, fovY ${this.fovY}, near ${this.near}, viewport ${showViewport(this.viewport)})`
  }
}

class OrthographicImpl extends CameraBase implements Orthographic {
  readonly kind = 'orthographic' as const
  readonly eye: Vector3
  readonly frame: Frame3d
  readonly height: number
  readonly viewport: Bounds2d

  constructor(eye: Vector3, frame: Frame3d, height: number, viewport: Bounds2d) {
    super()
    this.eye = eye
    this.frame = frame
    this.height = height
    this.viewport = viewport
  }

  toString() {
    return `Camera.Orthographic(eye ${show(this.eye)}, forward ${show(this.frame.forward)}, height ${this.height}, viewport ${showViewport(this.viewport)})`
  }
}

/** @internal */
export const isCamera = (c: unknown): c is Camera =>
  typeof c === 'object' && c !== null && CameraTypeId in c

/** @internal */
export const isPerspective = (c: unknown): c is Perspective =>
  isCamera(c) && c.kind === 'perspective'

/** @internal */
export const isOrthographic = (c: unknown): c is Orthographic =>
  isCamera(c) && c.kind === 'orthographic'

const UNIT_Y = vector3.make(0, 1, 0)

// The camera's directions: forward toward the target, up as close to the
// hint as a direction perpendicular to forward can be, right from the two.
const aim = (label: string, eye: Vector3, target: Vector3, up: Vector3 = UNIT_Y): Frame3d => {
  invariant(
    [eye.x, eye.y, eye.z, target.x, target.y, target.z].every(Number.isFinite),
    `${label} requires a finite eye and target`,
  )
  const view = vector3.make(target.x - eye.x, target.y - eye.y, target.z - eye.z)
  const distance = vector3.magnitude(view)
  invariant(distance > 0, `${label} requires a target distinct from the eye`)
  const forward = vector3.make(view.x / distance, view.y / distance, view.z / distance)
  const hint = vector3.magnitude(up)
  invariant(Number.isFinite(hint) && hint > 0, `${label} requires a non-zero finite up`)
  const crossed = vector3.cross(forward, up)
  const length = vector3.magnitude(crossed)
  // Unit-scale directions: the absolute band of PRECISION.md regime 1.
  invariant(length / hint > EPSILON, `${label} requires an up that isn't parallel to the view`)
  const right = vector3.make(crossed.x / length, crossed.y / length, crossed.z / length)
  return frame3d.make({ up: vector3.cross(right, forward), forward })
}

const checkViewport = (label: string, v: Bounds2d): void => {
  invariant(
    [v.x.start, v.x.end, v.y.start, v.y.end].every(Number.isFinite),
    `${label} requires a finite viewport`,
  )
  invariant(
    v.x.start !== v.x.end && v.y.start !== v.y.end,
    `${label} requires a viewport with non-zero width and height`,
  )
}

/** @internal */
export const perspective = (config: PerspectiveConfig): Perspective => {
  const { fovY, near, viewport } = config
  invariant(
    Number.isFinite(fovY) && fovY > 0 && fovY < Math.PI,
    'perspective requires fovY strictly between 0 and pi',
  )
  invariant(Number.isFinite(near) && near > 0, 'perspective requires a positive finite near')
  checkViewport('perspective', viewport)
  return new PerspectiveImpl(
    config.eye,
    aim('perspective', config.eye, config.target, config.up),
    fovY,
    near,
    viewport,
  )
}

/** @internal */
export const orthographic = (config: OrthographicConfig): Orthographic => {
  const { height, viewport } = config
  invariant(Number.isFinite(height) && height > 0, 'orthographic requires a positive finite height')
  checkViewport('orthographic', viewport)
  return new OrthographicImpl(
    config.eye,
    aim('orthographic', config.eye, config.target, config.up),
    height,
    viewport,
  )
}

/** @internal */
export const view = (c: Camera): Affine3d => {
  // World to eye space: right is +x, up is +y, and the camera looks down
  // -z. The rows of the rotation are the camera's directions, with forward
  // negated, and the translation moves the eye to the origin.
  const { right: r, up: u, forward: f } = c.frame
  const e = c.eye
  return affine3d.fromMatrix(
    matrix4x4.make(
      r.x,
      r.y,
      r.z,
      -vector3.dot(r, e),
      u.x,
      u.y,
      u.z,
      -vector3.dot(u, e),
      -f.x,
      -f.y,
      -f.z,
      vector3.dot(f, e),
      0,
      0,
      0,
      1,
    ),
  )
}

// Pixels per world unit at depth 1 (perspective) or at any depth
// (orthographic), and the viewport center the view axis lands on.
const screen = (c: Camera) => {
  const v = c.viewport
  const height = Math.abs(v.y.end - v.y.start)
  const scale = c.kind === 'perspective' ? height / 2 / Math.tan(c.fovY / 2) : height / c.height
  return { scale, cx: (v.x.start + v.x.end) / 2, cy: (v.y.start + v.y.end) / 2 }
}

const projectWith = (
  c: Camera,
  s: { readonly scale: number; readonly cx: number; readonly cy: number },
  p: Vector3,
): Solution.AtMostOne<ProjectedPoint> => {
  const dx = p.x - c.eye.x
  const dy = p.y - c.eye.y
  const dz = p.z - c.eye.z
  const { right: r, up: u, forward: f } = c.frame
  const x = dx * r.x + dy * r.y + dz * r.z
  const y = dx * u.x + dy * u.y + dz * u.z
  const depth = dx * f.x + dy * f.y + dz * f.z
  if (c.kind === 'perspective') {
    // A point on the near plane, as clipping leaves it, can land a rounding
    // step short of it, so the cut is tolerant (PRECISION.md regime 2).
    if (before(depth, c.near)) {
      return Solution.none
    }
    const k = s.scale / depth
    return Solution.one({ point: vector2.make(s.cx + x * k, s.cy - y * k), depth })
  }
  return Solution.one({
    point: vector2.make(s.cx + x * s.scale, s.cy - y * s.scale),
    depth,
  })
}

/** @internal */
export const project = dual<
  (p: Vector3) => (c: Camera) => Solution.AtMostOne<ProjectedPoint>,
  (c: Camera, p: Vector3) => Solution.AtMostOne<ProjectedPoint>
>(2, (c: Camera, p: Vector3) => projectWith(c, screen(c), p))

/** @internal */
export const projectTo = (c: Camera): ((p: Vector3) => Solution.AtMostOne<ProjectedPoint>) => {
  const s = screen(c)
  return (p) => projectWith(c, s, p)
}

/** @internal */
export const equals = dual<
  (b: Camera) => (a: Camera) => boolean,
  (a: Camera, b: Camera) => boolean
>(2, (a: Camera, b: Camera): boolean => {
  if (
    a.kind !== b.kind ||
    !vector3.equals(a.eye, b.eye) ||
    !frame3d.equals(a.frame, b.frame) ||
    !coincident(a.viewport.x.start, b.viewport.x.start) ||
    !coincident(a.viewport.x.end, b.viewport.x.end) ||
    !coincident(a.viewport.y.start, b.viewport.y.start) ||
    !coincident(a.viewport.y.end, b.viewport.y.end)
  ) {
    return false
  }
  if (a.kind === 'perspective') {
    const p = b as Perspective
    return coincident(a.fovY, p.fovY) && coincident(a.near, p.near)
  }
  return coincident(a.height, (b as Orthographic).height)
})
