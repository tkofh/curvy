---
'curvy': minor
---

**Rational cubic curves, paths, and splines draw circles and conics exactly.** Each control point carries a weight, and the curve evaluates as `(x(t)/w(t), y(t)/w(t))`. Uniform weights give back the polynomial cubic.

```ts
const c = RationalCubicCurve2d.fromBezierPoints(
  Vector2.makeWeighted(0, 0, 1),
  Vector2.makeWeighted(1, 2, 5),
  Vector2.makeWeighted(2, 2, 5),
  Vector2.makeWeighted(3, 0, 1),
)
RationalCubicCurve2d.solve(c, 0.5) // Vector2(1.5, 1.875)
```

- `RationalCubicCurve2d` (`curvy/curve`) also builds from three polynomials with `fromPolynomials`. It has `solve`, `startPoint`, `endPoint`, `solveAtX`, `solveAtY`, `subdivide`, `transform`, and per-axis monotonicity refiners such as `isIncreasingX` and `asMonotonic`.
- `RationalCubicPath2d` (`curvy/path`) joins curves with `fromArray` and `append`, and has `solve` and `transform`. Its `solve` clamps a `u` within `EPSILON` of `[0, 1]` and throws beyond that, like the other paths.
- `RationalBezier2d` (`curvy/splines`) is the weighted Bézier spline, lowered by `toPath`. `fromBezier` lifts a `Bezier2d` with unit weights, and `Bezier2d.fromRational` converts back, returning `Solution.none` unless the weights are uniform.
- `Vector2.Weighted` is the control point, made with `Vector2.makeWeighted(x, y, w)` or `withWeight`. Weights must be positive and finite, and vector arithmetic rejects weighted points.

**Approximation.** `RationalCubicCurve2d.approximateAsCubicCurves` and `RationalCubicPath2d.approximateAsCubicPath` rebuild a rational shape from polynomial cubics, keeping every point of each within `tolerance` of the other. [PRECISION.md](https://github.com/tkofh/curvy/blob/main/PRECISION.md) states the guarantee under "Certified approximations". `CubicPolynomial.subdivide(p, t)` splits one polynomial at `t`.

**Easing.** Two constructors build a `y(x)` curve from `(0, 0)` to `(1, 1)`. `RationalCubicCurve2d.fromBezierPoints(p1, p2)` takes only the two handles, like CSS `cubic-bezier(x1, y1, x2, y2)` with a weight on each. `fromSlopesAndCurvatures(m0, m1, k0, k1)` takes end slopes and signed curvatures (positive bends upward), and throws for inputs it cannot fit. Neither checks monotonicity. `asIncreasing` does, and narrows `solveAtX` to at most one answer:

```ts
const ease = RationalCubicCurve2d.asIncreasing(
  RationalCubicCurve2d.fromSlopesAndCurvatures(0.5, 1.5, 0.5, -0.5),
)
RationalCubicCurve2d.solveAtX(ease, 0.7) // Solution.One(0.5721279817520788)
```
