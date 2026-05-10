---
'curvy': patch
---

The Bézier basis-conversion routine that backs `Cardinal2d.toBezier`, `Hermite2d.toBezier`, and `Basis2d.toBezier` now caches the combined conversion matrix (`M_bezier⁻¹ · M_source`) per source-matrix instance via a `WeakMap`, replacing a per-call run of Cramer's rule with a single matrix-vector product per axis per quad. `Cardinal2d.characteristic(scale)` also memoizes its result by scale value, so repeated `Cardinal2d.toBezier(p, customScale)` calls hit the cache instead of constructing a fresh matrix each time.

No API change. **`Cardinal2d.toBezier` is ~85× faster** (~9k → ~800k ops/sec for both default and custom scales). The same caching applies to every other non-Bézier spline type's `toBezier` path.
