---
'curvy': minor
---

**`coincident` added to `curvy/number`; every identity comparison now widens with magnitude.**

`coincident(a, b, options?)` is the library's policy answer to "are these the same value?": true when `|a - b| <= absolute + relative * max(|a|, |b|)`, defaulting to `absolute = EPSILON` (1e-10, the modeling floor for order-~1 coordinates) and `relative = RELATIVE_TOLERANCE` (1e-12). The relative term covers rounding noise, which grows with magnitude — ulps near 1e9 are ~1.2e-7, far outside any fixed absolute band — while the absolute term covers the neighborhood of zero, where relative comparison degenerates. The band is strictly wider than the previous absolute check, so nothing formerly coincident becomes distinct; behavior only extends to large-coordinate data that was previously misjudged. `epsEquals` is unchanged and remains the raw absolute tool for normalized domains (curve parameter space) and caller-chosen bands.

Migrated to `coincident`:

- **Point coincidence** — `Path2d` continuity (`isContinuous`), `toPathData`'s move-command insertion, the per-axis knot-ordering bands behind `isIncreasingX`/`isDecreasingX`/`isIncreasingY`/`isDecreasingY`, and `solveAtX`/`solveAtY` knot snapping and segment bracketing. A Cardinal path with non-dyadic coordinates offset to 1e9 accumulates ~1.2e-7 of knot drift from storage rounding alone; it now correctly brands `Continuous`, while a genuine gap at the same magnitude is still rejected.
- **Value equality** — `equals` on `Vector2`/`Vector3`/`Vector4` (including `weightedEquals`), `Matrix2x2`/`Matrix3x3`/`Matrix4x4`, `LinearPolynomial`/`QuadraticPolynomial`/`CubicPolynomial`, `Interval.equals`/`aligned`, and `RationalBezier2d`'s uniform-weight test.
- **Structural checks** — `Affine2d.fromMatrix`'s bottom-row test scales its zero band with the magnitude of the matrix's other entries, so a transform with 1e8-scale terms tolerates proportional rounding residue in the projective slots while genuinely projective rows are rejected at any scale.

Also fixed under the same policy: `CubicPath2d.solveByDistance`'s Newton iteration now converges when the remaining arc-length error is small **relative to the segment length**. The previous absolute criterion (1e-10 in arc-length units) demanded unreachable precision on long segments — burning all 16 iterations every call — and exited a step early on very short ones; `solveByDistance` results are now invariant under uniform scaling of the path.

`coincident` is deliberately not transitive — chains of pairwise-coincident values can drift beyond the band. Pairwise semantics are intentional: path continuity checks each junction locally.
