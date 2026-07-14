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
Piecewise.derivative(pp) // f'(x), as a Piecewise one degree lower
```

**Calculus — `Piecewise.derivative`.** Differentiates the function with respect to x, lowering each piece's degree by one (cubics to quadratics, quadratics to linears, linears to piecewise constants). Because each piece is read in its local coordinate `u = (x - start) / size(domain)`, the result carries the per-piece chain-rule factor, so it evaluates to `df/dx` directly rather than `df/du`. The intervals are untouched, so a `Contiguous` result stays gapless — differentiating can still break `Continuous` and `Monotonic`, so those brands drop.

**Construction from a path — `Piecewise.fromPath`.** Refits a strictly-increasing-x path into a piecewise function of x at the source path's polynomial degree — `LinearPath2d` to linear, `QuadraticPath2d` to quadratic, `CubicPath2d` to cubic. A segment whose x is affine in its parameter is transcribed exactly (a linear path is entirely this case, so linear input is exact and `tolerance` is ignored). A segment with genuine curvature in x has a non-polynomial `y(x)` — inverting a nonlinear `x(t)` leaves an algebraic function — so it is subdivided in x and fitted per cell, bisecting until the fit tracks the curve within `tolerance` (a fraction of the path's y-range, default `1e-4`). The cubic fit matches value and slope at both cell endpoints; the quadratic fit matches both endpoint values and the left-endpoint slope.

```ts
const fn = Piecewise.fromPath(path, { tolerance: 1e-4 })
```

**Traits.** The base value is a _partial_ function: its pieces are ordered and non-overlapping in x but may leave gaps. Refiners narrow that — `isContiguous` (no gaps), `isContinuous` (no gaps and no value jumps across the joins), `isMonotonic` (y monotonic across the whole domain) — each with an `as*` asserting variant. `Continuous` implies `Contiguous`.

**Builders.** `append` adds a piece and drops trait brands. `appendContiguous` and `appendContinuous` preserve the corresponding brand by checking only the new join — the input brand already vouches for the rest — and drop any other brands, since an append can still break them. `mapPolynomials` transforms each piece's polynomial over the same intervals.

**`appendContinuous` on the path family too.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` gain `appendContinuous(p, c)`: append a curve to a `Continuous` path, preserving the brand, provided the curve's start point connects to the path's current end point (G^0, within `coincident` tolerance). As with the `Piecewise` variants, only the new join is checked and other brands are dropped — reassert them with the relevant refiner if the property still holds.
