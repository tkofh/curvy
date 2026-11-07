---
'curvy': minor
---

**Convex solids from planes.** A new `curvy/polyhedron` module adds `ConvexPolyhedron`, a bounded convex solid stored as indexed geometry: shared `vertices`, and `faces` that index into them. Each face also keeps the `Plane3d` it lies in and a label.

- `fromHalfSpaces(planes)` builds the solid inside every half-space, each given as a plane facing out of the solid. Pass `{ plane, label }` objects to label the faces, or bare planes to label each face with its plane's index. Faces run counterclockwise seen from outside. A plane that only touches the solid, misses it, or repeats an earlier face makes no face. The result is `none` when the half-spaces enclose no bounded solid with volume.
- Every corner is the meeting point of three input planes, solved directly rather than built up by repeated clipping.
- `contains(solid, point)` tests a point, boundary included. `polygons(solid)` returns the faces as `Polygon3d<Convex & Planar>`, ready for `Camera.clip`.
- `transform(solid, affine)` moves vertices and planes together. Under a mirror it reverses each face so faces stay wound outward.

```ts
import { Plane3d } from 'curvy/plane'
import { ConvexPolyhedron } from 'curvy/polyhedron'
import { Vector3 } from 'curvy/vector'

const wedge = ConvexPolyhedron.fromHalfSpaces([
  { plane: Plane3d.make(Vector3.make(0, 0, -1), 0), label: 'floor' },
  { plane: Plane3d.make(Vector3.make(-1, 0, 0), 0), label: 'back' },
  { plane: Plane3d.make(Vector3.make(0, -1, 0), 0), label: 'left' },
  { plane: Plane3d.make(Vector3.make(0, 1, 0), 1), label: 'right' },
  { plane: Plane3d.make(Vector3.make(1, 0, 1), 1), label: 'roof' },
])
// Solution.One(ConvexPolyhedron(6 vertices, 5 faces)), faces labeled
// 'floor', 'back', 'left', 'right', 'roof'
```
