---
'curvy': minor
---

**3D affine transforms.** `curvy/transform` also exports `Affine3d`, a 4x4 homogeneous matrix whose fourth row is `[0, 0, 0, 1]`. It has every `Affine2d` operation except the reflections, under the same names and with the same `Invertible` brand. Singularity is judged on the 3x3 linear part.

`translate` and `scale` take their per-axis values as separate numbers or as one `Vector3`. `scale`, `rotate`, and `shear` take an optional last `origin`, the point that stays fixed. Two constructors take different arguments from 2D:

- `rotate(r, origin?)` takes a `Rotation3d` or a `Quaternion<Unit>`, not an angle.
- `shear(s, origin?)` takes a `Partial<Shear>` of six named coefficients, where `xy` adds `xy * y` into `x`.

A negative scale stands in for the reflections: `scale(-1, 1, 1)` reflects across the yz-plane.

`compose` and `decompose` move between a transform and its parts. `compose({ translation?, rotation?, scale?, shear? })` applies scale, then shear, then rotation, then translation. `decompose` splits any invertible transform back into those parts, so the two round-trip. Shear is part of the split because a child rotated inside a non-uniformly scaled parent carries shear that no rotation-and-scale pair can express. A transform that mirrors space gets a negative `x` scale. A singular transform returns `none`, and an `Invertible`-branded one returns `Solution.One`.

`isMirror` marks a transform that reverses handedness, the case where a solid's faces need reversing to keep facing out. `applyNormal` needs no such fix, since it keeps an outward normal outward.

```ts
const joint = Affine3d.compose({
  translation: Vector3.make(0, 2, 0),
  rotation: Rotation3d.aboutX(0.3),
  scale: Vector3.make(1, 0.5, 1),
})

Affine3d.applyNormal(joint, Vector3.unitY) // stays perpendicular to the squashed surface
Affine3d.decompose(joint) // Solution.One holding { translation, rotation, scale, shear }
```
