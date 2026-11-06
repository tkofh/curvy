---
'curvy': minor
---

**Linear interpolation for vectors.** `Vector2.lerp(a, b, t)` and `Vector3.lerp(a, b, t)` return `(1 - t) * a + t * b`, landing exactly on `a` at `t = 0` and on `b` at `t = 1`. `t` isn't clamped, so values outside `[0, 1]` extrapolate. The data-last form `lerp(b, t)` takes the start piped in.
