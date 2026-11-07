---
'curvy': patch
---

**Faster across the board than 1.x.** The operations 1.0.9 and 2.0 share run 1.2 to 340 times faster. The table compares the published 1.0.9 build with the 2.0 build on the same inputs under Node 26, with the mean of three alternating runs per operation. The two builds agree to within 1.x's 8-decimal rounding.

| Operation                         |  1.0.9 |    2.0 | Speedup |
| --------------------------------- | -----: | -----: | ------: |
| `Vector2.add`                     |  11 ns | 3.8 ns |      3x |
| `Matrix4x4.determinant`           | 2.7 µs |  20 ns |    136x |
| `Matrix4x4.solveSystem`           |  15 µs | 215 ns |     70x |
| `Matrix4x4.vectorProductLeft`     | 159 ns |  22 ns |      7x |
| `CubicPolynomial.solve`           |  41 ns |  20 ns |      2x |
| `CubicPolynomial.roots`           | 205 ns | 172 ns |    1.2x |
| `CubicPolynomial.range`           | 248 ns |  78 ns |      3x |
| `CubicCurve2d.length`             | 1.5 µs | 319 ns |    4.8x |
| `CubicPath2d.length` (4 segments) | 5.9 µs | 1.2 µs |      5x |
| `Bezier2d.toPath` (4 segments)    | 1.8 µs | 664 ns |    2.7x |
| `Basis2d.toBezier` (13 segments)  | 374 µs | 1.1 µs |    340x |
| `Cardinal2d.toPath` (13 segments) | 5.0 µs | 1.4 µs |    3.5x |

The largest gains come from computing determinants and the spline-to-Bézier conversion directly, where 1.x built every minor as a matrix and solved a linear system per segment. 2.0 also skips the 8-decimal rounding that 1.x applied to every constructed value. `Cardinal2d.toPath` costs the same under the centripetal default as under `{ alpha: 0 }`.
