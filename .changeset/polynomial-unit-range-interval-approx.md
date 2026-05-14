---
'curvy': minor
---

Added `unitRange` helpers on each polynomial module and a float-tolerant `containsApprox` on `Interval`.

**`LinearPolynomial.unitRange(p)`, `QuadraticPolynomial.unitRange(p)`, `CubicPolynomial.unitRange(p)`** — equivalent to `range(p, Interval.unit)` but without needing to import `Interval.unit` at the call site. Same semantics: accounts for any interior extrema in `[0, 1]`. Used internally to clean up the curve-level `boundingBox` implementations.

```ts
// before
Interval2d.make(
  CubicPolynomial.range(c.x, Interval.unit),
  CubicPolynomial.range(c.y, Interval.unit),
)
// after
Interval2d.make(CubicPolynomial.unitRange(c.x), CubicPolynomial.unitRange(c.y))
```

**`Interval.containsApprox(interval, value, eps?)`** — returns `true` when `value` is in the interval or within `eps` of either boundary. Defaults `eps` to `EPSILON` (`1e-10`). Endpoint inclusivity is ignored — at the EPSILON scale the open/closed distinction loses meaning, and the use case is float-tolerant containment checks. Use `contains` for kind-strict semantics.

```ts
Interval.containsApprox(Interval.make(0, 1), 1.0000000001) // true
Interval.containsApprox(Interval.make(0, 1), 1.5) // false
Interval.containsApprox(Interval.make(0, 1), 1.5, 1) // true (explicit eps)
```
