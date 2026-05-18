---
'curvy': minor
---

**Spline `mapPoints` / `flatMap` + `Vector2.liftWithWeight`.** Every spline type — `Linear2d`, `Bezier2d`, `Basis2d`, `Cardinal2d`, `Hermite2d`, `RationalBezier2d` — now exposes a `mapPoints` (per-point transform) and a `flatMap` (bulk transform with builder access). Both go through the existing constructors, so point-count and arity invariants stay enforced.

```ts
import { Bezier2d } from 'curvy/splines'
import { Vector2 } from 'curvy/vector'

const translated = bezier.pipe(Bezier2d.mapPoints((p) => Vector2.make(p.x + 10, p.y)))

const decimated = bezier.pipe(
  Bezier2d.flatMap((points) => Bezier2d.fromArray(points.filter((_, i) => i % 2 === 0))),
)
```

`RationalBezier2d.mapPoints` takes a `Vector2.Weighted → Vector2.Weighted` mapper, matching its storage form. Two related conveniences:

- `Vector2.liftWithWeight(fn)` bridges a position-only `Vector2 → Vector2` function up to a weighted mapper, **preserving the input weight by default** — translating, rotating, or scaling a conic arc no longer risks silently collapsing its geometry-defining weights to 1.
- `Vector2.liftWithWeight(fn, weight)` overrides the weight when you want to reset it explicitly.
- Dual: `Vector2.liftWithWeight(weighted, fn)` and `Vector2.liftWithWeight(weighted, fn, weight)` apply directly to a single point.

```ts
import { RationalBezier2d } from 'curvy/splines'
import { Vector2 } from 'curvy/vector'

// Weight passes through unchanged — circle stays a circle.
const moved = arc.pipe(
  RationalBezier2d.mapPoints(Vector2.liftWithWeight((p) => Vector2.make(p.x + 10, p.y))),
)
```

`Cardinal2d.mapPoints` preserves the spline's `tension` and `alpha`; `Cardinal2d.flatMap` uses whatever options the mapper picks on the new spline. `Hermite2d.mapPoints` applies the transform uniformly to both position and velocity slots — affine transforms behave correctly across both; for position-only translation, use `flatMap` to split the array yourself.
