---
'curvy': major
---

**A type-level trait system for polynomials, curves, and paths, and the axis-inversion operations it unlocks.** Traits are phantom brands carried in a generic type parameter — they exist only at the type level, the runtime value is unchanged. Refiners check the property at runtime and narrow the type accordingly; assertions throw on failure. Refining a curve or path as monotonic is what earns the narrowed `solveInverse` / `solveAtX` / `solveAtY` return shapes below.

**Three brands.** Exported from `curvy/polynomial`:

- `Monotonic` — strictly monotonic (excludes constant)
- `Increasing` — strictly increasing (implies `Monotonic`)
- `Decreasing` — strictly decreasing (implies `Monotonic`)

**Polynomials.** `LinearPolynomial`, `QuadraticPolynomial`, and `CubicPolynomial` take a covariant `Traits` type parameter (`out Traits = unknown`). Each module exposes:

- `isMonotonic`, `isIncreasing`, `isDecreasing` — type-narrowing predicates
- `asMonotonic`, `asIncreasing`, `asDecreasing` — runtime-checked assertions that throw on failure

For quadratic and cubic polynomials, all of the above accept an optional `Interval` argument (a quadratic with `c2 != 0` isn't globally monotonic, but it can be on an interval that avoids its extremum).

`solveInverse` is overloaded so that a `Monotonic`-branded polynomial returns a tighter shape:

| Polynomial          | Plain return           | `Monotonic` return   |
| ------------------- | ---------------------- | -------------------- |
| `LinearPolynomial`  | `Solution.AtMostOne`   | `Solution.One`       |
| `QuadraticPolynomial` | `Solution.AtMostTwo` | `Solution.AtMostOne` |
| `CubicPolynomial`   | `Solution.AtMostThree` | `Solution.AtMostOne` |

```ts
const p = LinearPolynomial.make(0, 2) // LinearPolynomial<unknown>
const inv = LinearPolynomial.solveInverse(p, 4) // Solution.AtMostOne
if (LinearPolynomial.isMonotonic(p)) {
  // p is now LinearPolynomial<Monotonic>
  const tight = LinearPolynomial.solveInverse(p, 4) // Solution.One — empty branch eliminated
}
```

**Curves.** `LinearCurve2d`, `QuadraticCurve2d`, and `CubicCurve2d` are now generic over per-axis trait sets: `LinearCurve2d<out XTraits = unknown, out YTraits = unknown>`. The two parameters track the trait sets of the curve's x and y polynomials independently — useful for asymmetric properties like "monotonic in x, anything in y" (an easing function / function-of-x curve).

Combined refiners — `isMonotonic`, `isIncreasing`, `isDecreasing` — require the property on both axes and check over the curve's natural parameter domain `[0, 1]`. Per-axis refiners — `isMonotonicX` / `isMonotonicY`, `isIncreasingX` / `isIncreasingY`, `isDecreasingX` / `isDecreasingY` — narrow only the named axis. Per-axis matters because `solveAtX`'s `Monotonic` overload only needs x-monotonicity, not y: an easing curve refined by `isMonotonicX` earns the `Solution.AtMostOne` return without proving anything about its y-axis. Assertions follow the same `as*` naming throughout.

**Rational curves classify by Bernstein sign convexity.** `RationalCubicCurve2d` carries the same per-axis `XTraits` / `YTraits`, and two accessors classify each projected axis on the unit interval:

```ts
RationalCubicCurve2d.xMonotonicity(c) // Monotonicity (Constant | Increasing | Decreasing | None)
RationalCubicCurve2d.yMonotonicity(c)
```

The classification is decided via Bernstein sign convexity on the derivative-numerator polynomial `q(t) = X'*W - X*W'`. Since `W^2 > 0` wherever the curve is well-defined, the sign of `dx/dt` equals the sign of `q`. Although `q` is a difference of degree-5 products, the leading terms cancel and `q` is in fact a quartic — its 5 Bernstein coefficients on `[0, 1]` are evaluated for uniform sign, with de Casteljau subdivision to resolve mixed-sign cases. The procedure is exact except at tangential zeros, where it conservatively reports `None`. No quintic solver involved. All twelve trait forms (combined and per-axis `is*` / `as*`) attach the `Monotonic` / `Increasing` / `Decreasing` brand, composing internally from `isXxx(c) && isYyy(c)` so TypeScript's `&&` narrowing accumulates both brands.

**Paths.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` are now generic: `<out Trait = unknown>`. Two families of brand ship:

- `Continuous` — adjacent curves connect at their join points (G^0). Each path module exposes `isContinuous` / `asContinuous`. Splines emit continuous paths by construction, so `Bezier2d.toPath`, `Cardinal2d.toPath`, etc. all produce paths that pass `isContinuous`.
- `MonotonicX`, `IncreasingX extends MonotonicX`, `DecreasingX extends MonotonicX`, and the y-axis counterparts (in `path/traits.ts`). A path is `IncreasingX` when every segment's x-polynomial is strictly increasing on `[0, 1]` _and_ adjacent segments' x-ranges don't overlap (modulo `EPSILON` for float drift at joins) — together those guarantee the path's `u -> x` mapping is monotonic across the whole parameter domain. Each non-rational path exposes `isMonotonicX` / `isIncreasingX` / `isDecreasingX` and the y-axis set plus the `as*` throwing variants; `IncreasingX` and `DecreasingX` narrow to `MonotonicX` via brand intersection, so a path refined by `isIncreasingX` is accepted anywhere `MonotonicX` is required.

Internally, the three polynomial path modules — previously ~300 lines each of near-duplicate `make` / `length` / `solve` / `toPathData` / continuity and monotonicity refiners / `solveAtX` / `solveAtY` — now derive their entire operation surface from a single generic implementation parameterized by a per-curve-kind operation bundle, and path code recovers segment endpoints through the curve modules' primitives instead of inlined per-degree coefficient formulas. Every public path API is preserved exactly: same signatures, same `TypeId`-based runtime identity, same error messages. `RationalCubicPath2d` stays outside the generic for now — its tolerance-threaded bounding box and projection semantics are unique to it.

**Axis inversion — `solveAtX` / `solveAtY`.** Where `solve(c, t)` evaluates the curve at a parameter `t` and returns `(x, y)`, `solveAt{X,Y}(c, value)` looks at the curve as a relation between its two axes and asks "what's the orthogonal coordinate when this axis equals the given value?" Results are filtered to the parameter domain `[0, 1]` — only intersections with the actual drawn curve are returned, not roots of the underlying polynomial that lie outside the curve's range — and come back in t-ascending order. Added to `LinearCurve2d`, `QuadraticCurve2d`, and `CubicCurve2d`:

| Curve              | Plain return           | `Monotonic` (`solveAtX` needs x, `solveAtY` needs y)                          |
| ------------------ | ---------------------- | ---------------------------------------------------------------------------- |
| `LinearCurve2d`    | `Solution.AtMostOne`   | `Solution.AtMostOne` (always — a line crosses any axis-line at most once)     |
| `QuadraticCurve2d` | `Solution.AtMostTwo`   | `Solution.AtMostOne`                                                          |
| `CubicCurve2d`     | `Solution.AtMostThree` | `Solution.AtMostOne`                                                          |

```ts
const easing = CubicCurve2d.fromBezierPoints(
  Vector2.make(0, 0),
  Vector2.make(0.42, 0),
  Vector2.make(0.58, 1),
  Vector2.make(1, 1),
)

if (CubicCurve2d.isMonotonic(easing)) {
  // both axes monotonic — solveAtX returns Solution.AtMostOne
  const [y] = CubicCurve2d.solveAtX(easing, 0.5)
}
```

`solveAtX` and `solveAtY` also ship on each non-rational path, gated by the corresponding `Monotonic{X,Y}` brand. Each locates the segment whose axis range contains the query and delegates to the curve-level solver; the path-level monotonicity guarantee means there's at most one match across all segments, so the return is `Solution.AtMostOne<number>`, and `Solution.none` when the query is outside the path's range. A query within `coincident` tolerance of a segment boundary snaps to that endpoint, so interior knots resolve exactly rather than falling into the gap between adjacent segments' brackets.

```ts
const path = CubicPath2d.make(easingCurve).pipe(CubicPath2d.asMonotonicX)
const yAt = CubicPath2d.solveAtX(path, 0.3) // Solution.AtMostOne<number>
```

A general (non-monotonic) `solveAtX` would have unbounded cardinality (segments times per-curve roots), so it's deferred until there's a use case.

**Variance.** All trait parameters are declared with the TS 4.7+ `out` covariance modifier. A `CubicPolynomial<Monotonic>` is assignable to a `CubicPolynomial<unknown>` (drop traits going up the lattice), and TypeScript will refuse a future change that introduces a contravariant use of the trait parameter.

**Behavior change:** `monotonicity()` over a zero-width interval now throws (`monotonicity is undefined over a zero-width interval`) instead of returning a constant classification. The previous return value conflated "polynomial is structurally constant" with "you queried at a single point" — only the former is a meaningful property of the polynomial. The runtime `Monotonicity` classification still has a `Constant` value for the structural case (see the monotonicity changeset).
