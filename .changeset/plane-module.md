---
'curvy': minor
---

**Planes.** A new `curvy/plane` module adds `Plane3d`, the points `p` with `dot(normal, p) = offset`. The normal is stored as a unit vector, and it picks a front side: `signedDistance` is positive there, and clipping keeps it.

- Build one with `make(normal, offset)`, which normalizes the normal and scales the offset with it, `fromPointNormal(point, normal)`, or `through(a, b, c)`. `through` returns `none` for collinear points, and its normal is `cross(b - a, c - a)`.
- `signedDistance`, `closestPoint`, `flip`, and `shift` (move along the normal) cover the everyday questions.
- `transform(plane, affine)` maps a plane through an `Affine3d`. The front side stays the front, under a mirror too, so a solid's outward face planes stay outward.
- `intersection(a, b, c)` finds the point where three planes meet, which is how a solid's corners follow from its face planes. It returns `none` when the planes don't meet in a single point.
- `intersectRay(plane, origin, direction)` finds where a ray meets the plane, or `none` when it points away or runs parallel.

```ts
import { Plane3d } from 'curvy/plane'
import { Vector3 } from 'curvy/vector'

Plane3d.intersection(
  Plane3d.make(Vector3.unitX, 1),
  Plane3d.make(Vector3.unitY, 2),
  Plane3d.make(Vector3.unitZ, 3),
) // Solution.One(Vector3(1, 2, 3))
```
