---
'curvy': patch
---

Fixed `solveAt{X,Y}` on `MonotonicX`/`MonotonicY` paths returning `Solution.none` at most interior knots.

At an interior knot, two adjacent segments both bracket the query within float tolerance — the leftward segment's right endpoint and the rightward segment's left endpoint are (nominally) the same value. For cubic paths, the per-segment polynomial-inverse solver could return `none` for _both_ of those brackets when accumulated drift in `c0 + c1 + c2 + c3` pushed the cubic's true root just outside `[0, 1]`. The path-level loop then short-circuited on the first `none` and returned the empty solution even though one of the segment endpoints was the answer.

The reproducer (Catmull-Rom from 6 knots, queried at interior knot x-values) used to return `none` for 3 of 4 interior knots; now returns the expected y at all 6.

Two-part fix in `LinearPath2d`, `QuadraticPath2d`, `CubicPath2d`:

- Snap to the segment endpoint y when the query is within `EPSILON` of the segment's start or end x — avoids the polynomial inversion entirely at the knot case.
- Fall through to the next bracketing segment on `none` rather than short-circuiting. The `MonotonicX/Y` brand guarantees at most one real solution across the path, so retrying after `none` is safe.
