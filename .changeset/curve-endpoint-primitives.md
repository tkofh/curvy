---
'curvy': minor
---

**Curve endpoint primitives.** Each `Curve2d` module gains closed-form geometry primitives that lift the per-degree formulas previously inlined in path code onto the curve modules themselves:

- `startPoint(c)` and `endPoint(c)` — exact-at-`t=0` and exact-at-`t=1` evaluations. Added to `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`, and `RationalCubicCurve2d`. For the rational case the projection is `(Σxᵢ / Σwᵢ, Σyᵢ / Σwᵢ)`; for the polynomial cases it's just `c.x.c0` and a sum of coefficients.
- `xRange(c)` and `yRange(c)` — the tight `[min, max]` of each axis over the unit interval, derived from the polynomial-level `unitRange`. Added to `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`. The rational case is intentionally deferred because a tight rational projection requires a tolerance.
- `toPathDataSegment(c)` — emits a single SVG path-data drawing command (`L …`, `Q …`, `C …`) for one segment, without a leading `M`. Added to `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`. Path-level `toPathData` continues to handle move-insertion based on continuity.

These are pure additions — no existing API changed.
