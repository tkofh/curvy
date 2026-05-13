---
'curvy': minor
---

**Rational cubic curves, paths, and splines.** A new `RationalCubicCurve2d` lives in `curvy/curve`, alongside the existing polynomial cubic. It stores the curve as three monomial polynomials `x(t)`, `y(t)`, `w(t)` and evaluates as `(x(t)/w(t), y(t)/w(t))` — the projection from homogeneous coordinates back to the plane. With uniform weights the curve degenerates to a polynomial cubic.

```ts
import { RationalCubicCurve2d } from 'curvy/curve'
import { Vector2 } from 'curvy/vector'

// Four weighted Bézier control points; the matrix-based constructor
// lifts them to homogeneous (w·x, w·y, w) and runs the same characteristic
// matrix the polynomial pipeline uses, just on three channels.
const c = RationalCubicCurve2d.fromBezierPoints(
  Vector2.makeWeighted(0, 0, 1),
  Vector2.makeWeighted(1, 2, 5),
  Vector2.makeWeighted(2, 2, 5),
  Vector2.makeWeighted(3, 0, 1),
)
RationalCubicCurve2d.solve(c, 0.5) // → Vector2
```

A matching path type (`RationalCubicPath2d` in `curvy/path`) and spline type (`RationalBezier2d` in `curvy/splines`) follow the same shape as their polynomial counterparts, with `solve`, `solveAtX`, `solveAtY`, and the standard pipeable API.

**Per-axis monotonicity traits live on the curve, not the polynomials.** Unlike `CubicCurve2d` where the trait brand flows through to the underlying polynomial, rational traits are properties of the projected rational functions `x(t)/w(t)` and `y(t)/w(t)` — not of any individual polynomial. The brand therefore lives on the curve itself via a phantom property, and `RationalCubicCurve2d<XTraits, YTraits>` carries `Increasing` / `Decreasing` / `Monotonic` exactly like the polynomial curve does.

**`makeMonotonicEasing(startSlope, endSlope)`.** A Gregory-Delbourgo style constructor for a guaranteed-monotone rational cubic easing curve. Interpolates `(0, 0)` and `(1, 1)` with the given endpoint slopes, pins `x(t) = t`, and returns a curve branded `<Increasing, Increasing>` so `solveAtX` narrows to `Solution.AtMostOne<number>` without runtime checking. Smoothstep falls out from `(0, 0)` and linear easing from `(1, 1)`.

```ts
const ease = RationalCubicCurve2d.makeMonotonicEasing(0.5, 1.5)
const result = RationalCubicCurve2d.solveAtX(ease, 0.5)
// result: Solution.AtMostOne<number> — narrowed by the Increasing brand
```

Monotonicity is verified rigorously at construction by computing the derivative numerator as a cubic in `t` and checking it doesn't change sign on `(0, 1)`. Construction throws when the slope pair can't be made monotonic under the default `α = m₀ + 1`, `β = m₁ + 1` heuristic — useful operating range is roughly `m₀, m₁ ∈ [0, 2]` with `m₀ + m₁ ≲ 3`.
