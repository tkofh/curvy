---
'curvy': minor
---

Added `fromTuple` to each vector module: `Vector2.fromTuple([x, y])`, `Vector3.fromTuple([x, y, z])`, `Vector4.fromTuple([x, y, z, w])`. The inverse of `components`, useful when interop with array-shaped data (JSON, SVG path commands, libraries that hand back tuples) would otherwise force a spread into `make`.

```ts
// before
const v = Vector2.make(...t)
// after
const v = Vector2.fromTuple(t)
```
