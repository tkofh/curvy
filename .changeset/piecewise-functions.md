---
'curvy': minor
---

**New `curvy/piecewise` module: `Piecewise`, an explicit piecewise-polynomial function `y = f(x)`.**

`Piecewise<P, Trait>` is the explicit counterpart to the parametric path types. A `CubicPath2d` maps `t -> (x, y)` with two polynomials per segment; a `Piecewise` maps `x -> y` with one polynomial per piece — the "pp-form" of the spline literature (MATLAB `mkpp`/`ppval`, SciPy `PPoly`). It is generic over the piece polynomial `P` (`LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial`), and carries no `2d` suffix because it is a function of one variable rather than a planar curve.

Each piece is a `[Closed, P]` pair — a closed x-`Interval` and the polynomial governing it, evaluated in the piece-local normalized coordinate `u = (x - start) / (end - start)`, so every piece's polynomial lives over `[0, 1]` regardless of where its x-domain sits.

```ts
import { Piecewise } from 'curvy/piecewise'
import { Interval } from 'curvy/interval'

const pp = Piecewise.make(
  [Interval.make(320, 768), lowerPoly],
  [Interval.make(768, 1280), upperPoly],
)

Piecewise.solve(pp, 900) // y at x = 900, or Solution.none outside every piece
Piecewise.domain(pp) // [320, 1280]
Piecewise.boundingBox(pp) // the y-image, interior extrema included
```

**Construction from a path — `Piecewise.fromPath`.** Refits a strictly-increasing-x `CubicPath2d` into a piecewise function of x, approximating `y = f(x)` to a `tolerance` (a fraction of the path's y-range, default `1e-4`). A path's y is generally not a polynomial in x — inverting a nonlinear `x(t)` leaves an algebraic function — so each segment is subdivided in x and fitted with a cubic matching value and slope (`dy/dx`) at the cell endpoints, bisecting until the fit tracks the curve. A segment whose x is already affine (`x.c2` and `x.c3` both zero) is transcribed exactly, with no subdivision.

```ts
const fn = Piecewise.fromPath(path, { tolerance: 1e-4 })
```

**Traits.** The base value is a *partial* function: its pieces are ordered and non-overlapping in x but may leave gaps. Refiners narrow that — `isContiguous` (no gaps), `isContinuous` (no gaps and no value jumps across the joins), `isMonotonic` (y monotonic across the whole domain) — each with an `as*` asserting variant. `Continuous` implies `Contiguous`.

**Builders.** `append` adds a piece and drops trait brands. `appendContiguous` and `appendContinuous` preserve the corresponding brand by checking only the new join — the input brand already vouches for the rest — and drop any other brands, since an append can still break them. `mapPolynomials` transforms each piece's polynomial over the same intervals.

**`appendContinuous` on the path family too.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` gain `appendContinuous(p, c)`: append a curve to a `Continuous` path, preserving the brand, provided the curve's start point connects to the path's current end point (G^0, within `coincident` tolerance). As with the `Piecewise` variants, only the new join is checked and other brands are dropped — reassert them with the relevant refiner if the property still holds.
