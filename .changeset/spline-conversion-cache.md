---
'curvy': patch
---

`Bezier2d.fromSpline` now caches the combined conversion matrix (`M_bezier⁻¹ · M_source`) per source-matrix instance via a `WeakMap`, replacing a per-call run of Cramer's rule with a single matrix-vector product per axis per quad. `Cardinal.characteristic(scale)` also memoizes its result by scale value, so repeated `Cardinal.toBezier(p, customScale)` calls hit the cache instead of constructing a fresh matrix each time.

No API change. **`Cardinal.toBezier` is ~85× faster** (~9k → ~800k ops/sec for both default and custom scales). The same caching applies transparently to any other non-Bezier spline type's `toBezier` path.
