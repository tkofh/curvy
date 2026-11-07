---
'curvy': major
---

**Vectors: `Vector2.fromPolar` and `Vector3.fromSpherical` take their angles first, and a 1.x call still compiles.**

Every argument is a `number`, so TypeScript accepts the 1.x order and the call returns a different vector. Swap the arguments at each call site:

```ts
// 1.x order, fromPolar(r, theta) and fromSpherical(r, theta, phi)
Vector2.fromPolar(2, Math.PI / 2) // 1.0.9: Vector2(0, 2). 2.0: Vector2(-0.654..., 1.428...)
Vector3.fromSpherical(2, Math.PI / 2, 0) // 1.0.9: Vector3(2, 0, 0). 2.0: Vector3(0, 0, 0)

// 2.0 order, fromPolar(theta, r) and fromSpherical(theta, phi, r)
Vector2.fromPolar(Math.PI / 2, 2) // Vector2(0, 2), to within 1e-16
Vector3.fromSpherical(Math.PI / 2, 0, 2) // Vector3(2, 0, 0), to within 1e-16
```

The angles keep their 1.x meanings: `theta` is measured from +z and `phi` is the azimuth in the xy-plane. Only the radius moved, to match the angle-first order of the new `curvy/coordinates` module.

**`Vector3.setTheta` and `setPhi` return correct vectors.** In 1.x, `setTheta` read `v.y` as the azimuth and so changed `phi` as well. `setPhi` put the full magnitude into the xy-plane, so its result left the sphere. Each now changes one angle and keeps the radius and the other angle. Code that called either in 1.x got wrong vectors.

The all-ones constant `unit` is now `one` on every vector module.

New on vectors:

- `fromTuple` builds a vector from a tuple, the inverse of `components`.
- `map*` replaces one component through a function: `mapX`, `mapY`, `mapZ`, `mapW` per axis, and `mapR`, `mapTheta`, `mapPhi` for the polar and spherical ones.
- `Vector4` gains `getX` through `getW`, `setX` through `setW`, and their `map*` forms.
- Vectors are iterable, so they destructure, spread into a `number[]`, and work with `for..of`.
- `Vector2.lerp` and `Vector3.lerp` interpolate without clamping `t`.
- `equals` compares within a tolerance; see [PRECISION.md](https://github.com/tkofh/curvy/blob/main/PRECISION.md).

```ts
const v = Vector2.fromTuple([3, 4])
const [x, y] = v
v.pipe(Vector2.mapTheta((theta) => theta + Math.PI / 2)) // Vector2(-4, 3)
Vector2.lerp(Vector2.zero, v, 0.5) // Vector2(1.5, 2)
```

[MIGRATION.md](https://github.com/tkofh/curvy/blob/main/MIGRATION.md) lists every vector export and its 2.0 form.
