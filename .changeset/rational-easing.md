---
'curvy': minor
---

**Easing constructors on `RationalCubicCurve2d`.** Two ways to build a `y(x)` easing curve directly, without assembling control points by hand.

**`fromSlopesAndCurvatures(m0, m1, k0, k1)`** takes endpoint slopes _and_ signed curvatures, interpolates `(0, 0)` and `(1, 1)`, and pins `x(t) = t` exactly — so `solveAtX` is exact rather than approximate for these curves.

```ts
import { RationalCubicCurve2d } from 'curvy/curve'

// Smoothstep — y'(0) = y'(1) = 0, y''(0) = 6, y''(1) = -6.
const smoothstep = RationalCubicCurve2d.fromSlopesAndCurvatures(0, 0, 6, -6)

// Linear — y(t) = t. Special-cased from the degenerate constraint system.
const linear = RationalCubicCurve2d.fromSlopesAndCurvatures(1, 1, 0, 0)

// Asymmetric ease with a flat start.
const ease = RationalCubicCurve2d.fromSlopesAndCurvatures(0, 2, 2, 0.18)
```

Curvature inputs are the signed differential-geometric curvatures `κ = y''(x) / (1 + y'(x)²)^(3/2)` — the parameterization-invariant "bend" of the easing graph, positive for concave-up. Because `x(t) = t` is pinned, parametric and Cartesian second derivatives agree at the endpoints, so the conversion is simply `y''(0) = κ₀ · (1 + m₀²)^(3/2)` (and likewise at 1). Under the hood the denominator polynomial is quadratic, giving six free parameters for six endpoint constraints; solving for its Bernstein control values is a closed-form 2×2 linear system. Construction throws on non-finite inputs, a singular constraint system (other than the canonical linear case), or a denominator that vanishes on `[0, 1]`.

Monotonicity is not enforced at construction. Callers who need the `Increasing` brand — for `solveAtX`'s narrowed `Solution.AtMostOne` return — follow construction with `asIncreasing` / `asMonotonic`, which run a rigorous Bernstein sign-convexity check:

```ts
const ease = RationalCubicCurve2d.asIncreasing(
  RationalCubicCurve2d.fromSlopesAndCurvatures(0.5, 1.5, 1, -1),
)
RationalCubicCurve2d.solveAtX(ease, 0.7) // → Solution.AtMostOne<number>
```

**`fromBezierPoints(p1, p2)` — a 2-arg easing overload.** Pins the endpoints at `(0, 0)` and `(1, 1)` with unit weights, leaving the two interior handles as the only inputs — the rational analog of CSS's `cubic-bezier(x1, y1, x2, y2)`, with weights available for true rational control. Unit weights recover the polynomial Bézier. The four-arg form is unchanged; the runtime dispatches on `arguments.length`.

```ts
import { Vector2 } from 'curvy/vector'

// CSS ease-in-out.
const ease = RationalCubicCurve2d.fromBezierPoints(
  Vector2.makeWeighted(0.42, 0, 1),
  Vector2.makeWeighted(0.58, 1, 1),
)
```
