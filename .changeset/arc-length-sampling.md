---
'curvy': minor
---

Added **`CubicPath2d.solveByDistance(path, s): Vector2`** for sampling a path by normalized arc length (`s ∈ [0, 1]`).

Unlike `solve`, which is parameterized by curve `u`, `solveByDistance` returns points at constant speed along the path — `s = 0.5` is the actual arc-length midpoint regardless of how the underlying parameterization stretches. This is the primitive most motion-design and animation use cases actually want from a curve library.

Available in both data-first and data-last forms. Internally caches cumulative segment lengths by path identity (paths are immutable), so repeated calls on the same path skip the length-table rebuild. Within each segment, the local parameter is found via Newton's method on the curve's analytic derivative, with bracket-clamped fallback to bisection for cusps and pathological convergence.
