---
'curvy': patch
---

Internal: rewrote `dual()`'s per-arity hot paths to read `arguments.length` and `arguments[i]` directly from a regular `function` body, instead of unpacking `...args` rest-parameters into an array. V8 keeps `arguments` virtualized when only `length` and indexed access are used, so the hot path no longer allocates an array per call.

No API change; `dual()`'s signatures and overload semantics are unchanged. Realistic-workflow benchmark (build a 4-segment Bezier path + 1000 samples) is **~43% faster**, and `CubicCurve2d.solve` is **~18% faster**, both because they go through `dual` repeatedly in their hot loops. Operations that don't use `dual` (like `Matrix4x4.make`) are unaffected, as expected.
