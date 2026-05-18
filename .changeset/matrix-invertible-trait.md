---
'curvy': major
---

Add an `Invertible` trait to `Matrix3x3`, `Matrix4x4`, and `Affine2d`, paralleling the polynomial `Monotonic` family. The trait is exposed through `isInvertible` / `asInvertible` refiners and a phantom `Traits` parameter on each carrier's interface.

`inverse` now returns a `Solution.AtMostOne` by default, tightening to `Solution.One` when the carrier is `Invertible`-branded. Today's throwing-on-singular behavior is preserved under the new name `inverseUnsafe`.

Invertibility is checked with `epsEquals(det, 0)` (rather than the previous exact `det !== 0`), matching the absolute-tolerance convention used elsewhere in the package.

```ts
import * as Matrix3x3 from 'curvy/matrix3x3'
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

`Affine2d` shares the same `Invertible` brand: an invertible `Affine2d` is one whose underlying matrix is invertible.

**Migration:**

- `Matrix3x3.inverse(m)`, `Matrix4x4.inverse(m)`, and `Affine2d.inverse(a)` now return a `Solution.AtMostOne` instead of a bare value. Replace with `inverseUnsafe` for the simplest behavior-preserving change, or pattern-match the `Solution` for the safer path.
- The singular check now uses `epsEquals` rather than exact `=== 0`. Matrices that were marginally non-singular under the old check (determinants smaller than the default tolerance) will now be treated as singular.
