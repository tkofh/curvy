---
'curvy': minor
---

**Polygons.** A new `curvy/polygon` module adds `Polygon2d`, a closed cycle of three or more vertices with an implicit closing edge. Build one with `make`, `fromArray`, or `fromTuples`. It iterates over its vertices, and `transform` applies an `Affine2d` to every vertex.

Measures read the polygon as a region:

- `signedArea` follows the shoelace formula. It is positive when the vertices rotate `+x` toward `+y`, which is `'clockwise'` on screen in the coordinates module's `Winding` convention.
- `winding` returns a `Winding`, or `none` for a polygon with no area at working precision. Back-face culling reads it off a projected face.
- `centroid` gives the area centroid, or `none` for a degenerate polygon. `area`, `perimeter`, and `boundingBox` round out the measures.

A `Convex` brand, set by `isConvex` and `asConvex`, gates the operations that need convexity. Convex means positive area, every corner turning the same way, and an outline that goes around once. Collinear and repeated vertices pass, and a pentagram fails. `convexHull` builds a branded hull from any point set by Andrew's monotone chain. It returns `none` when the points are collinear.

The branded operations each return results that stay convex:

- `clip(polygon, origin, normal)` keeps the side of a line the normal points toward, by the Sutherland–Hodgman step. Vertices on the line stay exact, and a polygon the line misses comes back as the same instance.
- `split` returns `{ front, back }`, each a `Solution.AtMostOne`. The two pieces share their crossing vertices.
- `inset(polygon, distance)` moves every edge inward. An edge that shrinks to nothing drops out, and an inset past the inradius returns `none`.

Rounded corners follow the arc module's pair of outputs. `rounded` builds a `RationalCubicPath2d` with exact circular fillets, and `roundedPathData` emits SVG `A` commands. Each takes one radius or one per vertex. A radius too large for its corner shrinks so that neighboring fillets meet at the edge midpoints. `toPathData` emits the plain outline, closed with `Z`, and `toPath` gives it as a `LinearPath2d`.

```ts
import { Polygon2d } from 'curvy/polygon'

const face = Polygon2d.asConvex(
  Polygon2d.fromTuples([
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ]),
)

Polygon2d.winding(face) // Solution.one('clockwise')
Polygon2d.inset(face, 1) // Solution.one(Polygon2d((1, 1), (9, 1), (9, 9), (1, 9)))
Polygon2d.roundedPathData(face, 2)
// 'M 0,2 A 2 2 0 0 1 2,0 L 8,0 A 2 2 0 0 1 10,2 L 10,8 A 2 2 0 0 1 8,10 L 2,10 A 2 2 0 0 1 0,8 Z'
```
