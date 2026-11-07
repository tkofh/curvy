---
'curvy': minor
---

**Polygons.** The new `curvy/polygon` module adds `Polygon2d` and `Polygon3d`, closed cycles of three or more vertices with an implicit closing edge. Build either with `fromArray` or `fromTuples`. Both iterate over their vertices, `reverse` their order, and `transform` through an `Affine2d` or `Affine3d`.

`Polygon2d` reads a polygon as a region:

- `signedArea` is positive when the vertices rotate `+x` toward `+y`. `winding` reports that as `'clockwise'` on a y-down screen, and returns `none` for a polygon with no area.
- `area`, `perimeter`, `centroid`, and `boundingBox` round out the measures.
- A `Convex` brand, from `isConvex` or `asConvex`, means non-zero area in either winding, every corner turning the same way, and an outline that goes around once. `convexHull` builds a branded hull from a point set, or `none` for collinear points.
- On a convex polygon, `clip(polygon, origin, normal)` keeps the side of a line the normal points toward and returns a `Solution.AtMostOne`, `none` when nothing of non-zero area remains. `split` returns both sides, and `inset` moves every edge inward.
- `rounded` builds exact circular fillets as a `RationalCubicPath2d`, and `roundedPathData` emits them as SVG `A` commands. `toPath` and `toPathData` give the plain outline.

`Polygon3d` models faces of solids, with `normal` (Newell's method, right-hand rule), `area`, `perimeter`, and `centroid`. A `Planar` brand unlocks `plane`, which returns the face's `Plane3d`. `Convex` implies `Planar` and gates `clip` and `split` against a `Plane3d` and an in-plane `inset`. A mirroring `transform` turns a face inside out, so follow it with `reverse` to keep faces facing out.

```ts
const face = Polygon2d.asConvex(
  Polygon2d.fromTuples([
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ]),
)

Polygon2d.winding(face) // Solution.One('clockwise')
Polygon2d.inset(face, 1) // Solution.One(Polygon2d((1, 1), (9, 1), (9, 9), (1, 9)))
Polygon2d.roundedPathData(face, 2)
// 'M 0,2 A 2 2 0 0 1 2,0 L 8,0 A 2 2 0 0 1 10,2 L 10,8 A 2 2 0 0 1 8,10 L 2,10 A 2 2 0 0 1 0,8 Z'
```
