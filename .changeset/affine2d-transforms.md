---
'curvy': minor
---

**New `curvy/transform` module: `Affine2d`, plus `transform` on every curve, path, and spline.**

`Affine2d` is an immutable 2D affine transform backed by a homogeneous `Matrix3x3`. Constructors with a fixed point take it as an optional last `origin`, which defaults to `Vector2.zero`:

```ts
Affine2d.identity
Affine2d.translate(10, 0) // or translate(Vector2.make(10, 0))
Affine2d.rotate(Math.PI / 4) // or rotate(theta, origin)
Affine2d.scale(2) // or scale(sx, sy), scale(factors), each with an optional origin
Affine2d.shear(kx, ky) // or shear(kx, ky, origin)
Affine2d.reflectX // and reflectY; or reflectAcrossLine(direction, origin?)
Affine2d.fromMatrix(m) // throws unless the bottom row is [0, 0, 1]
```

- `andThen(a, b)` applies `a`, then `b`.
- `apply` and `applyTo` map a point. `applyDirection` ignores translation, for tangents and edge vectors. `applyNormal` maps by the inverse transpose of the linear part and normalizes, so a normal stays perpendicular under a non-uniform scale or a shear, and an outward normal stays outward under a reflection.
- `isMirror` is `true` for an invertible transform that reverses orientation, the case where a polygon's winding flips.
- `translation`, `linear`, and `linearPart` split a transform into its translation and linear part. `equals` compares within a tolerance.
- `inverse` returns a `Solution`, `none` when the transform is singular. `inverseUnsafe` throws instead. `isInvertible` and `asInvertible` add the `Invertible` brand, under which `inverse` returns `Solution.One`. Singularity is judged on the 2x2 linear part alone, so a translation never makes a transform singular.

**`transform(x, a)` maps every curve, path, and spline type through an `Affine2d`**, data-first or data-last, and returns the same kind. `Cardinal2d.transform` keeps `tension` and `alpha`, and `RationalBezier2d.transform` keeps each weight. Splines transform their control points, so a centripetal or chordal `Cardinal2d` under a non-uniform scale or a shear is not the exact image of the original curve. Convert it with `toBezier` first when that matters.

The result carries no trait brands, because a rotation can break axis monotonicity. Re-refine with the `is*` and `as*` refiners when the property still matters.

```ts
const flipped = path.pipe(CubicPath2d.transform(Affine2d.reflectY))
```
