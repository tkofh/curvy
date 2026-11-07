---
'curvy': major
---

**`Cardinal2d` splines carry their own `tension` and a new `alpha`, and the default curve changed from uniform to centripetal Catmull-Rom.** The same control points draw a different curve in 2.0 unless you pass `{ alpha: 0 }`, which reproduces the 1.x shape.

`alpha` sets how the distance between neighboring control points spaces the curve's parameter. `0` is uniform, the only option in 1.x. `0.5` is centripetal, the new default, which avoids the cusps and self-intersections a uniform curve forms around clustered points. `1` is chordal. `tension` is the 1.x `scale` under its proper name, with the same meaning and the same default of `0.5`.

Both options belong to the spline value, so `toPath` and `toBezier` take only the spline. Construct with `Cardinal2d.fromArray(points, options?)`, since `Cardinal2d.make` is removed:

```ts
// 1.0.9
const c = Cardinal2d.make(p0, p1, p2, p3)
Cardinal2d.toPath(c, 0.7)
Cardinal2d.toBezier(c, 0.7)

// 2.0, the same curves
const c = Cardinal2d.fromArray([p0, p1, p2, p3], { tension: 0.7, alpha: 0 })
Cardinal2d.toPath(c)
Cardinal2d.toBezier(c)
```

TypeScript rejects the old two-argument calls. Untyped JavaScript does not: `Cardinal2d.toPath(c, 0.7)` ignores the `0.7` and draws the spline's own tension and alpha.

Also new on `Cardinal2d`:

- The `points`, `tension` and `alpha` fields are readable.
- `withTension`, `withAlpha` and `withOptions` return a copy with the same points. `withOptions` leaves an omitted field as it was.
- `withInterpolatedEndpoints` pads the spline so the curve passes through its first and last control points. It gives the same result as `withDuplicatedEndpoints`, under a name that says what you get.
- Every operation that returns a `Cardinal2d`, including `append`, `prepend` and the endpoint helpers, keeps tension and alpha.

```ts
const path = spline.pipe(
  Cardinal2d.withAlpha(0),
  Cardinal2d.withInterpolatedEndpoints,
  Cardinal2d.toPath,
)
```

[MIGRATION.md](https://github.com/tkofh/curvy/blob/main/MIGRATION.md) lists every 1.x spline call and its 2.0 form.
