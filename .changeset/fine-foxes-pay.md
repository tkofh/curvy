---
'curvy': major
---

**Monotonicity detection on rational cubic curves.** Two new accessors on `RationalCubicCurve2d` classify each projected axis on the unit interval:

```ts
import { RationalCubicCurve2d } from 'curvy/curve'
import { Monotonicity } from 'curvy/monotonicity'

RationalCubicCurve2d.xMonotonicity(c) // Monotonicity (Constant | Increasing | Decreasing | None)
RationalCubicCurve2d.yMonotonicity(c)
```

The classification is decided via **Bernstein sign convexity** on the derivative-numerator polynomial `q(t) = X'*W - X*W'`. Since `W^2 > 0` wherever the curve is well-defined, the sign of `dx/dt` equals the sign of `q`. Although `q` is a difference of degree-5 products, the leading terms cancel and `q` is in fact a quartic — its 5 Bernstein coefficients on `[0, 1]` are evaluated for uniform sign, with de Casteljau subdivision to resolve mixed-sign cases. The procedure is exact except at tangential zeros, where it conservatively reports `None`. No quintic solver involved.

**Trait refiners and asserters, both combined and per-axis.** All twelve forms attach the `Monotonic` / `Increasing` / `Decreasing` brand from `curvy/polynomial`:

```ts
// combined — both axes must satisfy
RationalCubicCurve2d.isMonotonic(c) // c is RationalCubicCurve2d<XT & Monotonic, YT & Monotonic>
RationalCubicCurve2d.isIncreasing(c)
RationalCubicCurve2d.isDecreasing(c)
RationalCubicCurve2d.asMonotonic(c) // throws if not

// per-axis — narrows only the named axis
RationalCubicCurve2d.isMonotonicX(c) // c is RationalCubicCurve2d<XT & Monotonic, YT>
RationalCubicCurve2d.isIncreasingX(c)
RationalCubicCurve2d.isDecreasingX(c)
RationalCubicCurve2d.asMonotonicX(c)
// (and the corresponding `...Y` variants)
```

Per-axis matters because `solveAtX`'s `XT extends Monotonic` overload (returning `Solution.AtMostOne<number>`) only needs x monotonicity — not y. The combined refiners compose internally from `isXxx(c) && isYyy(c)`, with TypeScript's `&&` narrowing accumulating both brands.

**Tight bounding box via subdivision.** `RationalCubicCurve2d.boundingBox` takes a `tolerance` and returns a box tight to within `tolerance` per side.

```ts
RationalCubicCurve2d.boundingBox(c, 0.01) // Interval2d<Closed, Closed>
```

Computing the exact box would require the extrema of `x(t)/w(t)` and `y(t)/w(t)`, each a degree-5 root problem. Instead the curve is subdivided at `t = 0.5` and the per-leaf hull AABBs are unioned. The per-leaf termination criterion compares the leaf hull against the leaf's endpoint AABB (which the curve provably visits), so the per-side slack is bounded. Polynomial cubics (uniform weights) hit a fast path that computes the exact box from per-axis cubic extrema with no subdivision.

**Path-level bounding box.** `RationalCubicPath2d.boundingBox(p, tolerance)` unions the per-segment boxes. The slack guarantee carries through — each segment is within tolerance, so the union is too.

```ts
import { RationalCubicPath2d } from 'curvy/path'
RationalCubicPath2d.boundingBox(path, 0.01)
```
