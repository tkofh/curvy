---
'curvy': major
---

**`monotonicity` returns a numeric constant from the new `curvy/monotonicity` module, where 1.x returned a string.** `LinearPolynomial.monotonicity`, `QuadraticPolynomial.monotonicity`, and `CubicPolynomial.monotonicity` all switch:

| 1.x            | 2.0                       | Value |
| -------------- | ------------------------- | ----- |
| `'constant'`   | `Monotonicity.Constant`   | `0`   |
| `'increasing'` | `Monotonicity.Increasing` | `1`   |
| `'decreasing'` | `Monotonicity.Decreasing` | `2`   |
| `'none'`       | `Monotonicity.None`       | `3`   |

```ts
import { Monotonicity } from 'curvy/monotonicity'

// 1.x: CubicPolynomial.monotonicity(p, i) === 'increasing'
CubicPolynomial.monotonicity(p, i) === Monotonicity.Increasing
```

The value is a bitmask of the derivative's sign: bit 0 says it takes positive values, and bit 1 says it takes negative ones. The OR of two adjacent intervals' classifications is the classification of their union, so `Increasing | Decreasing` is `None`. `Monotonicity.isStrict(m)` replaces `m === 'increasing' || m === 'decreasing'` and narrows `m` to `1 | 2`. The `Monotonicity` type and `GuaranteedMonotonicity` (the three values without `None`, which `LinearPolynomial.monotonicity` returns) are importable for the first time. `Monotonicity.fromComparison` and `Monotonicity.fromDerivativeRange` classify your own functions from two endpoint values or from a derivative's range.

Two results change:

- Quadratic and cubic classification reads the derivative's values over the interval and ignores where its roots fall. A sign counts only beyond `RELATIVE_TOLERANCE` times the larger derivative magnitude, so a derivative that touches zero without changing sign leaves the polynomial monotonic: `t^3` on `[-1, 1]` is `Increasing`, where 1.x said `'none'`.
- `QuadraticPolynomial.monotonicity` and `CubicPolynomial.monotonicity` throw on a zero-width interval, where 1.x returned `'constant'`.

The [migration guide](https://github.com/tkofh/curvy/blob/main/MIGRATION.md) lists every 1.x export and its 2.0 form.
