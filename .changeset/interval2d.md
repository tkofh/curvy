---
'curvy': minor
---

**New `Interval2d` + `Bounds2d` in `curvy/interval`, plus `boundingBox` on every curve and path.** An `Interval2d` is the Cartesian product of two intervals — the smallest abstraction for "is this curve inside this region?" without dragging in a richer rectangle/transform model. Mirrors the `Interval`/`Bounds` split in 1D: `Interval2d` carries per-axis kinds; `Bounds2d` is the structural minimum used by operations (like `size`) that don't depend on endpoint inclusivity.

```ts
import { Interval, Interval2d } from 'curvy/interval'
import { Vector2 } from 'curvy/vector'

const allowed = Interval2d.make(Interval.make(0, 100), Interval.make(0, 1))
Interval2d.containsVector(allowed, Vector2.make(50, 0.5)) // true
```

`Interval2d<X, Y>` is generic over per-axis subtypes so a closed-on-closed value stays `Interval2d<Closed, Closed>` and mixed-kind values preserve that information through the type system.

**Surface:**

- `Interval2d.make(xInterval, yInterval)` — preserves both axis subtypes
- `Interval2d.fromCorners(p0, p1)` — order-independent, returns `Interval2d<Closed, Closed>`
- `Interval2d.fromVectors(...points)` — smallest closed value enclosing all inputs
- `Interval2d.containsVector(box, v)` — point-in-region, per-axis kind-aware
- `Interval2d.containsInterval2d(outer, inner)` — subset test, kind-aware on both sides
- `Interval2d.size(box)` — accepts `Bounds2d`, returns `Vector2`
- `Interval2d.union(a, b)` — kind-preserving (see below)
- `Interval2d.equals(a, b)` — kind-aware equality
- `Interval2d.isInterval2d` — guard
- `Bounds2d` — structural minimum `{ x: Bounds; y: Bounds }`

**Kind-preserving union with a collapsing type signature.** `Interval2d.union` returns a type that collapses to the input's shared kind when both axes match, and widens to the open `Interval` type when they differ:

```ts
Interval2d.union(closedA, closedB) // Interval2d<Closed, Closed>
Interval2d.union(openA, openB) // Interval2d<Open, Open>
Interval2d.union(closedA, openB) // Interval2d<Interval, Interval>
```

The runtime is genuinely kind-correct: each endpoint of the result is the extremum of the inputs', and its inclusivity follows the input that contributed it. When endpoints tie, the result is closed at that point if either input includes it.

**`Interval.union(a, b)` — the underlying primitive.** Exposed on the interval module because it's a self-contained operation worth using on its own.

**`boundingBox` is available on every polynomial curve and path:**

```ts
import { CubicCurve2d } from 'curvy/curve'
import { CubicPath2d } from 'curvy/path'

CubicCurve2d.boundingBox(curve) // Interval2d<Closed, Closed>
CubicPath2d.boundingBox(path) // Interval2d<Closed, Closed>
```

Curve-level implementations account for interior extrema (so the box is tight against the curve, not just its control polygon). Path-level implementations union per-segment boxes via `Interval2d.union`.

Rational cubic curves don't get a `boundingBox` yet — computing the bbox of `(x(t)/w(t), y(t)/w(t))` requires finding roots of a degree-5 polynomial, which is a real implementation rather than a one-liner over existing primitives. Deferred. Workaround: `RationalCubicPath2d.approximateAsCubicPath(path, tolerance).pipe(CubicPath2d.boundingBox)` produces a slightly-padded but valid outer bound.

**New `Interval.containsInterval(outer, inner)` helper.** Kind-aware interval-subset test, the primitive underneath `Interval2d.containsInterval2d`. Exposed on the interval module because it's a self-contained operation that's useful on its own.

**Polynomial `range` return types tightened to `Closed`.** `LinearPolynomial.range`, `QuadraticPolynomial.range`, and `CubicPolynomial.range` previously declared `Interval` returns but always built `Closed` at runtime. The tightening lets `boundingBox` thread `Interval2d<Closed, Closed>` through without casts. Also fixes a latent bug in `LinearPolynomial.range` where decreasing polynomials would throw on `Interval.make`'s ordering check — now uses `fromMinMax`.
