---
'curvy': patch
---

**Faster matrices, arc lengths, easing lookups, and bounding boxes, and a bounded Cardinal cache.**

- `Matrix3x3` and `Matrix4x4` compute `determinant`, `inverse`, and `inverseUnsafe` from the entries directly instead of building every minor as a matrix. `Matrix3x3.inverse` went from about 1.6 µs to 70 ns and `Matrix4x4.inverse` from 11 µs to 120 ns. Everything built on the 3x3 inverse speeds up with them: `Affine3d.inverse`, `Affine3d.applyNormal`, and `Plane3d.transform` each went from about 1.7 µs to 120–150 ns.
- `CubicCurve2d.length` and `QuadraticCurve2d.length` sample the derivative's polynomials directly instead of building a vector at each of the 32 quadrature points, so they run about 3 times faster. `CubicPath2d.solveByDistance`, which measures length on every Newton step, runs about 3 times faster with them.
- `CubicCurve2d.solveAtX` and `solveAtY`, the lookup behind cubic easing, run about 1.5 times faster, from about 185 ns to 125 ns. `CubicPolynomial.solveInverse` no longer collects its roots through a `Set` and two arrays. The quadratic and rational cubic curves' `solveAtX` and `solveAtY` drop the same intermediate closures.
- `CubicPolynomial.range` and `unitRange` fold the values at the ends and extrema into a min and max directly, so `CubicCurve2d.boundingBox` runs about 1.75 times faster.
- `Piecewise.solve` finds its piece by binary search instead of scanning from the first piece. On 64 pieces it runs about 3.7 times faster. An easing refit by `Piecewise.fromPath` typically has 8 to 22 pieces. Pieces that overlap within tolerance, which `fromArray` admits, keep the scan.
- `Characteristic.cubicCardinal` keeps the 16 most recently used tensions instead of every tension it has seen, so a tension that changes on every call no longer grows memory without bound. Tension `0.5` always returns `cubicCatmullRom` itself. Other tensions return the same instance while they stay recent, and an equal new matrix after that.

No results change: the new code rounds exactly as the old did.
