---
'curvy': patch
---

**Faster matrix-vector products.** `vectorProductLeft` and `vectorProductRight` on `Matrix2x2`, `Matrix3x3`, and `Matrix4x4` read the matrix entries directly instead of building row or column vectors first, so each call allocates only its result. They run 3.5 to 6 times faster: `Matrix3x3.vectorProductLeft` went from about 62 ns to 14 ns per call, and moving 184 vertices with `Vector3.add(Matrix3x3.vectorProductLeft(m, v), t)` from 13.8 µs to 6.0 µs. `Affine3d.apply` does the same job in 3.8 µs. No results change.
