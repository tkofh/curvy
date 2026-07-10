---
'curvy': minor
---

**Per-axis monotonicity refiners on polynomial curves; one generic path implementation behind them.**

`LinearCurve2d`, `QuadraticCurve2d`, and `CubicCurve2d` gain per-axis brand refiners — `isMonotonicX` / `isMonotonicY`, `isIncreasingX` / `isIncreasingY`, `isDecreasingX` / `isDecreasingY` — narrowing only the named axis, mirroring what `RationalCubicCurve2d` already had. Per-axis matters because `solveAtX`'s `Monotonic` overload only needs x-monotonicity, not y: an easing curve refined by `isMonotonicX` gets the `Solution.AtMostOne` return without proving anything about its y-axis.

Internally, the three polynomial path modules — previously ~300 lines each of near-duplicate `make` / `length` / `solve` / `toPathData` / continuity and monotonicity refiners / `solveAtX` / `solveAtY` — now derive their entire operation surface from a single generic implementation parameterized by a per-curve-kind operation bundle, and path code recovers segment endpoints through the curve modules' primitives instead of inlined per-degree coefficient formulas. Every public path API is preserved exactly: same signatures, same `TypeId`-based runtime identity, same error messages. `RationalCubicPath2d` stays outside the generic for now — its tolerance-threaded bounding box and projection semantics are unique to it.
