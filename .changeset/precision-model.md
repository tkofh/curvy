---
'curvy': major
---

**Precision is now a property of operations, not values: constructions stay exact, and predicates widen their tolerance with the magnitude of their inputs.** The full model — which checks are exact, which are tolerant, and how to choose tolerances — is documented in `PRECISION.md` at the repo root.

**Exact IEEE values.** Removed the implicit `round()` from constructors and operation results across `Vector2`/`3`/`4`, `Matrix2x2`/`3x3`/`4x4`, the `Linear`/`Quadratic`/`Cubic` polynomial types, and `Interval`. Previously every value was snapped to an 8-decimal grid on construction; values are now stored as exact IEEE doubles. This is a breaking change for code that relied on strict equality (`===`, `toBe`) on computed results — comparisons must now be approximate. The `PRECISION` constant that parameterized the old grid is removed from `curvy/utils` along with the rounding itself.

New APIs for explicit equality:

- **`equals(a, b)`** on each value type (`Vector2`, `Vector3`, `Vector4`, `Matrix2x2`, `Matrix3x3`, `Matrix4x4`, `LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial`, `Interval`), in both data-first and data-last forms. Uses a per-component absolute tolerance of `EPSILON = 1e-10`. For non-default tolerance, compose `epsEquals` directly (`(a, b) => epsEquals(a.x, b.x, 1e-6) && ...`).
- **`epsEquals(a, b, eps?)`** in `curvy/number` — approximate equality for raw numbers, with optional tolerance override. Unchanged, and the raw absolute tool.
- **`clampToZero(value, eps)`** in `curvy/number` — snaps near-zero values to exactly zero, useful for stable sign tests.
- **`EPSILON`** constant in `curvy/number`.

`round()` remains exported from `curvy/number` for explicit egress snapping (e.g. for SVG output, where you want a fixed display precision).

**Scale-aware tolerance policy.** Every predicate that asks "are these the same value?" or "is this sign real?" now widens its tolerance with the magnitude of its inputs, so classification is invariant under uniform scaling of the data.

- **`coincident(a, b, absolute?, relative?)` in `curvy/number`** is the policy answer to point/value identity: true when `|a - b| <= absolute + relative * max(|a|, |b|)`, defaulting to `absolute = EPSILON` (`1e-10`) and `relative = RELATIVE_TOLERANCE` (`1e-12`, newly exported). The tolerance parameters are positional, mirroring `epsEquals(a, b, eps)`. The relative term covers rounding noise, which grows with magnitude (ulps near `1e9` are ~`1.2e-7`, far outside any fixed band); the absolute term covers the neighborhood of zero, where relative comparison degenerates. Migrated call sites: `Path2d` continuity and knot checks, `toPathData` move-insertion, `solveAtX`/`solveAtY` snapping and bracketing, `equals` on every vector/matrix/polynomial/interval type, `Affine2d.fromMatrix`'s bottom-row test, and `solveByDistance`'s Newton convergence (now relative to segment length — results are invariant under uniform scaling of the path, and long segments no longer burn all 16 iterations). `coincident` is deliberately not transitive; pairwise semantics are intentional.

- **Monotonicity classifies by derivative values, not root locations.** Root locations are ill-conditioned exactly where classification matters — a root computed from rounded coefficients lands an ulp to either side of the interval boundary. `QuadraticPolynomial.monotonicity` and `CubicPolynomial.monotonicity` now feed the derivative's exact range into the new `Monotonicity.fromDerivativeRange(min, max, tolerance?)`: a sign only counts when it exceeds `RELATIVE_TOLERANCE` scaled by the larger bound. Pinned-endpoint Cardinal paths no longer fail `asMonotonicX` on float-ulp parity; `t^3` on `[-1, 1]` correctly classifies `Increasing` (previously `None`); genuine reversals are unaffected. The `Monotonic`/`Increasing`/`Decreasing` brands accordingly carry an honest numerical contract.

- **Matrix singularity is scale-relative.** `isInvertible` / `asInvertible` / `inverse` on `Matrix3x3`, `Matrix4x4`, and `Affine2d` compare the determinant against `RELATIVE_TOLERANCE` times Hadamard's bound (the product of row norms) instead of an absolute epsilon. `diag(1e-8, 1e-8, 1)` is correctly non-singular; a large matrix with nearly dependent rows is correctly singular.

**Robust root finding.** The inverse solvers were latent-buggy on degenerate-degree inputs and lossy when roots cluster; both are fixed.

- **Degenerate degrees no longer divide by zero.** `QuadraticPolynomial.solveInverse` now handles the `c2 = 0` case (degenerate quadratic — defers to linear) instead of dividing by zero. `CubicPolynomial.solveInverse` had a similar fallback that was forwarding `0` as the y-value instead of the actual argument; now it forwards correctly. Both bugs were latent because `solveInverse` was rarely exercised on degenerate-degree polynomials before `solveAtX` / `solveAtY` started routing through them.

- **Quadratic root finding is cancellation-stable.** `QuadraticPolynomial.solveInverse` computes the larger-magnitude root with matching signs and recovers the other from the root product (Vieta) — for `t^2 + 1e8*t + 1` the small root's error drops from 25% to one ulp. Quadratic and cubic discriminant sign tests move from absolute to relative clamps, so root-count dispatch is scale-invariant and `solveInverse((t-1)^2, -Number.EPSILON)` reports the double root.

- **Cubic roots are Newton-refined; `Solution.clipApprox` added.** `CubicPolynomial.solveInverse` follows its closed-form step with up to four Newton iterations, recovering the ~3 digits the trig branch loses when roots cluster. The cubic root finder still clamps its discriminant to zero internally via explicit `clampToZero(disc, 1e-12)` (previously the implicit `round(disc, 12)`) to keep double/triple-root cubics on the correct branch. The remaining ulp-level boundary overshoot is handled by `Solution.clipApprox(s, interval)` — like `Solution.clip` but treating values within `EPSILON` of a boundary as in-range, intended for post-processing solver output. The quadratic, cubic, and rational `solveAtX` / `solveAtY` implementations use it internally (the linear inverse is a single division with no drift to absorb, so it keeps the strict clip); this fixes rational cubics whose `t = 1` root drifted past the strict clip.

- **The uniform B-spline characteristic matrix uses the exact `1/6`.** One entry was `roundDown(1/6)`, a relic of the v1 rounding model; under exact-IEEE values it pushed the c0 row's partition-of-unity error to `6.7e-9`. Coincident control points now reproduce their point to within an ulp.

**Performance.** Removing constructor-level rounding makes a realistic workflow (build a 4-segment Bezier path, sample 1000 points) about **2x faster**; `Matrix4x4.make` is **~17x faster**; `CubicCurve2d.length` is **~1.8x faster**.
