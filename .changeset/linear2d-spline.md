---
'curvy': minor
---

**New `Linear2d` polyline spline, and `mapPoints` and `flatMap` on every spline type.**

`Linear2d` in `curvy/splines` holds two or more points and converts to a `LinearPath2d` of straight segments. Like the other splines, it has `fromArray`, `fromTuples`, `append`, `prepend` and `toPath`:

```ts
const path = Linear2d.fromTuples(xs.map((x, i) => [x, ys[i]!])).pipe(Linear2d.toPath)
```

`toPath` returns an unbranded path. Brand it with `LinearPath2d.asMonotonicX` or `asMonotonicY` when the points warrant it.

Every spline type (`Bezier2d`, `Basis2d`, `Cardinal2d`, `Hermite2d`, `Linear2d` and `RationalBezier2d`) has two ways to rebuild a spline from its points. The result goes through the type's constructor, so the point-count rules still hold.

- `mapPoints(spline, f)` applies `f` to every stored point, for edits such as snapping to a grid. `Hermite2d.mapPoints` hands `f` the tangents as well as the positions, so a translation there shifts the tangents too.
- `flatMap(spline, f)` hands `f` the whole point array and returns the spline `f` builds, for edits that need every point at once.

```ts
const snapped = bezier.pipe(
  Bezier2d.mapPoints((p) => Vector2.make(Math.round(p.x), Math.round(p.y))),
)

const thinned = line.pipe(
  Linear2d.flatMap((points) =>
    Linear2d.fromArray(points.filter((_, i) => i % 2 === 0 || i === points.length - 1)),
  ),
)
```

For translation, rotation, scaling and other affine maps, use the spline's `transform` instead, which applies only the linear part to Hermite tangents and keeps rational weights.

`Cardinal2d.mapPoints` keeps the spline's tension and alpha. `RationalBezier2d.mapPoints` maps `Vector2.Weighted` points. `Vector2.liftWithWeight(f)` turns a `Vector2 -> Vector2` function into one that keeps each point's weight, and `Vector2.liftWithWeight(f, w)` sets every weight to `w`.
