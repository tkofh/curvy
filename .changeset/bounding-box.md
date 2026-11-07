---
'curvy': minor
---

**Curves and paths gain geometry queries: endpoints, axis ranges, tight bounding boxes, arc-length sampling, degree elevation, and Bézier subdivision.**

- `startPoint(c)` and `endPoint(c)` evaluate every curve at `t = 0` and `t = 1` in closed form.
- `xRange(c)` and `yRange(c)` return the closed `[min, max]` of one axis over `t in [0, 1]` on linear, quadratic, and cubic curves. Polynomials gain the matching `unitRange(p)`, shorthand for `range(p, Interval.unit)`, and `coefficients(p)`, which returns the coefficients as a tuple (`[c0, c1, c2, c3]` for a cubic).
- `boundingBox` on every curve and path returns an `Interval2d<Closed, Closed>` fitted to the curve itself, interior extrema included, rather than to its control points. Rational curves and paths take a `tolerance` and return a box at most `tolerance` loose on each side (see [PRECISION.md](https://github.com/tkofh/curvy/blob/main/PRECISION.md)).
- `CubicPath2d.solveByDistance(path, s)` returns the point at normalized arc length `s in [0, 1]`. Equal steps in `s` cover equal distances along the path, however unevenly the parameter `u` of `solve` is spaced. An `s` outside the range clamps to the nearest endpoint.
- `CubicCurve2d.fromLinear`, `CubicCurve2d.fromQuadratic`, `CubicPath2d.fromLinear`, and `CubicPath2d.fromQuadratic` re-express lower-degree geometry as cubics that evaluate identically at every parameter and keep their trait brands. They let a polyline reach APIs that take cubic paths, such as `CoordinateSystem.image`.
- `Bezier2d.subdivide(b, u)` splits a multi-segment Bézier spline at global parameter `u` into two splines covering `[0, u]` and `[u, 1]`. It throws unless `0 < u < 1`.

```ts
CubicCurve2d.boundingBox(curve) // Interval2d<Closed, Closed>
RationalCubicPath2d.boundingBox(rationalPath, 0.01) // at most 0.01 loose on each side
CubicPath2d.solveByDistance(path, 0.5) // the point halfway along the path
const [left, right] = Bezier2d.subdivide(spline, 0.25)
```
