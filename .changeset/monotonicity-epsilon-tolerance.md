---
'curvy': patch
---

**Monotonicity classification is now tolerant of rounding noise in the derivative; `Monotonicity.fromDerivativeRange` and `RELATIVE_TOLERANCE` added.**

`CubicPolynomial.monotonicity` and `QuadraticPolynomial.monotonicity` previously classified by _root location_: any derivative root strictly inside the open interval meant `None`. Root locations are ill-conditioned exactly where this matters — a root computed from rounded coefficients can land an ulp to either side of an interval boundary. Cardinal paths built with `withInterpolatedEndpoints` hit this systematically: the pinned endpoint constructs a zero end-tangent, the Hermite→monomial collection cancels `x'(1)` to `0 ± 2` ulps, and the derivative root lands at `1 ∓ ulp`. Whether `asMonotonicX` passed or threw was decided by the inputs' last bits.

Both classifiers now judge the derivative's _values_, which are well-conditioned where its roots are not. The derivative's exact range over the interval (endpoint values, plus the vertex value for the cubic's quadratic derivative when the vertex lies inside) feeds `Monotonicity.fromDerivativeRange(min, max, tolerance?)`: each range bound sets its sign-coverage bit only when it exceeds the tolerance, which defaults to the new `RELATIVE_TOLERANCE` (`1e-12`, exported from `curvy/number`) scaled by the larger bound magnitude. Classification is therefore invariant under scaling of the input data, and values indistinguishable from accumulated rounding noise can no longer decide a sign question.

Behavioral changes, all in the direction of the mathematically correct answer:

- Strictly-x-monotonic pinned-endpoint Cardinal paths (e.g. `[[0,10],[1,0.02],[2,0.02]]` via `withInterpolatedEndpoints`) no longer fail `asMonotonicX` on float-ulp parity.
- A derivative that touches zero at an interior double root without crossing — `t³` on `[-1, 1]` — now correctly classifies `Increasing` (previously `None`).
- A derivative excursion past zero at ulp scale classifies by the dominant sign instead of `None`.

Genuine reversals are unaffected: a real crossing exceeds the tolerance band by many orders of magnitude (the band sits ~4,500× above per-operation IEEE rounding noise and far below any geometrically meaningful feature).

The refined trait brands (`Monotonic`, `Increasing`, `Decreasing`) accordingly carry an honest numerical contract: the derivative takes no opposite-sign values exceeding `RELATIVE_TOLERANCE × max|derivative|` on the interval, so `solveInverse` is unique to within matching precision.
