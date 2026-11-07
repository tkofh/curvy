---
'curvy': major
---

**Several 1.x constructors and methods change name or shape.** Functions that took a variable number of arguments now take one array or a fixed argument list. Spreading a long array into a rest parameter throws a `RangeError` at the call site, and an array has no such limit.

| 1.0.9                                                                                                   | 2.0                                                                        |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `CubicCurve2d.fromPoints(c0, c1, c2, c3)` (also `LinearCurve2d`, `QuadraticCurve2d`)                    | `CubicCurve2d.fromCoefficients(c0, c1, c2, c3)`                            |
| `CubicPath2d.fromCurves(c0, c1)` or `fromCurveArray([c0, c1])` (also `LinearPath2d`, `QuadraticPath2d`) | `CubicPath2d.fromArray([c0, c1])`                                          |
| `Cardinal2d.make(p0, p1, p2)`                                                                           | `Cardinal2d.fromArray([p0, p1, p2], { alpha: 0 })` for the 1.x curve shape |
| `Basis2d.append(spline, p4, p5)` (also `prepend`, and both on `Cardinal2d`)                             | `Basis2d.append(spline, [p4, p5])`                                         |
| `Interval.fromMinMax(a, b, c)`                                                                          | `Interval.fromValues([a, b, c])`, or `Interval.fromMinMax(a, b)` for two   |
| `Matrix3x3.matrix3x3(m00, ..., m22)`                                                                    | `Matrix3x3.make(m00, ..., m22)`                                            |
| `Bezier2d.appendCurvatureMirrored`                                                                      | `Bezier2d.appendCurvatureAligned`                                          |
| `Vector2.unit` (also `Vector3`, `Vector4`)                                                              | `Vector2.one`                                                              |

The curve `fromPoints` took polynomial coefficients rather than points on the curve, and `fromCoefficients` names what it takes. `one` is the all-ones vector, and `Vector3.unitX`, `unitY`, and `unitZ` keep their names. The data-last `append` and `prepend` take the array too, as in `Basis2d.append([p4, p5])`. `Cardinal2d.fromArray` takes the spline options as an optional second argument, where `alpha: 0` keeps the 1.x uniform parameterization. `Interval.fromValues` throws on an empty array. `Hermite2d.append` and `prepend` keep their point-and-tangent pair.

**The old variadic calls throw.** TypeScript rejects them, and in untyped JavaScript `append` and `prepend` on `Basis2d` and `Cardinal2d` throw an `Error` when the points argument is not an array, as in `Basis2d.append(spline, p4, p5)`. `Interval.fromMinMax` throws when it gets other than two arguments.

**New constructors:**

- `CubicCurve2d.fromBezierPoints` and `QuadraticCurve2d.fromBezierPoints` build a curve from Bézier control points, and `LinearCurve2d.fromEndpoints` builds one from its endpoints.
- `QuadraticPolynomial.fromPoints` and `CubicPolynomial.fromPoints` fit a polynomial through three or four `(x, y)` points with distinct `x`, like the existing `LinearPolynomial.fromPoints`.
- Every spline has `fromTuples`, which takes `[x, y]` tuples, or `[x, y, weight]` for `RationalBezier2d`.

```ts
CubicCurve2d.fromBezierPoints(
  Vector2.make(0, 0),
  Vector2.make(1, 0),
  Vector2.make(1, 1),
  Vector2.make(0, 1),
)
Bezier2d.fromTuples([
  [0, 0],
  [1, 2],
  [3, 2],
  [4, 0],
])
```

[MIGRATION.md](https://github.com/tkofh/curvy/blob/main/MIGRATION.md) lists every renamed and removed export.
