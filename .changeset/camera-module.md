---
'curvy': minor
---

**Cameras.** A new `curvy/camera` module adds `Camera`, which projects 3D points onto a 2D viewport in SVG coordinates. Like `Arc`, it is a union with two kinds. `Camera.perspective({ eye, target, up?, fovY, near, far?, viewport })` builds one where distant things look smaller. `Camera.orthographic({ eye, target, up?, height, far?, viewport })` builds one where size doesn't change with distance. The viewport is any `Bounds2d`, so an `Interval2d` works, and the view's up lands toward the top of it even though SVG's y axis points down.

`project(camera, point)` returns the viewport position and a `depth`, the point's distance in front of the eye in world units. Depth is linear, so sorting faces by it paints back to front. A perspective camera returns `none` for points closer than its near plane, and either kind returns `none` for points beyond its far plane, which defaults to infinity. A point on either plane to within rounding still projects, so geometry clipped against the planes projects whole. `projectTo(camera)` is the curried form for mapping arrays of points, and it computes the screen mapping once.

Each camera exposes its `eye` and its directions as a `Frame3d`, and `Camera.view` gives the rigid `Affine3d` from world coordinates to OpenGL-style eye space. Projected faces combine with `Polygon2d.winding` for back-face culling: a face whose normal points toward the camera projects `'counterclockwise'`, and one that turns away flips.

`Camera.clippingPlanes` returns the near and far planes as `Plane3d` values facing into the view, and `Camera.clip(camera, face)` cuts a convex `Polygon3d` against them. Every vertex of the result projects, so a face that crosses the near plane draws correctly instead of losing the vertices behind the eye.

`Camera.projectCircle(camera, center, normal, radius)` and `Camera.projectSphere(camera, center, radius)` return the outline of a 3D circle or a sphere as an `Arc.Elliptical` in the viewport, ready for `Arc.toPathData` or an SVG `<ellipse>`. Both are exact under either kind of camera, including the off-center ellipse a perspective camera makes of a circle and the stretched outline it gives a sphere off to the side. A circle facing the camera comes back with a negative `sweep`, matching the face rule. Each returns `none` unless the whole shape lies between the near and far planes.

```ts
import { Camera } from 'curvy/camera'
import { Interval2d } from 'curvy/interval'
import { Vector2, Vector3 } from 'curvy/vector'

const camera = Camera.perspective({
  eye: Vector3.make(0, 0, 10),
  target: Vector3.zero,
  fovY: Math.PI / 4,
  near: 0.1,
  viewport: Interval2d.fromCorners(Vector2.zero, Vector2.make(800, 600)),
})

Camera.project(camera, Vector3.zero) // Solution.one({ point: Vector2(400, 300), depth: 10 })
```
