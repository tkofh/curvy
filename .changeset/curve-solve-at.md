---
'curvy': minor
---

Add `solveAtX` and `solveAtY` to `LinearCurve2d`, `QuadraticCurve2d`, and `CubicCurve2d`. Where `solve(c, t)` evaluates the curve at a parameter `t` and returns `(x, y)`, `solveAt{X,Y}(c, value)` looks at the curve as a relation between its two axes and asks "what's the orthogonal coordinate when this axis equals the given value?"

Results are filtered to the curve's parameter domain `[0, 1]` — only intersections with the actual drawn curve are returned, not roots of the underlying polynomial that lie outside the curve's range. Returned values are in t-ascending order.

| Curve              | Plain return  | `<Monotonic, _>` (`solveAtX`) / `<_, Monotonic>` (`solveAtY`)                |
| ------------------ | ------------- | ---------------------------------------------------------------------------- |
| `LinearCurve2d`    | `ZeroToOne`   | `ZeroToOne` (always — a line crosses any axis-line at most once in `[0, 1]`) |
| `QuadraticCurve2d` | `ZeroToTwo`   | `ZeroToOne`                                                                  |
| `CubicCurve2d`     | `ZeroToThree` | `ZeroToOne`                                                                  |

```ts
const easing = CubicCurve2d.fromBezierPoints(
  Vector2.make(0, 0),
  Vector2.make(0.42, 0),
  Vector2.make(0.58, 1),
  Vector2.make(1, 1),
)

if (CubicCurve2d.isMonotonic(easing)) {
  // both axes monotonic — solveAtX returns ZeroToOne
  const [y] = CubicCurve2d.solveAtX(easing, 0.5)
}
```

This is the "function-of-x" / easing-curve use case the trait system was designed around: when both axes are monotonic, the curve becomes invertible in either direction and the type system reflects that.

**Bug fixes shipped alongside:** `QuadraticPolynomial.solveInverse` now correctly handles the `c2 = 0` case (degenerate quadratic — defers to linear) instead of dividing by zero. `CubicPolynomial.solveInverse` had a similar fallback that was forwarding `0` as the y-value instead of the actual argument; now forwards correctly. Both bugs were latent because `solveInverse` was rarely exercised on degenerate-degree polynomials before `solveAt{X,Y}` started routing through them.
