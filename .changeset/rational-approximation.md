---
'curvy': minor
---

**Approximate rational cubic curves as polynomial cubic paths.** Rational curves can't be converted exactly to polynomial Béziers — that's the entire reason rational forms exist (true circles, conic sections, etc.). But they *can* be approximated to arbitrary tolerance via recursive subdivision, which is what PDF and SVG renderers do internally.

Two new operations, both at the curve and path level:

```ts
import { RationalCubicCurve2d } from 'curvy/curve'
import { RationalCubicPath2d } from 'curvy/path'

// Curve-level: returns ReadonlyArray<CubicCurve2d>
RationalCubicCurve2d.approximateAsCubicCurves(rationalCurve, tolerance)

// Path-level: returns CubicPath2d
RationalCubicPath2d.approximateAsCubicPath(rationalPath, tolerance)
```

For each segment a polynomial-cubic candidate is built by projecting the four homogeneous Bézier control points back to 2D; if the midpoint deviates from the true rational by more than `tolerance`, the segment is split at `t = 0.5` and the procedure recurses on each half. Endpoints and endpoint tangent directions are preserved exactly. For a uniform-weight curve the result is a single exact segment.

**New `CubicPolynomial.subdivide(p, t)`.** General de Casteljau-equivalent subdivision in monomial form. Returns `[left, right]` where the left half's evaluation on `[0, 1]` matches the input's on `[0, t]`, and the right half matches on `[t, 1]`. Available data-first and data-last.

```ts
import { CubicPolynomial } from 'curvy/polynomial'

const [left, right] = CubicPolynomial.subdivide(p, 0.5)
```

Used internally by the rational approximation but exposed as a primitive because it's the natural building block for any subdivision-based algorithm over cubic polynomials.
