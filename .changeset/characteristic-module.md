---
'curvy': major
---

**New `curvy/characteristic` module.** The characteristic matrices that identify each cubic spline family now live in a shared module rather than being scattered across the spline modules.

```ts
import * as Characteristic from 'curvy/characteristic'

Characteristic.cubicBezier // Matrix4x4 — was Bezier2d.characteristic
Characteristic.cubicHermite // Matrix4x4 — was Hermite2d.characteristic
Characteristic.cubicBasisSpline // Matrix4x4 — was Basis2d.characteristic
Characteristic.cubicCardinal // (tension: number) => Matrix4x4 — was Cardinal2d.characteristic
Characteristic.cubicCatmullRom // Matrix4x4 — was Cardinal2d.catRomCharacteristic
```

**The per-spline `characteristic` exports are removed.** Update imports to pull from the new module. The runtime values are unchanged; only the import path moves. `Cardinal2d.catRomCharacteristic` similarly moves to `Characteristic.cubicCatmullRom`.

**New `Characteristic.apply` helper.** Applies a characteristic matrix to N channels of control values, producing N cubic polynomials in monomial form. This is the operation Freya Holmér describes in _The Continuity of Splines_ — the matrix IS the spline, and `apply` is the canonical way to combine it with control points to produce a polynomial.

```ts
// Polynomial 2D spline: two channels (x, y)
const [x, y] = Characteristic.apply(
  Characteristic.cubicBezier,
  Vector4.make(p0.x, p1.x, p2.x, p3.x),
  Vector4.make(p0.y, p1.y, p2.y, p3.y),
)

// Rational 2D spline: same matrix, three channels (x, y, w)
const [x, y, w] = Characteristic.apply(
  Characteristic.cubicBezier,
  Vector4.make(p0.x * p0.weight, p1.x * p1.weight, p2.x * p2.weight, p3.x * p3.weight),
  Vector4.make(p0.y * p0.weight, p1.y * p1.weight, p2.y * p2.weight, p3.y * p3.weight),
  Vector4.make(p0.weight, p1.weight, p2.weight, p3.weight),
)
```

The polynomial pipeline (`CubicCurve2d.fromBezierPoints`, `splines/util.ts → toCurves`) and the rational pipeline (`RationalCubicCurve2d.fromBezierPoints`) both flow through `apply` now — the unified entry point makes the spline-family-as-matrix story visible at the type level.

**Cardinal cache moved.** The per-tension memoization that used to live in `Cardinal2d` now lives inside `Characteristic.cubicCardinal`. Behavior unchanged.
