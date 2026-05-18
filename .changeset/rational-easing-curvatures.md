---
'curvy': minor
---

**`RationalCubicCurve2d.fromSlopesAndCurvatures` replaces `makeMonotonicEasing`.** The easing constructor now takes endpoint slopes _and_ signed curvatures, giving full control over the start and end shape of the curve rather than the previous slope-only Gregory-Delbourgo heuristic.

```ts
import { RationalCubicCurve2d } from 'curvy/curve'

// Smoothstep — y'(0) = y'(1) = 0, y''(0) = 6, y''(1) = -6.
const smoothstep = RationalCubicCurve2d.fromSlopesAndCurvatures(0, 0, 6, -6)

// Linear — y(t) = t. Special-cased from the degenerate constraint system.
const linear = RationalCubicCurve2d.fromSlopesAndCurvatures(1, 1, 0, 0)

// Asymmetric ease with a flat start.
const ease = RationalCubicCurve2d.fromSlopesAndCurvatures(0, 2, 2, 0.18)
```

Curvature inputs are the signed differential-geometric curvatures `κ = y''(x) / (1 + y'(x)²)^(3/2)` — the parameterization-invariant "bend" of the easing graph. Positive κ is concave-up. Because `x(t) = t` is pinned, parametric and Cartesian second derivatives agree, so the conversion at endpoints is simply `y''(0) = κ₀ · (1 + m₀²)^(3/2)` and `y''(1) = κ₁ · (1 + m₁²)^(3/2)`.

Under the hood the denominator polynomial is now quadratic (was linear under Gregory-Delbourgo), giving the six free parameters needed to exactly match six endpoint constraints. Solving for the denominator's Bernstein control values is a closed-form 2×2 linear system — no iteration or root finding.

**Monotonicity is no longer enforced at construction.** The previous `makeMonotonicEasing` returned `RationalCubicCurve2d<Increasing, Increasing>` so that `solveAtX` would narrow to `Solution.AtMostOne<number>`. `fromSlopesAndCurvatures` returns the unbranded `RationalCubicCurve2d` — callers who need the brand for narrowed inverse-solve returns should follow construction with `asIncreasing` / `asDecreasing` / `asMonotonic`, which run a rigorous Bernstein sign convexity check:

```ts
const ease = RationalCubicCurve2d.asIncreasing(
  RationalCubicCurve2d.fromSlopesAndCurvatures(0.5, 1.5, 1, -1),
)
RationalCubicCurve2d.solveAtX(ease, 0.7) // → Solution.AtMostOne<number>
```

Construction throws when inputs are non-finite, when the constraint system is singular (other than the canonical linear-easing case), or when the resulting denominator vanishes on `[0, 1]`.
