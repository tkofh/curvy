---
'curvy': minor
---

**New `curvy/box` module + `boundingBox` on every curve and path.** A `Box2d` is the Cartesian product of two intervals — the smallest abstraction that lets you say "is this curve inside this region?" without dragging in a richer rectangle/transform abstraction.

```ts
import { Box2d } from 'curvy/box'
import { Interval } from 'curvy/interval'
import { Vector2 } from 'curvy/vector'

const allowed = Box2d.make(Interval.make(0, 100), Interval.make(0, 1))
Box2d.containsVector(allowed, Vector2.make(50, 0.5)) // true
```

The type is generic over per-axis interval subtype so a closed-on-closed box stays `Box2d<Closed, Closed>` and mixed-openness boxes preserve that information through the type system. The minimum surface:

- `Box2d.make(xInterval, yInterval)` — preserves both axis subtypes
- `Box2d.fromCorners(p0, p1)` — order-independent, returns `Box2d<Closed, Closed>`
- `Box2d.fromVectors(...points)` — smallest closed box enclosing all inputs
- `Box2d.containsVector(box, v)` — point-in-box test, respects per-axis kinds
- `Box2d.containsBox(outer, inner)` — subset test, respects kinds on both sides
- `Box2d.size(box)` — `(width, height)` as `Vector2`
- `Box2d.equals(a, b)` — kind-aware equality
- `Box2d.union(a, b)` — smallest closed box enclosing both
- `Box2d.isBox2d` — guard

**`boundingBox` is now available on every polynomial curve and path:**

```ts
import { CubicCurve2d } from 'curvy/curve'
import { CubicPath2d } from 'curvy/path'

CubicCurve2d.boundingBox(curve) // Box2d<Closed, Closed>
CubicPath2d.boundingBox(path)   // Box2d<Closed, Closed> — union over segments
```

The curve-level implementations account for interior extrema (so the box is tight against the curve, not just its control polygon). The path-level implementations union per-segment boxes via `Box2d.union`.

Rational cubic curves don't get a `boundingBox` yet — computing the bbox of `(x(t)/w(t), y(t)/w(t))` requires finding roots of a degree-5 polynomial, which is a real implementation rather than a one-liner over existing primitives. Deferred to a later pass.

**New `Interval.containsInterval(outer, inner)` helper.** Kind-aware interval-subset test, the primitive underneath `Box2d.containsBox`. Exposed on the interval module because it's a self-contained operation that's useful on its own.

**Polynomial `range` return types tightened to `Closed`.** `LinearPolynomial.range`, `QuadraticPolynomial.range`, and `CubicPolynomial.range` previously declared `Interval` returns but always built `Closed` at runtime. The tightening lets `boundingBox` thread `Box2d<Closed, Closed>` through the type system without casts. Also fixes a latent bug in `LinearPolynomial.range` where decreasing polynomials (where `solve(p, start) > solve(p, end)`) would throw on the `Interval.make` ordering check — now uses `fromMinMax`.
