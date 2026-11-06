---
'curvy': patch
---

**`Affine2d` invertibility ignores translation.** `isInvertible`, `asInvertible`, `inverse`, and `inverseUnsafe` judged singularity on the whole 3x3 homogeneous matrix, so a translation counted toward the scale of the test and a well-conditioned transform far from the origin read as singular: a `1e-3` scale translated by `1000` had no inverse. The test now runs on the 2x2 linear part alone, and the inverse is built as `[L^-1 | -L^-1 * t]`.
