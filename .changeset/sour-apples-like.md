---
'curvy': major
---

**`Monotonicity` is now a top-level subpath, encoded as a bitmask.** The type moved out of `curvy/polynomial`'s internals into its own first-class module at `curvy/monotonicity`, and the values switched from a string union to a 2-bit sign-coverage bitmask of the function's derivative.

```ts
import { Monotonicity } from 'curvy/monotonicity'
import { CubicPolynomial } from 'curvy/polynomial'

const m: Monotonicity = CubicPolynomial.monotonicity(p, Interval.unit)
if (m === Monotonicity.Increasing) {
  /* … */
}
if (Monotonicity.isStrict(m)) {
  /* m is Increasing | Decreasing */
}
```

The new encoding:

| value | name         | derivative on the interval   |
| ----- | ------------ | ---------------------------- |
| `0`   | `Constant`   | ≡ 0                          |
| `1`   | `Increasing` | ≥ 0, with at least one `> 0` |
| `2`   | `Decreasing` | ≤ 0, with at least one `< 0` |
| `3`   | `None`       | crosses zero                 |

The numeric encoding is principled, not arbitrary: bit 0 is "derivative takes positive values", bit 1 is "derivative takes negative values". So the bitwise OR of two adjacent subintervals' classifications gives the classification of their union — `Increasing | Decreasing === None` is a literal algebraic identity, not a special case. That lets subdivision-based monotonicity checks combine sub-results with a single `|`, no custom merge logic.

`Monotonicity.isStrict(m)` is the new type-narrowing predicate (`m is 1 | 2`) for "strict monotonicity" — the cases that admit a unique inverse. Replaces inline `m === 'increasing' || m === 'decreasing'` checks.

`Monotonicity.fromComparison(s0, s1)` is the renamed `guaranteedMonotonicityFromComparison` — returns `GuaranteedMonotonicity` (the `Constant | Increasing | Decreasing` subset) based on the comparison of two endpoint values.

**Breaking.** Any code comparing against the old string literals (`'increasing'`, `'decreasing'`, `'constant'`, `'none'`) needs to compare against the constants (`Monotonicity.Increasing`, etc.) instead. The migration is mechanical — replace each string with the corresponding constant from the new subpath.
