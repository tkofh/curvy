---
'curvy': minor
---

**`Affine2d` constructors take vectors and an optional origin.** `translate` and `scale` accept their per-axis values as one `Vector2` as well as separate numbers. Every constructor with a fixed point takes it as an optional last `origin`, defaulting to `Vector2.zero`. That folds three functions into the ones they specialized:

- `translate(v)` replaces `translateBy(v)`
- `scale(sx, sy, origin)` replaces `scaleAround(sx, sy, origin)`
- `rotate(theta, origin)` replaces `rotateAround(theta, origin)`

The same rule adds two forms that didn't exist: a uniform scale about a point, `scale(2, center)`, and a shear about a point, `shear(kx, ky, origin)`.

**`reflectAcrossLine` now takes `(direction, origin?)`, reversing its arguments.** Both are `Vector2`s, so an old `reflectAcrossLine(origin, direction)` call still compiles and silently reflects across a different line. Swap the arguments at each call site, or drop `origin` for a line through the zero vector.

```ts
Affine2d.translate(Vector2.make(10, 0)) // was translateBy(Vector2.make(10, 0))
Affine2d.rotate(Math.PI / 2, center) // was rotateAround(Math.PI / 2, center)
Affine2d.scale(Vector2.make(2, 3), center) // was scaleAround(2, 3, center)
Affine2d.reflectAcrossLine(direction, point) // was reflectAcrossLine(point, direction)
```
