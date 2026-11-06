---
'curvy': minor
---

**3D affine transforms.** `curvy/transform` gains `Affine3d`, the 3D counterpart of `Affine2d`: a 4x4 homogeneous matrix whose fourth row is `[0, 0, 0, 1]`, refined by the same `Invertible` brand. It mirrors `Affine2d`'s surface with `identity`, `fromMatrix`, `translate`, `scale`, `rotate`, `shear`, `andThen`, `inverse`, `inverseUnsafe`, `isInvertible`, `asInvertible`, `apply`, `applyTo`, `linear`, `translation`, `linearPart`, and `equals`. `translate` and `scale` take their per-axis values either as separate numbers or as one `Vector3`. `scale`, `rotate`, and `shear` take an optional last `origin`, the point that stays fixed, which defaults to the zero vector. `rotate(r, origin?)` takes a `Rotation3d` or a `Quaternion<Unit>`.

`compose` and `decompose` move between a transform and its parts. `compose({ translation?, rotation?, scale?, shear? })` applies scale, then shear, then rotation, then translation. `decompose` splits any invertible transform back into those parts, so the two round-trip. Shear is part of the split because a child rotated inside a non-uniformly scaled parent carries shear that no rotation-and-scale pair can express. A transform that mirrors space gets a negative `x` scale. A singular transform returns `none`, and an `Invertible`-branded one returns `Solution.One`.

Both affine types now map directions and normals as well as points. `applyDirection` ignores translation, for tangents and edge vectors. `applyNormal` maps by the inverse transpose of the linear part and normalizes. Under a non-uniform scale or a shear that is the only map that keeps a normal perpendicular to its surface, and it keeps an outward normal outward under a reflection.

Both also gain `isMirror(a)`, which is `true` when the transform is invertible and reverses handedness (a negative determinant in its linear part). That is the case where a polygon's winding flips, so it tells you when to `reverse` faces after transforming them.

```ts
import { Affine3d, Rotation3d } from 'curvy/transform'
import { Vector3 } from 'curvy/vector'

const joint = Affine3d.compose({
  translation: Vector3.make(0, 2, 0),
  rotation: Rotation3d.aboutX(0.3),
  scale: Vector3.make(1, 0.5, 1),
})

Affine3d.applyNormal(joint, Vector3.unitY) // stays perpendicular to the squashed surface
Affine3d.decompose(joint) // Solution.one({ translation, rotation, scale, shear })
```
