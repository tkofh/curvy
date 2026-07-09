---
'curvy': patch
---

**Matrix singularity checks are now relative to the matrix's own scale.**

`Matrix3x3` and `Matrix4x4` `isInvertible` / `asInvertible` / `inverse` / `inverseUnsafe` (and `Affine2d`'s, which delegate) previously compared the determinant against the absolute `EPSILON`. Determinants scale with the matrix — a 3×3 scaled uniformly by `s` has its determinant scaled by `s³` — so an absolute threshold misjudges in both directions: `diag(1e-8, 1e-8, 1)` was called singular despite being perfectly conditioned (its inverse is exactly `diag(1e8, 1e8, 1)`), while a large matrix with nearly dependent rows could pass with a determinant that is pure rounding noise.

The determinant is now compared against `RELATIVE_TOLERANCE` × Hadamard's bound (the product of the row norms, which the absolute determinant can never exceed). The ratio of determinant to Hadamard bound is a scale-free measure of row independence — 1 for orthogonal rows, 0 for parallel ones — so classification is invariant under uniform scaling of the matrix.

Behavioral changes: uniformly scaled matrices of any magnitude now correctly classify as invertible; near-singular matrices with large entries now correctly classify as singular. `Matrix2x2.solveSystem`'s division guard is unchanged — it is a construction guard against exact division by zero, not a semantic predicate.
