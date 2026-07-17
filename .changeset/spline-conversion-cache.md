---
'curvy': patch
---

The Bézier basis-conversion routine that backs `Cardinal2d.toBezier`, `Hermite2d.toBezier`, and `Basis2d.toBezier` now caches the combined conversion matrix (`M_bezier^-1 * M_source`) per source-matrix instance via a `WeakMap`, replacing a per-call run of Cramer's rule with a single matrix-vector product per axis per quad. The per-tension memoization of the cardinal characteristic matrix lives in `Characteristic.cubicCardinal` (see the characteristic-module changeset), so repeated `Cardinal2d.toBezier` calls on splines that share a tension hit the cache instead of constructing a fresh matrix each time.

No API change. **`Cardinal2d.toBezier` is ~85x faster** (~9k -> ~800k ops/sec across tensions). The same caching applies to every other non-Bézier spline type's `toBezier` path.
