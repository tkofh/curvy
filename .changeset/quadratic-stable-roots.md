---
'curvy': patch
---

**Quadratic root finding is cancellation-stable; discriminant sign tests are now relative.**

`QuadraticPolynomial.solveInverse` previously used the textbook formula `(-c1 ± √disc) / (2·c2)` for both roots. When `c1² ≫ |c2·c|`, one of the two numerators subtracts nearly equal quantities and cancels catastrophically — for `t² + 1e8·t + 1` the small root came out as `-7.45e-9` instead of `-1e-8`, a 25% error. The solver now computes the larger-magnitude root with matching signs (no cancellation) and recovers the other from the root product `c/c2` (Vieta), which only multiplies and divides. Residual on that example drops from `0.25` to one ulp.

Both discriminant sign tests also move from absolute to relative thresholds. The quadratic discriminant `c1² - 4·c2·c` and the depressed cubic's `-(4p³ + 27q²)` are each a cancellation between two computed terms, so their sign near zero is noise; each is now clamped to zero within `RELATIVE_TOLERANCE` × the larger term's magnitude (the cubic previously used an absolute `1e-12` clamp). Root-count dispatch is therefore invariant under scaling of the coefficients, and a tangency query that under- or overshoots the touch point by an ulp reports the double root instead of no solution — `solveInverse((t-1)², -Number.EPSILON)` now returns `t = 1`.
