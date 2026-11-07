---
'curvy': patch
---

**Fixes for bugs that shipped in 1.0.9.**

- `LinearPath2d.solve`, `QuadraticPath2d.solve`, and `CubicPath2d.solve` threw an incidental `TypeError` for any `u` outside `[0, 1]`, even `1 + 1e-12`. A `u` within `EPSILON` (`1e-10`) of the range now clamps to the nearest endpoint, and anything further out throws `Error('path parameter must be within [0, 1]')`.
- `LinearPolynomial.range` threw `Interval end must be greater than or equal to start` for a decreasing polynomial, and `QuadraticPolynomial.range` threw the same for a decreasing polynomial with `c2 === 0`. Both now return the closed `[min, max]` interval.
- `QuadraticPolynomial.roots`, `solveInverse`, and `toInverseSolver` divided by zero when `c2 === 0` and returned `[NaN, -Infinity]`. They now solve the remaining linear equation. `CubicPolynomial.roots`, `solveInverse`, and `extrema` hit the same bug through their degenerate-degree cases and are fixed with it.
- `CubicPolynomial.solveInverse` and `toInverseSolver` ignored the target `y` when `c3 === 0` and solved for `y = 0`, so `CubicPolynomial.solveInverse(CubicPolynomial.make(1, 2, 3, 0), 1)` returned no roots. Both now solve for the given `y`, and that call returns `-2/3` and `0`.
- `toPath` on `Basis2d`, `Bezier2d`, `Cardinal2d`, and `Hermite2d` threw `RangeError: Maximum call stack size exceeded` for very long splines (a few hundred thousand segments). It now handles any length.
- The curve and path guards (`isCubicCurve2d`, `isCubicPath2d`, ...) and `isBasis2d`, `isCubicBezier2d`, and `isHermite2d` returned `false` for values built by a second installed copy of curvy. They now recognize values from any copy.
