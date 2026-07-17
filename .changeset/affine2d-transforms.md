---
'curvy': minor
---

**New `curvy/transform` module: `Affine2d`, plus `transform` on every curve, path, and spline.**

`Affine2d` is an immutable 2D affine transform backed by a homogeneous `Matrix3x3`. Constructors cover the standard family:

```ts
import { Affine2d } from 'curvy/transform'
import { Vector2 } from 'curvy/vector'

Affine2d.identity
Affine2d.translate(10, 0) // or translateBy(Vector2.make(10, 0))
Affine2d.rotate(Math.PI / 4) // or rotateAround(theta, origin)
Affine2d.scale(2) // or scale(sx, sy), scaleAround(sx, sy, origin)
Affine2d.shear(kx, ky)
Affine2d.reflectX // constants; or reflectAcrossLine(origin, direction)
Affine2d.fromMatrix(m) // validates the bottom row is affine
```

`andThen` composes transforms; `apply` / `applyTo` send a `Vector2` through one. Accessors `translation`, `linear`, and `linearPart` decompose a transform into its translation vector and linear part. `equals` compares component-wise. `inverse` / `inverseUnsafe` and the `Invertible` trait integration are described in the matrix changeset — an invertible `Affine2d` is one whose underlying matrix is invertible.

**`transform(x, t: Affine2d)` is available on every geometric carrier** — `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`, `RationalCubicCurve2d`, the four path types, and all six spline types — in both data-first and data-last forms. Each returns a new instance of the same kind with the transform applied to its geometry; `Cardinal2d.transform` preserves `tension` and `alpha`, and `RationalBezier2d.transform` preserves control-point weights.

Transforming **drops trait brands** — the result is unbranded even when the input carried `Monotonic*` or `Continuous`. An affine map can break axis monotonicity outright (rotate an x-increasing curve by 90 degrees), so the brands can't travel through in general; re-refine with the `is*` / `as*` refiners after transforming when the property still matters.

```ts
import { Affine2d } from 'curvy/transform'
import { CubicPath2d } from 'curvy/path'

const flipped = path.pipe(CubicPath2d.transform(Affine2d.reflectY))
```
