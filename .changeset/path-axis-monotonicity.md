---
'curvy': minor
---

Added per-axis monotonicity traits and `solveAt{X,Y}` to non-rational path modules (`LinearPath2d`, `QuadraticPath2d`, `CubicPath2d`).

**New trait brands** (in `path/traits.ts`): `MonotonicX`, `IncreasingX extends MonotonicX`, `DecreasingX extends MonotonicX`, and the y-axis counterparts. A path is `IncreasingX` when every segment's x-polynomial is strictly increasing on `[0, 1]` _and_ adjacent segments' x-ranges don't overlap (modulo `EPSILON` for float drift at joins) — together those guarantee the path's `u → x` mapping is monotonic across the whole parameter domain.

**New refiners and assertions** on each non-rational path: `isMonotonicX`, `isIncreasingX`, `isDecreasingX`, `isMonotonicY`, `isIncreasingY`, `isDecreasingY`, plus the `as*` throwing variants. Following the existing pattern, `IncreasingX` and `DecreasingX` both narrow to `MonotonicX` via brand intersection — so a path refined by `isIncreasingX` is accepted anywhere `MonotonicX` is required, no extra `asMonotonicX` step needed.

**New operations**: `solveAtX` and `solveAtY` on each non-rational path, gated by the corresponding `Monotonic{X,Y}` brand. Returns `Solution.AtMostOne<number>` — locates the segment whose axis range contains the query and delegates to the curve-level solver. The monotonicity guarantee at the path level means there's at most one match across all segments. Returns `Solution.none` when the query is outside the path's range.

```ts
const path = CubicPath2d.make(easingCurve).pipe(CubicPath2d.asMonotonicX)
const yAt = CubicPath2d.solveAtX(path, 0.3) // Solution.AtMostOne<number>
```

A general (non-monotonic) `solveAtX` would have unbounded cardinality (segments × per-curve roots), so it's deferred until there's a use case.
