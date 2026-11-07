---
'curvy': minor
---

**Polynomials, curves, and paths carry type-level trait brands, which narrow solver return types and enable axis inversion with `solveAtX` and `solveAtY`.**

A brand lives only in a type parameter, so the runtime value is identical with or without it. Each trait parameter defaults to `unknown`, and 1.x annotations such as `CubicPolynomial` or `CubicPath2d` compile unchanged.

- **Polynomials** carry `Monotonic`, `Increasing`, or `Decreasing`, reachable as namespace types such as `CubicPolynomial.Monotonic`. `isMonotonic` and its siblings narrow the type, and `asMonotonic` and its siblings throw when the check fails. The quadratic and cubic forms take an optional `Interval`. A `Monotonic` polynomial's `solveInverse` returns at most one root.
- **Curves** carry the same brands per axis, as `CubicCurve2d<XTraits, YTraits>`. Per-axis refiners (`isMonotonicX`, `isIncreasingY`, ...) check one axis, and the combined ones (`isMonotonic`, `asIncreasing`, ...) check both.
- **Linear, quadratic, and cubic paths** carry `Continuous` and the per-axis `MonotonicX`, `IncreasingX`, `DecreasingX` and y counterparts, each with an `is*` refiner and an `as*` assertion.

`solveAtX(c, x)` returns the y values where a curve crosses `x` for `t in [0, 1]`, and `solveAtY` swaps the axes. A `Monotonic` axis narrows the result to `Solution.AtMostOne`. The path versions require the brand and return `Solution.none` outside the path's range.

```ts
const easing = CubicCurve2d.fromBezierPoints(
  Vector2.make(0, 0),
  Vector2.make(0.42, 0),
  Vector2.make(0.58, 1),
  Vector2.make(1, 1),
)
CubicCurve2d.solveAtX(easing, 0.5) // Solution.AtMostThree<number>
if (CubicCurve2d.isMonotonicX(easing)) {
  CubicCurve2d.solveAtX(easing, 0.5) // Solution.AtMostOne<number>
}

const path = CubicPath2d.fromArray([easing]).pipe(CubicPath2d.asMonotonicX)
CubicPath2d.solveAtX(path, 0.3) // Solution.AtMostOne<number>
```

The same paths gain `reverse`, which traces the path end to start and drops its brands, and `appendContinuous(p, c)`, which keeps `Continuous` and throws when `c` does not start where the path ends. The matching curves gain `reverse`, which swaps each axis's `Increasing` and `Decreasing` brands, and polynomials gain `reflectDomain`, `q(u) = p(1 - u)`.
