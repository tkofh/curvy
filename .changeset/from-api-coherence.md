---
'curvy': major
---

Sweep the `from*` constructor surface for naming coherence. The library accumulated several inconsistencies organically; v2 lands one rule per verb: `make` is the primary variadic constructor, `fromArray` is its array form, `fromXxx` is for genuinely-from-X semantic constructors named for what their inputs represent.

**Renames (curve modules):** `LinearCurve2d.fromPoints`, `QuadraticCurve2d.fromPoints`, `CubicCurve2d.fromPoints` → `fromCoefficients`. The old name was a misnomer — the function takes `Vector2`s but stores them as polynomial coefficient bundles, not as points on the curve. The new name is honest about that.

```ts
// before
CubicCurve2d.fromPoints(c0, c1, c2, c3) // Vector2s = polynomial coefficients
// after
CubicCurve2d.fromCoefficients(c0, c1, c2, c3)
```

**Renames (path modules):** `LinearPath2d`, `QuadraticPath2d`, `CubicPath2d` switch from `fromCurves` / `fromCurveArray` to `make` / `fromArray`, matching every spline module's `make` + `fromArray` convention.

```ts
// before
CubicPath2d.fromCurves(c0, c1)
CubicPath2d.fromCurveArray([c0, c1])
// after
CubicPath2d.make(c0, c1)
CubicPath2d.fromArray([c0, c1])
```

**Removed (Bézier conversion primitive):** `Bezier2d.fromSpline` is now package-private. Its only callers were the other splines' own `toBezier` methods, and SVG path serialization (which now lives in core, not a separate package). End users should reach for `Cardinal2d.toBezier`, `Hermite2d.toBezier`, or `Basis2d.toBezier` rather than constructing a basis-conversion call by hand.

**New (curve modules):** `LinearCurve2d.fromEndpoints`, `QuadraticCurve2d.fromBezierPoints`, `CubicCurve2d.fromBezierPoints` — closed-form Bernstein-basis to monomial conversion. Constructs a single curve from real Bézier control points without the round-trip through `Bezier2d` + `toPath`. For cubics, `p0` and `p3` are the curve's endpoints and `p1`, `p2` are off-curve control handles; for quadratics, `p1` is the single control handle. The linear case has no off-curve control points (it's just the two endpoints), so it gets the more discoverable `fromEndpoints` name.

```ts
const c = CubicCurve2d.fromBezierPoints(
  Vector2.make(0, 0),
  Vector2.make(1, 0),
  Vector2.make(1, 1),
  Vector2.make(0, 1),
)
```

**New (polynomial modules):** `QuadraticPolynomial.fromPoints` and `CubicPolynomial.fromPoints` — Lagrange interpolation through 3 and 4 `(x, y)` points, completing the symmetry with `LinearPolynomial.fromPoints` (which already existed). Implementation uses Newton's divided differences collected to monomial form. The input `x` values must be distinct.

```ts
// y = x² + 2x + 3
const p = QuadraticPolynomial.fromPoints(
  Vector2.make(-1, 2),
  Vector2.make(0, 3),
  Vector2.make(1, 6),
)
```

**Renamed (matrix module):** `Matrix3x3.matrix3x3` → `Matrix3x3.make`. The `Matrix2x2` and `Matrix4x4` modules already used `make`; only `Matrix3x3` had the type-name-as-constructor variant, breaking symmetry across the matrix family.
