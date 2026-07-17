---
'curvy': minor
---

**`boundingBox` on every curve and path**, tight against the geometry rather than the control polygon.

**Polynomial curves and paths.** `boundingBox` is available on every polynomial curve and path:

```ts
import { CubicCurve2d } from 'curvy/curve'
import { CubicPath2d } from 'curvy/path'

CubicCurve2d.boundingBox(curve) // Interval2d<Closed, Closed>
CubicPath2d.boundingBox(path) // Interval2d<Closed, Closed>
```

Curve-level implementations account for interior extrema (so the box is tight against the curve, not just its control polygon). Path-level implementations union per-segment boxes via `Interval2d.union`.

**`unitRange` helpers back the curve-level boxes.** `LinearPolynomial.unitRange(p)`, `QuadraticPolynomial.unitRange(p)`, and `CubicPolynomial.unitRange(p)` are equivalent to `range(p, Interval.unit)` without needing to import `Interval.unit` at the call site. Same semantics: they account for any interior extrema in `[0, 1]`.

```ts
// before
Interval2d.make(
  CubicPolynomial.range(c.x, Interval.unit),
  CubicPolynomial.range(c.y, Interval.unit),
)
// after
Interval2d.make(CubicPolynomial.unitRange(c.x), CubicPolynomial.unitRange(c.y))
```

**Polynomial `range` return types tightened to `Closed`.** `LinearPolynomial.range`, `QuadraticPolynomial.range`, and `CubicPolynomial.range` previously declared `Interval` returns but always built `Closed` at runtime. The tightening lets `boundingBox` thread `Interval2d<Closed, Closed>` through without casts. It also fixes a latent bug in `LinearPolynomial.range` where decreasing polynomials would throw on `Interval.make`'s ordering check — now it uses `fromMinMax`.

**Tight rational bounding box via subdivision.** `RationalCubicCurve2d.boundingBox` takes a `tolerance` and returns a box tight to within `tolerance` per side.

```ts
import { RationalCubicCurve2d } from 'curvy/curve'
RationalCubicCurve2d.boundingBox(c, 0.01) // Interval2d<Closed, Closed>
```

Computing the exact box would require the extrema of `x(t)/w(t)` and `y(t)/w(t)`, each a degree-5 root problem. Instead the curve is subdivided at `t = 0.5` and the per-leaf hull AABBs are unioned. The per-leaf termination criterion compares the leaf hull against the leaf's endpoint AABB (which the curve provably visits), so the per-side slack is bounded. Polynomial cubics (uniform weights) hit a fast path that computes the exact box from per-axis cubic extrema with no subdivision.

**Path-level rational box.** `RationalCubicPath2d.boundingBox(p, tolerance)` unions the per-segment boxes. The slack guarantee carries through — each segment is within tolerance, so the union is too.

```ts
import { RationalCubicPath2d } from 'curvy/path'
RationalCubicPath2d.boundingBox(path, 0.01)
```
