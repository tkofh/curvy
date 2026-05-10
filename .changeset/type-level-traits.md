---
'curvy': major
---

Add a type-level trait system for polynomials, curves, and paths. Traits are phantom brands carried in a generic type parameter — they exist only at the type level, the runtime value is unchanged. Refiners check the property at runtime and narrow the type accordingly; assertions throw on failure.

**Polynomials.** `LinearPolynomial`, `QuadraticPolynomial`, and `CubicPolynomial` now take a covariant `Traits` type parameter (`out Traits = unknown`). The library exports three brands:

- `Monotonic` — strictly monotonic (excludes constant)
- `Increasing` — strictly increasing (implies `Monotonic`)
- `Decreasing` — strictly decreasing (implies `Monotonic`)

Each polynomial module exposes:

- `isMonotonic`, `isIncreasing`, `isDecreasing` — type-narrowing predicates
- `asMonotonic`, `asIncreasing`, `asDecreasing` — runtime-checked assertions that throw on failure

For quadratic and cubic polynomials, all of the above accept an optional `Interval` argument (a quadratic with c2 ≠ 0 isn't globally monotonic, but it can be on an interval that avoids its extremum).

`solveInverse` is overloaded so that a `Monotonic`-branded polynomial returns a tighter shape:

| Polynomial                       | Plain return                   | `Monotonic` return |
| -------------------------------- | ------------------------------ | ------------------ |
| `LinearPolynomial<Monotonic>`    | `ZeroOrOne` (`number \| null`) | `number`           |
| `QuadraticPolynomial<Monotonic>` | `ZeroToTwo`                    | `ZeroToOne` (new)  |
| `CubicPolynomial<Monotonic>`     | `ZeroToThree`                  | `ZeroToOne`        |

```ts
const p = LinearPolynomial.make(0, 2) // LinearPolynomial<unknown>
const inv = LinearPolynomial.solveInverse(p, 4) // ZeroOrOne
if (LinearPolynomial.isMonotonic(p)) {
  // p is now LinearPolynomial<Monotonic>
  const tight = LinearPolynomial.solveInverse(p, 4) // number — null branch eliminated
}
```

**Curves.** `LinearCurve2d`, `QuadraticCurve2d`, and `CubicCurve2d` are now generic over per-axis trait sets: `LinearCurve2d<out XTraits = unknown, out YTraits = unknown>`. The two parameters track the trait sets of the curve's x and y polynomials independently — useful for asymmetric properties like "monotonic in x, anything in y" (an easing function / function-of-x curve).

Per-axis refiners (`isMonotonicX`, `isMonotonicY`, `isIncreasingX`, `isIncreasingY`, `isDecreasingX`, `isDecreasingY`) and a combined `isMonotonic` that requires both axes monotonic. All check over the curve's natural parameter domain `[0, 1]`. Assertions follow the same `as*` naming.

**Paths.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` are now generic: `<out Trait = unknown>`. One brand is shipped:

- `Continuous` — adjacent curves connect at their join points (G⁰)

Each path module exposes `isContinuous` and `asContinuous`. Splines emit continuous paths by construction, so `Bezier2d.toPath`, `Cardinal2d.toPath`, etc. all produce paths that pass `isContinuous`.

**Variance.** All trait parameters are declared with the TS 4.7+ `out` covariance modifier. This means a `CubicPolynomial<Monotonic>` is assignable to a `CubicPolynomial<unknown>` (drop traits going up the lattice), and TypeScript will refuse a future change that introduces a contravariant use of the trait parameter.

**Behavior change:** `monotonicity()` over a zero-width interval now throws (`monotonicity is undefined over a zero-width interval`) instead of returning `'constant'`. The previous return value conflated "polynomial is structurally constant" with "you queried at a single point" — only the former is a meaningful property of the polynomial. The runtime `Monotonicity` enum still has `'constant'` as a value for the structural case.
