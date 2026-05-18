---
'curvy': patch
---

**Path code now delegates segment geometry to the curve modules.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` internal implementations (`toPathData`, `isContinuous`, monotonicity refiners, `solveAtX`/`solveAtY`) used to inline per-degree formulas like `c.x.c0 + c.x.c1 + c.x.c2 + c.x.c3` to recover segment endpoints and SVG control points. They now call `startPoint`/`endPoint`/`toPathDataSegment` on the curve module instead.

Behavior is preserved exactly — the same min/max-of-endpoints bracketing semantics are used in `solveAtX`/`solveAtY`, not the curves' true `xRange`/`yRange`. Pure internal refactor with no public-API or behavior change. Sets up a follow-up extraction of a single generic `Path2d<C>` over a common `Curve2d` interface.
