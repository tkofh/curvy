---
'curvy': major
---

**Values are stored as exact doubles: 1.x rounded them to 8 decimal places, and 2.0 does not.** 1.x rounded every vector, matrix, polynomial, and `Interval` component when it built the value, and most computed results too: polynomial values and roots, vector magnitudes and products, determinants, curve and path lengths, curvature, and the spline characteristic matrices. 2.0 stores and returns plain IEEE doubles, so computed values carry noise in their last bits, and `===` against a hand-written decimal can fail:

```ts
Vector2.make(0.1 + 0.2, 0).x
// 1.x: 0.3
// 2.0: 0.30000000000000004

CubicPolynomial.solveInverse(CubicPolynomial.make(-6, 11, -6, 1), 0)
// 1.x: [1, 2, 3]
// 2.0: Solution.Three(1.0000000000000002, 2, 3)
```

Compare with a tolerance instead:

- `equals(a, b)` (data-last `equals(b)(a)`) on every vector, matrix, polynomial, and interval type compares components with `coincident`.
- `coincident(a, b, absolute?, relative?)` in `curvy/number` holds when `|a - b| <= absolute + relative * max(|a|, |b|)`, with defaults `EPSILON` (`1e-10`) and `RELATIVE_TOLERANCE` (`1e-12`). A non-finite pair compares exactly. `epsEquals(a, b, eps?)` is the purely absolute check.
- `before`, `atMost`, `within`, `inside`, `overlaps`, and `touches` in `curvy/number` decide order and range membership with the same band, so rounding noise never flips the answer.
- `round`, `roundDown`, and `roundUp` in `curvy/number` still default to 8 places, for where you want fixed output precision.

Two results change beyond the noise. `solveSystem` on `Matrix2x2`, `Matrix3x3`, and `Matrix4x4` throws only for a zero determinant. 1.x also threw for a determinant below about `5e-9` in magnitude, and such a nearly singular system now returns a very large solution, so test `determinant` first if you relied on the throw. `CubicPolynomial.solveInverse` merges two roots only when they are exactly equal, not when they agree after rounding. Root finding is also more robust, and its 1.x bugs are listed with the other fixes.

[PRECISION.md](https://github.com/tkofh/curvy/blob/main/PRECISION.md) documents which checks are exact, which are tolerant, and how to choose a tolerance. The [migration guide](https://github.com/tkofh/curvy/blob/main/MIGRATION.md) lists every 1.x export and its 2.0 form.
