---
'curvy': major
---

**Precision is now a property of operations, not values.** Removed the implicit `round()` from constructors and operation results across `Vector2`/`3`/`4`, `Matrix2x2`/`3x3`/`4x4`, the `Linear`/`Quadratic`/`Cubic` polynomial types, and `Interval`. Previously every value was snapped to an 8-decimal grid on construction; values are now stored as exact IEEE doubles. This is a breaking change for code that relied on strict equality (`===`, `toBe`) on computed results — comparisons must now be approximate. The `PRECISION` constant that parameterized the old grid is removed from `curvy/utils` along with the rounding itself.

New APIs for explicit precision:

- **`equals(a, b)`** on each value type (`Vector2`, `Vector3`, `Vector4`, `Matrix2x2`, `Matrix3x3`, `Matrix4x4`, `LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial`, `Interval`), in both data-first and data-last forms. Uses a per-component absolute tolerance of `EPSILON = 1e-10`. For non-default tolerance, compose `epsEquals` directly (`(a, b) => epsEquals(a.x, b.x, 1e-6) && ...`).
- **`epsEquals(a, b, eps?)`** in `curvy/number` — approximate equality for raw numbers, with optional tolerance override.
- **`clampToZero(value, eps)`** in `curvy/number` — snaps near-zero values to exactly zero, useful for stable sign tests.
- **`EPSILON`** constant in `curvy/number`.

The cubic root finder still clamps its discriminant to zero internally to keep double/triple-root cubics on the correct branch — now via explicit `clampToZero(disc, 1e-12)` rather than the previous implicit `round(disc, 12)`.

`round()` itself remains exported from `curvy/number` for explicit egress snapping (e.g. for SVG output, where you want a fixed display precision).

Performance: removing constructor-level rounding makes a realistic workflow (build a 4-segment Bezier path, sample 1000 points) about **2x faster**; `Matrix4x4.make` is **~17x faster**; `CubicCurve2d.length` is **~1.8x faster**.
