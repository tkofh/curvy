import { describe, expect, test } from 'vitest'
import type * as Arc from '../src/arc/arc.ts'
import * as Camera from '../src/camera/camera.ts'
import * as Interval2d from '../src/interval/interval2d.ts'
import * as Plane3d from '../src/plane/plane3d.ts'
import * as Polygon2d from '../src/polygon/polygon2d.ts'
import * as Polygon3d from '../src/polygon/polygon3d.ts'
import * as Solution from '../src/solution/solution.ts'
import * as Affine3d from '../src/transform/affine3d.ts'
import * as Rotation3d from '../src/transform/rotation3d.ts'
import * as Vector2 from '../src/vector/vector2.ts'
import * as Vector3 from '../src/vector/vector3.ts'

const viewport = Interval2d.fromCorners(Vector2.zero, Vector2.make(800, 600))

const camera = Camera.perspective({
  eye: Vector3.make(0, 0, 10),
  target: Vector3.zero,
  fovY: Math.PI / 4,
  near: 0.1,
  viewport,
})

const flat = Camera.orthographic({
  eye: Vector3.make(0, 0, 10),
  target: Vector3.zero,
  height: 6,
  viewport,
})

const projected = (c: Camera.Camera, p: Vector3.Vector3) => {
  const result = Camera.project(c, p)
  if (Solution.isNone(result)) {
    throw new Error('expected a projection')
  }
  return result.value
}

describe('perspective', () => {
  test('perspective example: the target lands at the viewport center', () => {
    const { point, depth } = projected(camera, Vector3.zero)
    expect(point).toBeCloseToValue(Vector2.make(400, 300))
    expect(depth).toBe(10)
  })

  test('project example: up is toward the top of the viewport', () => {
    const { point, depth } = projected(camera, Vector3.make(0, 1, 0))
    const scale = 300 / Math.tan(Math.PI / 8)
    expect(point).toBeCloseToValue(Vector2.make(400, 300 - scale / 10))
    expect(point.y).toBeCloseTo(227.57, 2)
    expect(depth).toBe(10)
  })

  test('right is toward the right of the viewport', () => {
    expect(projected(camera, Vector3.make(1, 0, 0)).point.x).toBeGreaterThan(400)
  })

  test('the field of view spans the viewport height', () => {
    const edge = 10 * Math.tan(Math.PI / 8)
    expect(projected(camera, Vector3.make(0, edge, 0)).point.y).toBeCloseTo(0, 10)
    expect(projected(camera, Vector3.make(0, -edge, 0)).point.y).toBeCloseTo(600, 10)
  })

  test('twice as far is half the offset', () => {
    const near = projected(camera, Vector3.make(1, 0, 0)).point.x - 400
    const far = projected(camera, Vector3.make(2, 0, -10)).point.x - 400
    expect(far).toBeCloseTo(near, 10)
  })

  test('points in front of the near plane do not project; points on it do', () => {
    expect(Camera.project(camera, Vector3.make(0, 0, 10 - 0.05))).toBe(Solution.none)
    expect(Camera.project(camera, Vector3.make(0, 0, 11))).toBe(Solution.none)
    expect(Solution.isSome(Camera.project(camera, Vector3.make(0, 0, 9.9)))).toBe(true)
    // A rounding step short of the plane still counts as on it.
    expect(Solution.isSome(Camera.project(camera, Vector3.make(0, 0, 9.9 + 1e-14)))).toBe(true)
  })

  test('points beyond the far plane do not project; points on it do', () => {
    const bounded = Camera.perspective({
      eye: Vector3.make(0, 0, 10),
      target: Vector3.zero,
      fovY: Math.PI / 4,
      near: 0.1,
      far: 20,
      viewport,
    })
    expect(bounded.far).toBe(20)
    expect(camera.far).toBe(Number.POSITIVE_INFINITY)
    expect(Camera.project(bounded, Vector3.make(0, 0, -10.5))).toBe(Solution.none)
    expect(Solution.isSome(Camera.project(bounded, Vector3.make(0, 0, -10)))).toBe(true)
    // A rounding step past the plane still counts as on it.
    expect(Solution.isSome(Camera.project(bounded, Vector3.make(0, 0, -10 - 1e-14)))).toBe(true)
    expect(Solution.isSome(Camera.project(camera, Vector3.make(0, 0, -1e6)))).toBe(true)
    expect(Camera.equals(camera, bounded)).toBe(false)
    expect(String(bounded)).toContain('near 0.1, far 20, viewport')
    expect(String(camera)).not.toContain('far')
  })

  test('a viewport away from the origin centers there', () => {
    const offset = Camera.perspective({
      eye: Vector3.make(0, 0, 10),
      target: Vector3.zero,
      fovY: Math.PI / 4,
      near: 0.1,
      viewport: { x: { start: 100, end: 300 }, y: { start: 50, end: 250 } },
    })
    expect(projected(offset, Vector3.zero).point).toBeCloseToValue(Vector2.make(200, 150))
  })

  test('up chooses the screen orientation', () => {
    // Looking straight down from above, with -z as the screen's up.
    const top = Camera.perspective({
      eye: Vector3.make(0, 10, 0),
      target: Vector3.zero,
      up: Vector3.make(0, 0, -1),
      fovY: Math.PI / 4,
      near: 0.1,
      viewport,
    })
    expect(projected(top, Vector3.make(0, 0, -1)).point.y).toBeLessThan(300)
    expect(projected(top, Vector3.make(1, 0, 0)).point.x).toBeGreaterThan(400)
  })

  test('invalid settings throw', () => {
    const base = { eye: Vector3.make(0, 0, 10), target: Vector3.zero, fovY: 1, near: 0.1, viewport }
    expect(() => Camera.perspective({ ...base, target: base.eye })).toThrow()
    expect(() => Camera.perspective({ ...base, up: Vector3.make(0, 0, 1) })).toThrow()
    expect(() => Camera.perspective({ ...base, up: Vector3.zero })).toThrow()
    expect(() => Camera.perspective({ ...base, fovY: 0 })).toThrow()
    expect(() => Camera.perspective({ ...base, fovY: Math.PI })).toThrow()
    expect(() => Camera.perspective({ ...base, near: 0 })).toThrow()
    expect(() => Camera.perspective({ ...base, far: 0.1 })).toThrow()
    expect(() => Camera.perspective({ ...base, far: Number.NaN })).toThrow()
    expect(() =>
      Camera.perspective({
        ...base,
        viewport: { x: { start: 0, end: 0 }, y: { start: 0, end: 1 } },
      }),
    ).toThrow()
    expect(() => Camera.perspective({ ...base, eye: Vector3.make(Number.NaN, 0, 0) })).toThrow()
  })
})

describe('orthographic', () => {
  test('height fits the viewport, regardless of distance', () => {
    expect(projected(flat, Vector3.make(0, 3, 0)).point.y).toBeCloseTo(0, 10)
    expect(projected(flat, Vector3.make(0, 3, -50)).point.y).toBeCloseTo(0, 10)
    expect(projected(flat, Vector3.make(4, 0, 0)).point.x).toBeCloseTo(400 + 400, 10)
  })

  test('points behind the eye still project, with negative depth', () => {
    const { depth } = projected(flat, Vector3.make(0, 0, 20))
    expect(depth).toBe(-10)
  })

  test('far cuts off distant points, and behind the eye still projects', () => {
    const bounded = Camera.orthographic({
      eye: Vector3.make(0, 0, 10),
      target: Vector3.zero,
      height: 6,
      far: 15,
      viewport,
    })
    expect(Camera.project(bounded, Vector3.make(0, 0, -6))).toBe(Solution.none)
    expect(Solution.isSome(Camera.project(bounded, Vector3.make(0, 0, -5)))).toBe(true)
    expect(Solution.isSome(Camera.project(bounded, Vector3.make(0, 0, 20)))).toBe(true)
    expect(() =>
      Camera.orthographic({ eye: Vector3.one, target: Vector3.zero, height: 1, far: 0, viewport }),
    ).toThrow()
  })

  test('invalid height throws', () => {
    expect(() =>
      Camera.orthographic({ eye: Vector3.one, target: Vector3.zero, height: 0, viewport }),
    ).toThrow()
  })
})

describe('shared operations', () => {
  test('view maps the eye to the origin and the target down -z', () => {
    for (const c of [camera, flat]) {
      const v = Camera.view(c)
      expect(Vector3.magnitude(Affine3d.apply(v, c.eye))).toBeCloseTo(0, 12)
      const target = Affine3d.apply(v, Vector3.zero)
      expect(target.x).toBeCloseTo(0, 12)
      expect(target.y).toBeCloseTo(0, 12)
      expect(target.z).toBeCloseTo(-10, 12)
    }
  })

  test('view agrees with project for any camera pose', () => {
    const tilted = Camera.perspective({
      eye: Vector3.make(3, 4, 5),
      target: Vector3.make(-1, 0.5, 2),
      up: Vector3.make(0.2, 1, 0),
      fovY: 1,
      near: 0.1,
      viewport,
    })
    const p = Vector3.make(-2, 1, 0)
    const eyeSpace = Affine3d.apply(Camera.view(tilted), p)
    const { depth, point } = projected(tilted, p)
    expect(depth).toBeCloseTo(-eyeSpace.z, 12)
    const scale = 300 / Math.tan(0.5)
    expect(point).toBeCloseToValue(
      Vector2.make(400 + (eyeSpace.x / depth) * scale, 300 - (eyeSpace.y / depth) * scale),
    )
    // The view is rigid.
    expect(Affine3d.isInvertible(Camera.view(tilted))).toBe(true)
  })

  test('projectTo matches project, and project is data-last too', () => {
    const points = [Vector3.zero, Vector3.make(1, 2, 3), Vector3.make(0, 0, 50)]
    expect(points.map(Camera.projectTo(camera))).toEqual(
      points.map((p) => Camera.project(camera, p)),
    )
    expect(camera.pipe(Camera.project(Vector3.zero))).toEqual(Camera.project(camera, Vector3.zero))
  })

  test('a face that turns away from the camera flips its projected winding', () => {
    const square = [
      Vector3.make(-1, -1, 0),
      Vector3.make(1, -1, 0),
      Vector3.make(1, 1, 0),
      Vector3.make(-1, 1, 0),
    ]
    const windingFrom = (vertices: ReadonlyArray<Vector3.Vector3>) =>
      Polygon2d.winding(Polygon2d.fromArray(vertices.map((v) => projected(camera, v).point)))
    const facing = windingFrom(square)
    const away = windingFrom(square.map(Rotation3d.applyTo(Rotation3d.aboutY(Math.PI))))
    expect(Solution.isSome(facing) && Solution.isSome(away)).toBe(true)
    expect(facing).not.toEqual(away)
    // Edge-on, the face has no area on screen.
    const edgeOn = square.map(Rotation3d.applyTo(Rotation3d.aboutY(Math.PI / 2)))
    const onScreen = Polygon2d.fromArray(edgeOn.map((v) => projected(camera, v).point))
    expect(Polygon2d.area(onScreen)).toBeLessThan(1e-9)
  })

  test('a face toward the camera projects counterclockwise on screen', () => {
    const square = Polygon3d.fromTuples([
      [-1, -1, 0],
      [1, -1, 0],
      [1, 1, 0],
      [-1, 1, 0],
    ])
    // Its normal is +z, toward the eye at z = 10.
    const n = Polygon3d.normal(square)
    expect(Solution.isSome(n) && n.value.z).toBe(1)
    const onScreen = Polygon2d.fromArray(square.vertices.map((v) => projected(camera, v).point))
    expect(Polygon2d.winding(onScreen)).toEqual(Solution.one('counterclockwise'))
  })

  test('clippingPlanes face into the view', () => {
    const bounded = Camera.perspective({
      eye: Vector3.make(0, 0, 10),
      target: Vector3.zero,
      fovY: 1,
      near: 0.5,
      far: 30,
      viewport,
    })
    const [near, far] = Camera.clippingPlanes(bounded)
    expect(Plane3d.equals(near!, Plane3d.make(Vector3.make(0, 0, -1), -9.5))).toBe(true)
    expect(Plane3d.equals(far!, Plane3d.make(Vector3.unitZ, -20))).toBe(true)
    expect(Camera.clippingPlanes(camera)).toHaveLength(1)
    expect(Camera.clippingPlanes(flat)).toHaveLength(0)
    expect(
      Camera.clippingPlanes(
        Camera.orthographic({
          eye: Vector3.one,
          target: Vector3.zero,
          height: 1,
          far: 5,
          viewport,
        }),
      ),
    ).toHaveLength(1)
  })

  test('clip leaves a face crossing the near plane whose every vertex projects', () => {
    // A long floor strip running from behind the eye to well in front.
    const tilted = Camera.perspective({
      eye: Vector3.make(0.3, 2, 0),
      target: Vector3.make(0, 0, -10),
      fovY: 1.2,
      near: 0.25,
      far: 40,
      viewport,
    })
    const strip = Polygon3d.asConvex(
      Polygon3d.fromTuples([
        [-1, 0, 5],
        [1, 0, 5],
        [1.4, 0, -60],
        [-1.6, 0, -60],
      ]),
    )
    expect(strip.vertices.some((v) => Solution.isNone(Camera.project(tilted, v)))).toBe(true)
    const visible = Camera.clip(tilted, strip)
    if (Solution.isNone(visible)) {
      throw new Error('expected a visible piece')
    }
    const depths = visible.value.vertices.map((v) => projected(tilted, v).depth)
    // Two cut vertices on each plane, within rounding.
    expect(depths.filter((d) => Math.abs(d - 0.25) < 1e-12)).toHaveLength(2)
    expect(depths.filter((d) => Math.abs(d - 40) < 1e-12)).toHaveLength(2)
    expect(tilted.pipe(Camera.clip(strip))).toEqual(visible)
    // Wholly in view: the same instance. Wholly behind the eye: nothing.
    const ahead = Polygon3d.asConvex(
      Polygon3d.transform(
        strip,
        Affine3d.scale(0.1, 1, 0.1).pipe(Affine3d.andThen(Affine3d.translate(0, 0, -10))),
      ),
    )
    expect(Camera.clip(tilted, ahead)).toEqual(Solution.one(ahead))
    const behind = Polygon3d.asConvex(Polygon3d.transform(ahead, Affine3d.translate(0, 0, 30)))
    expect(Camera.clip(tilted, behind)).toBe(Solution.none)
  })

  test('kind guards, equals, and printing', () => {
    expect(Camera.isPerspective(camera) && Camera.isOrthographic(flat)).toBe(true)
    expect(Camera.isOrthographic(camera) || Camera.isCamera({ kind: 'perspective' })).toBe(false)
    const same = Camera.perspective({
      eye: Vector3.make(0, 0, 10),
      target: Vector3.make(0, 0, -5),
      fovY: Math.PI / 4,
      near: 0.1,
      viewport,
    })
    expect(Camera.equals(camera, same)).toBe(true)
    expect(Camera.equals(camera, flat)).toBe(false)
    expect(String(flat)).toBe(
      'Camera.Orthographic(eye (0, 0, 10), forward (0, 0, -1), height 6, viewport [0, 800] x [0, 600])',
    )
  })
})

// How far a point lies off an ellipse, as a fraction of its radius there.
const offEllipse = (
  e: { center: Vector2.Vector2; radiusX: number; radiusY: number; rotation: number },
  q: Vector2.Vector2,
) => {
  const c = Math.cos(e.rotation)
  const s = Math.sin(e.rotation)
  const dx = q.x - e.center.x
  const dy = q.y - e.center.y
  return Math.abs(Math.hypot((dx * c + dy * s) / e.radiusX, (dy * c - dx * s) / e.radiusY) - 1)
}

describe('projectCircle and projectSphere', () => {
  const tilted = Camera.perspective({
    eye: Vector3.make(3, 2, 10),
    target: Vector3.make(0, 0.5, 0),
    fovY: 0.8,
    near: 0.1,
    viewport,
  })
  const tiltedFlat = Camera.orthographic({
    eye: Vector3.make(3, 2, 10),
    target: Vector3.make(0, 0.5, 0),
    height: 6,
    viewport,
  })

  // Points around the circle center + u cos(t) + w sin(t).
  const around = (center: Vector3.Vector3, normal: Vector3.Vector3, radius: number) => {
    const n = Vector3.normalize(normal)
    const seed = Math.abs(n.x) < 0.9 ? Vector3.unitX : Vector3.unitY
    const u = Vector3.scale(Vector3.normalize(Vector3.cross(seed, n)), radius)
    const w = Vector3.cross(n, u)
    return Array.from({ length: 12 }, (_, k) => {
      const t = (k * Math.PI) / 6
      return Vector3.add(
        center,
        Vector3.add(Vector3.scale(u, Math.cos(t)), Vector3.scale(w, Math.sin(t))),
      )
    })
  }

  const circles: ReadonlyArray<readonly [Vector3.Vector3, Vector3.Vector3, number]> = [
    [Vector3.make(0, 0, 0), Vector3.unitY, 2],
    [Vector3.make(1.5, -0.5, 1), Vector3.make(1, 2, 3), 0.7],
    [Vector3.make(-2, 1, -1), Vector3.make(-3, 0.2, 1), 1.2],
    [Vector3.make(0.5, 1.5, 2), Vector3.make(0, 0, -1), 0.4],
  ]

  test.each([tilted, tiltedFlat])(
    'every projected point of a circle lies on its outline',
    (cam) => {
      for (const [center, normal, radius] of circles) {
        const outline = Solution.isNone(Camera.projectCircle(cam, center, normal, radius))
        expect(outline).toBe(false)
        const e = (
          Camera.projectCircle(cam, center, normal, radius) as Solution.One<Arc.Elliptical>
        ).value
        for (const q of around(center, normal, radius)) {
          expect(offEllipse(e, projected(cam, q).point)).toBeLessThan(1e-12)
        }
      }
    },
  )

  test.each([tilted, tiltedFlat])('a circle facing the camera runs counterclockwise', (cam) => {
    for (const [center, normal, radius] of circles) {
      const e = (Camera.projectCircle(cam, center, normal, radius) as Solution.One<Arc.Elliptical>)
        .value
      const toward =
        cam.kind === 'perspective'
          ? Vector3.dot(normal, Vector3.subtract(cam.eye, center)) > 0
          : Vector3.dot(normal, cam.frame.forward) < 0
      expect(e.sweep < 0).toBe(toward)
      // The same rule as for faces.
      const face = Polygon2d.fromArray(
        around(center, normal, radius).map((q) => projected(cam, q).point),
      )
      expect(Polygon2d.winding(face)).toEqual(
        Solution.one(toward ? 'counterclockwise' : 'clockwise'),
      )
    }
  })

  test('the outline of a circle seen edge-on is flat', () => {
    const e = (
      Camera.projectCircle(flat, Vector3.zero, Vector3.unitX, 1) as Solution.One<Arc.Elliptical>
    ).value
    expect(e.radiusX).toBeCloseTo(100, 9)
    expect(e.radiusY).toBeCloseTo(0, 9)
  })

  test('a perspective circle centers off the image of its center', () => {
    const center = Vector3.make(1.5, -0.5, 1)
    const e = (
      Camera.projectCircle(tilted, center, Vector3.make(1, 0, 0), 1) as Solution.One<Arc.Elliptical>
    ).value
    expect(
      Vector2.magnitude(Vector2.subtract(e.center, projected(tilted, center).point)),
    ).toBeGreaterThan(1)
  })

  test.each([tilted, tiltedFlat])('every grazing point of a sphere lies on its outline', (cam) => {
    const spheres: ReadonlyArray<readonly [Vector3.Vector3, number]> = [
      [Vector3.make(0, 0.5, 0), 1],
      [Vector3.make(2.5, -1, -2), 0.8],
      [Vector3.make(-2, 2, 1), 0.5],
    ]
    for (const [center, radius] of spheres) {
      const e = (Camera.projectSphere(cam, center, radius) as Solution.One<Arc.Elliptical>).value
      // The sight lines graze the sphere along a circle: around the line to
      // the eye under perspective, the great circle facing the view otherwise.
      let ring: ReadonlyArray<Vector3.Vector3>
      if (cam.kind === 'perspective') {
        const d = Vector3.subtract(center, cam.eye)
        const l = Vector3.magnitude(d)
        const n = Vector3.scale(d, 1 / l)
        ring = around(
          Vector3.subtract(center, Vector3.scale(n, (radius * radius) / l)),
          n,
          (radius * Math.sqrt(l * l - radius * radius)) / l,
        )
      } else {
        ring = around(center, cam.frame.forward, radius)
      }
      for (const q of ring) {
        expect(offEllipse(e, projected(cam, q).point)).toBeLessThan(1e-12)
      }
    }
  })

  test('an orthographic sphere is a circle, and a centered one is too', () => {
    const e = (Camera.projectSphere(flat, Vector3.make(1, 1, 0), 1) as Solution.One<Arc.Elliptical>)
      .value
    expect(e.radiusX).toBe(100)
    expect(e.radiusY).toBe(100)
    const centered = (Camera.projectSphere(camera, Vector3.zero, 1) as Solution.One<Arc.Elliptical>)
      .value
    expect(centered.radiusX).toBeCloseTo(centered.radiusY, 9)
    expect(centered.center).toBeCloseToValue(Vector2.make(400, 300))
  })

  test('shapes not wholly between the near and far planes are none', () => {
    // The sphere around the eye, and one straddling the near plane.
    expect(Camera.projectSphere(camera, Vector3.make(0, 0, 10), 1)).toBe(Solution.none)
    expect(Camera.projectSphere(camera, Vector3.make(0, 0, 9.5), 1)).toBe(Solution.none)
    // A circle crossing the eye's plane.
    expect(Camera.projectCircle(camera, Vector3.make(0, 0, 10), Vector3.unitX, 1)).toBe(
      Solution.none,
    )
    const shallow = Camera.perspective({
      eye: Vector3.make(0, 0, 10),
      target: Vector3.zero,
      fovY: Math.PI / 4,
      near: 0.1,
      far: 10,
      viewport,
    })
    expect(Camera.projectSphere(shallow, Vector3.zero, 0.5)).toBe(Solution.none)
    expect(Camera.projectSphere(shallow, Vector3.make(0, 0, 1), 0.5)).not.toBe(Solution.none)
    // An orthographic camera only has a far plane.
    expect(Camera.projectSphere(flat, Vector3.make(0, 0, 10), 1)).not.toBe(Solution.none)
  })

  test('data-last forms', () => {
    expect(camera.pipe(Camera.projectSphere(Vector3.zero, 1))).toEqual(
      Camera.projectSphere(camera, Vector3.zero, 1),
    )
    expect(camera.pipe(Camera.projectCircle(Vector3.zero, Vector3.unitY, 1))).toEqual(
      Camera.projectCircle(camera, Vector3.zero, Vector3.unitY, 1),
    )
  })

  test('rejects bad input', () => {
    expect(() => Camera.projectCircle(camera, Vector3.zero, Vector3.zero, 1)).toThrow()
    expect(() => Camera.projectCircle(camera, Vector3.zero, Vector3.unitY, -1)).toThrow()
    expect(() => Camera.projectSphere(camera, Vector3.zero, Number.NaN)).toThrow()
  })
})
