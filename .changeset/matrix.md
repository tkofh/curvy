---
'curvy': major
---

**Matrix primitives and the `Invertible` trait.** `Matrix3x3` and `Matrix4x4` fill out their primitive surface, and all three matrix sizes plus `Affine2d` gain an `Invertible` trait paralleling the polynomial `Monotonic` family.

**New primitives.** `Matrix3x3` and `Matrix4x4` each gain an `identity` constant and a `multiply(a, b)` (matrix-matrix product, data-first and data-last). These back the transform composition in the `Affine2d` changeset and the caching in the spline-conversion changeset, and stand on their own as general 4x4/3x3 transform primitives.

**`Invertible` trait.** Exposed through `isInvertible` / `asInvertible` refiners and a phantom `Traits` parameter on each carrier's interface. `inverse` now returns a `Solution.AtMostOne` by default, tightening to `Solution.One` when the carrier is `Invertible`-branded. The previous throwing-on-singular behavior is preserved under the new name `inverseUnsafe`.

Invertibility uses a scale-relative singular test on the determinant rather than an exact `det !== 0` — the tolerance model is described in the precision-model changeset. `Affine2d` shares the same brand: an invertible `Affine2d` is one whose underlying matrix is invertible.

```ts
import { Matrix3x3 } from 'curvy/matrix'
import { Solution } from 'curvy/solution'

// Solution.AtMostOne<Matrix3x3>
const a = Matrix3x3.inverse(m)
if (Solution.isSome(a)) {
  use(a.value)
}

// Solution.One<Matrix3x3<Invertible>> — .value directly accessible
const b = Matrix3x3.inverse(Matrix3x3.asInvertible(m))
use(b.value)

// Throws on singular — equivalent to the pre-2.0 `inverse`
const c = Matrix3x3.inverseUnsafe(m)
```

**Migration:**

- `Matrix3x3.inverse(m)`, `Matrix4x4.inverse(m)`, and `Affine2d.inverse(a)` now return a `Solution.AtMostOne` instead of a bare value. Replace with `inverseUnsafe` for the simplest behavior-preserving change, or pattern-match the `Solution` for the safer path.
- The singular check is now scale-relative rather than exact `=== 0`. Matrices that were marginally non-singular under the old check (determinants smaller than the scaled tolerance) are now treated as singular.
