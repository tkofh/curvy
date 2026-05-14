---
'curvy': minor
---

Added `Linear2d` to the splines family — a polyline (ordered list of points) that converts to a `LinearPath2d` by joining consecutive points with straight segments. Mirrors the surface of `Basis2d` / `Bezier2d` / `Cardinal2d` / `Hermite2d`: `make`, `fromArray`, `fromTuples`, `append`, `prepend`, `toPath`. Minimum of 2 points (1 segment).

The motivating use case is "build a polyline from a list of (x, y) values, then realize it as a path" without writing the per-segment `LinearCurve2d.fromEndpoints` boilerplate by hand:

```ts
// before
const segments: Array<LinearCurve2d> = []
for (let i = 1; i < xs.length; i++) {
  segments.push(
    LinearCurve2d.fromEndpoints(
      Vector2.make(xs[i - 1]!, ys[i - 1]!),
      Vector2.make(xs[i]!, ys[i]!),
    ),
  )
}
const path = LinearPath2d.fromArray(segments)

// after
const path = Linear2d.fromTuples(xs.map((x, i) => [x, ys[i]!])).pipe(Linear2d.toPath)
```

`toPath` returns an unbranded `LinearPath2d`. If the polyline is monotonic in an axis, follow with `LinearPath2d.asMonotonicX` / `asMonotonicY` to brand the result (or use the `is*` refiner if you want to fall through).
