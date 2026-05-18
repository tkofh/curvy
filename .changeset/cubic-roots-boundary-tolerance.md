---
'curvy': patch
---

**Cubic root finder is now Newton-refined; `Solution.clipApprox` added for tolerant solver-output clipping.**

`CubicPolynomial.solveInverse` now follows its closed-form (Cardano/trig) step with up to four Newton iterations on each root. The closed-form path can lose ~3 digits of precision when two roots cluster (the trig branch's `acos` argument approaches `±1`, where its derivative is unbounded); Newton converges quadratically away from multiple roots, so a few-ULP-off seed reaches machine epsilon in 2–3 steps. The iteration bails on a float fixed point or on a vanishing slope (true multiple-root case where Newton degrades to linear convergence and further steps don't help).

This fixes a class of `solveAtX` / `solveAtY` failures on rational cubics with small denominator weights — previously, a cubic of the form `(t − 1)·W(t)` with `W` having a root near `1` would have its `t = 1` root drift far enough that the strict `[0, 1]` clip dropped it. With Newton refinement that root lands at `1 + O(ULP)` instead of, say, `1 + 0.03`.

The remaining ULP-level overshoot is now handled by a second change:

```ts
import { Solution } from 'curvy/solution'

// Strict (existing): respects Interval.kind exactly.
Solution.clip(s, Interval.unit)

// Tolerant (new): treats values within EPSILON of either boundary as in-range.
// Intended for post-processing numerical solver output.
Solution.clipApprox(s, Interval.unit)
```

`Solution.clipApprox` mirrors `Interval.containsApprox` semantics — at the EPSILON scale the open/closed distinction loses meaning, and the use case is "this came out of a numerical solver, an ULP-level overshoot at the boundary should still count." All four `solveAtX` / `solveAtY` implementations across `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`, and `RationalCubicCurve2d` now use `clipApprox` internally. The strict `Solution.clip` is unchanged for callers who need bit-exact open/closed boundary handling.
