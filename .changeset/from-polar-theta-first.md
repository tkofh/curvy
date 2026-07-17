---
'curvy': major
---

The polar and spherical vector constructors now take their angles first: `Vector2.fromPolar(theta, r)` instead of `fromPolar(r, theta)`, and `Vector3.fromSpherical(theta, phi, r)` instead of `fromSpherical(r, theta, phi)`. The new `curvy/coordinates` module reads chart points as `(theta, r)` and takes angular spans before radial ones everywhere, so the vector constructors follow the same angular-first rule rather than being the lone exceptions.

```ts
// before
Vector2.fromPolar(2, Math.PI / 2)
Vector3.fromSpherical(2, Math.PI / 2, 0)
// after
Vector2.fromPolar(Math.PI / 2, 2)
Vector3.fromSpherical(Math.PI / 2, 0, 2)
```
