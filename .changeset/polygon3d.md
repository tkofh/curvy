---
'curvy': minor
---

**3D polygons.** `curvy/polygon` adds `Polygon3d`, a closed cycle of 3D vertices such as a face of a solid. It has the same constructors as `Polygon2d` (`make`, `fromArray`, `fromTuples`), and `transform` applies an `Affine3d`.

- `normal` gives the unit normal by Newell's method, which follows the right-hand rule and averages out small departures from a plane. `area`, `perimeter`, and `centroid` (the area centroid) round out the measures. `normal` and `centroid` return `none` for a polygon with no area.
- `isPlanar` and `asPlanar` establish the `Planar` brand: the polygon has area and every vertex lies on one plane. `plane` takes a `Polygon3d<Planar>` and returns its `Plane3d`.
- `isConvex` and `asConvex` establish the `Convex` brand. A convex 3D polygon is also planar, so they grant `Planar` too, as do `clip` and `split` on their results.
- `clip(face, plane)` keeps the part on the plane's front side, by Sutherland–Hodgman, and `split(face, plane)` returns both pieces. A face lying in the plane counts as on both sides.
- `inset(face, distance)` shrinks a convex face within its plane by moving every edge inward, like `Polygon2d.inset`.

```ts
import { Plane3d } from 'curvy/plane'
import { Polygon3d } from 'curvy/polygon'
import { Vector3 } from 'curvy/vector'

const face = Polygon3d.asConvex(
  Polygon3d.fromTuples([
    [0, 0, 0],
    [4, 0, 0],
    [4, 4, 0],
    [0, 4, 0],
  ]),
)

Polygon3d.normal(face) // Solution.one(Vector3(0, 0, 1))
Polygon3d.clip(face, Plane3d.make(Vector3.make(-1, 0, 0), -1))
// Solution.one(Polygon3d((0, 0, 0), (1, 0, 0), (1, 4, 0), (0, 4, 0)))
```
