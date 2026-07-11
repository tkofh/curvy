---
'curvy': minor
---

**Rational cubic curves, paths, and splines.** A new `RationalCubicCurve2d` lives in `curvy/curve`, alongside the existing polynomial cubic. It stores the curve as three monomial polynomials `x(t)`, `y(t)`, `w(t)` and evaluates as `(x(t)/w(t), y(t)/w(t))` — the projection from homogeneous coordinates back to the plane. With uniform weights the curve degenerates to a polynomial cubic.

```ts
import { RationalCubicCurve2d } from 'curvy/curve'
import { Vector2 } from 'curvy/vector'

// Four weighted Bézier control points; the matrix-based constructor
// lifts them to homogeneous (w*x, w*y, w) and runs the same characteristic
// matrix the polynomial pipeline uses, just on three channels.
const c = RationalCubicCurve2d.fromBezierPoints(
  Vector2.makeWeighted(0, 0, 1),
  Vector2.makeWeighted(1, 2, 5),
  Vector2.makeWeighted(2, 2, 5),
  Vector2.makeWeighted(3, 0, 1),
)
RationalCubicCurve2d.solve(c, 0.5) // -> Vector2
```

A matching path type (`RationalCubicPath2d` in `curvy/path`) and spline type (`RationalBezier2d` in `curvy/splines`) follow the same shape as their polynomial counterparts, with `solve`, `solveAtX`, `solveAtY`, and the standard pipeable API.

**Per-axis monotonicity traits live on the curve, not the polynomials.** Unlike `CubicCurve2d` where the trait brand flows through to the underlying polynomial, rational traits are properties of the projected rational functions `x(t)/w(t)` and `y(t)/w(t)` — not of any individual polynomial. The brand therefore lives on the curve itself via a phantom property, and `RationalCubicCurve2d<XTraits, YTraits>` carries `Increasing` / `Decreasing` / `Monotonic` exactly like the polynomial curve does.

**Weighted control points.** `Vector2.Weighted` is a structurally distinct branded type — a 2D point carrying a positive scalar weight — constructed via `Vector2.makeWeighted(x, y, w)` or `Vector2.withWeight(v, w)`, with `isWeighted`, `unweighted`, and `weightedEquals` alongside. The brand keeps weighted points out of plain vector arithmetic (`add`, `scale`, ...), where weighted operations are not well-defined.

**Conversions.** `RationalCubicCurve2d.fromPolynomials(x, y, w)` constructs a curve directly from the three monomial polynomials, and `subdivide(c, t)` splits a curve at `t in (0, 1)` into two rational cubics that together trace the original exactly. In the other direction, `Bezier2d.fromRational(r)` returns `Solution.AtMostOne<Bezier2d>` — `Solution.one` when the rational spline's weights are uniform (the curve is mathematically a polynomial Bézier), `Solution.none` otherwise, since a genuinely rational curve cannot be represented exactly by a polynomial one.
