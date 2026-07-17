---
'curvy': major
---

`Vector2.fromPolar` now takes its angle first: `fromPolar(theta, r)` instead of `fromPolar(r, theta)`. The new `curvy/coordinates` module reads chart points as `(theta, r)` and takes angular spans before radial ones everywhere, so the one polar constructor in the vector module follows the same angular-first rule rather than being the lone exception.

```ts
// before
Vector2.fromPolar(2, Math.PI / 2)
// after
Vector2.fromPolar(Math.PI / 2, 2)
```
