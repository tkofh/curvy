---
'curvy': major
---

**Precision is now a property of operations, not values.** Removed the implicit `round()` from constructors and operation results across `Vector2`/`3`/`4`, `Matrix2x2`/`3x3`/`4x4`, the `Linear`/`Quadratic`/`Cubic` polynomial types, and `Interval`. Previously every value was snapped to an 8-decimal grid on construction; values are now stored as exact IEEE doubles. This is a breaking change for code that relied on strict equality (`===`, `toBe`) on computed results — comparisons must now be approximate.

New APIs for explicit precision:

- **`equals(a, b, eps?)`** on each value type (`Vector2`, `Vector3`, `Vector4`, `Matrix2x2`, `Matrix3x3`, `Matrix4x4`, `LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial`, `Interval`), in both data-first and data-last forms. Defaults to a per-component absolute tolerance of `EPSILON = 1e-10`.
- **`epsEquals(a, b, eps?)`** in `curvy/utils` — approximate equality for raw numbers.
- **`clampToZero(value, eps)`** in `curvy/utils` — snaps near-zero values to exactly zero, useful for stable sign tests.
- **`EPSILON`** constant in `curvy/utils`.

The cubic root finder still clamps its discriminant to zero internally to keep double/triple-root cubics on the correct branch — now via explicit `clampToZero(disc, 1e-12)` rather than the previous implicit `round(disc, 12)`.

`round()` itself remains exported from `curvy/utils` for explicit egress snapping (e.g. for SVG output, where you want a fixed display precision).

Performance: removing constructor-level rounding makes a realistic workflow (build a 4-segment Bezier path, sample 1000 points) about **2× faster**; `Matrix4x4.make` is **~17× faster**; `CubicCurve2d.length` is **~1.8× faster**.
