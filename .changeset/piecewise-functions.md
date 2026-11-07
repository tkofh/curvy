---
'curvy': minor
---

**`Piecewise` (`curvy/piecewise`) is a piecewise-polynomial function `y = f(x)`.** A `CubicPath2d` maps `t -> (x, y)` with two polynomials per segment. A `Piecewise` maps `x -> y` with one linear, quadratic, or cubic polynomial per piece, the pp-form behind MATLAB's `mkpp` and SciPy's `PPoly`. Each piece pairs a closed x-interval with a polynomial in the piece-local coordinate `u = (x - start) / (end - start)`, so every polynomial lives on `[0, 1]`.

```ts
const fontSize = Piecewise.fromArray([
  [Interval.make(320, 768), CubicPolynomial.make(16, 2, 0, 0)],
  [Interval.make(768, 1280), CubicPolynomial.make(18, 4, 0, 0)],
])

Piecewise.solve(fontSize, 900) // Solution.One(19.03125); none outside every piece
Piecewise.domain(fontSize) // Interval [320, 1280]
Piecewise.boundingBox(fontSize) // Interval [16, 22], the range of y
Piecewise.derivative(fontSize) // dy/dx, as a piecewise quadratic
```

- **Traits.** Pieces must be ordered and non-overlapping in x but may leave gaps. `isContiguous` (no gaps), `isContinuous` (no gaps or jumps), and `isMonotonic` (y monotonic across the domain) narrow the type, and each has an `as*` variant that throws.
- **Building.** `append` adds a piece and drops the brands. `appendContiguous` and `appendContinuous` check only the new join and keep their brand. `mapPolynomials` maps each piece's polynomial.
- **Calculus.** `derivative` returns `dy/dx`, not `dy/du`, and drops every brand.
- **From a path.** `Piecewise.fromPath(path, { tolerance })` refits a path branded monotonic in x, such as an easing curve drawn with Bézier handles, into a contiguous `Piecewise` of the same degree. Segments whose x is linear in `t` transfer exactly. The rest are subdivided until the fit is within `tolerance`, a fraction of the path's y-range that defaults to `1e-4`. A path running toward decreasing x is reversed first.
