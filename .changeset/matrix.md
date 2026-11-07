---
'curvy': minor
---

**Matrix identities, products, and inverses.** `Matrix3x3` and `Matrix4x4` gain an `identity` constant, `multiply(a, b)` for the product `a * b`, and an inverse API. `Matrix2x2` has none of these.

- `inverse(m)` returns a `Solution`: `none` for a singular matrix, otherwise `Solution.One` holding the inverse.
- `inverseUnsafe(m)` returns the inverse directly and throws on a singular matrix.
- `isInvertible(m)` narrows `m` to the `Invertible` brand, and `asInvertible(m)` asserts it, throwing on a singular matrix. `inverse` of a branded matrix returns `Solution.One`, so `.value` needs no check.

A matrix is singular when its determinant falls below `RELATIVE_TOLERANCE` times the product of its row norms. The test scales with the matrix, so `diag(1e-8, 1e-8, 1)` still inverts. [PRECISION.md](https://github.com/tkofh/curvy/blob/main/PRECISION.md) describes the tolerance model.

```ts
const inv = Matrix3x3.inverse(m) // Solution.AtMostOne<Matrix3x3>
if (Solution.isSome(inv)) {
  use(inv.value)
}

if (Matrix3x3.isInvertible(m)) {
  use(Matrix3x3.inverse(m).value) // Solution.One, no check needed
}
```
