---
'curvy': minor
---

Added **`Bezier2d.subdivide(b, u): [Bezier2d, Bezier2d]`** for splitting a multi-segment cubic Bezier at a global parameter `u ∈ (0, 1)` via de Casteljau's algorithm. The two halves together trace the same curve as the input — the left covers `[0, u]`, the right covers `[u, 1]`.

Available in both data-first and data-last forms. Useful for adaptive flattening, intersection testing, trimming, and chunking a curve across discrete buckets (responsive viewport breakpoints, animation segments, etc.). Splits at exact segment boundaries are detected and handled by slicing rather than running de Casteljau.
