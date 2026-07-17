---
'curvy': minor
---

**Per-axis `map`, tuple interop, and a fix to the `Vector3` spherical setters underneath them.**

**`fromTuple` on each vector module** — `Vector2.fromTuple([x, y])`, `Vector3.fromTuple([x, y, z])`, `Vector4.fromTuple([x, y, z, w])`. The inverse of `components`, useful when interop with array-shaped data (JSON, SVG path commands, libraries that hand back tuples) would otherwise force a spread into `make`.

```ts
// before
const v = Vector2.make(...t)
// after
const v = Vector2.fromTuple(t)
```

**Per-axis and per-polar `map` on all vector modules**, plus the fill-in of `Vector4`'s missing per-axis `get{X,Y,Z,W}` / `set{X,Y,Z,W}` so all three modules now carry the full get/set/map trio.

- **Vector2**: `mapX`, `mapY`, `mapR` (radius), `mapTheta` (angle).
- **Vector3**: `mapX`, `mapY`, `mapZ`, `mapR`, `mapTheta` (polar), `mapPhi` (azimuthal).
- **Vector4**: full `get{X,Y,Z,W}` / `set{X,Y,Z,W}` / `map{X,Y,Z,W}` surface, matching Vector2/3's per-axis API.

Each `map[coord]` takes a `(component: number) => number` and returns a new vector with that component replaced. Both data-first and data-last forms via `dual`, like the existing setters. `Vector4` still has no polar/spherical surface — there is no canonical 4D analog.

```ts
const flipped = Vector2.mapY(v, (y) => -y)
const doubled = v.pipe(Vector2.mapX((x) => x * 2))
const rotated = v.pipe(Vector2.mapTheta((t) => t + Math.PI / 2))
const scaled = v.pipe(Vector3.mapR((r) => r * 2))
```

**`Vector3.setTheta` and `setPhi` fixed.** The `mapTheta` / `mapPhi` above compose on these setters, which weren't holding their documented invariants:

- `setTheta(v, theta)` was using `v.y` directly in place of the azimuthal angle, so it didn't actually preserve `phi` and produced garbage for any vector with `v.y` not coincidentally equal to its azimuthal angle in radians.
- `setPhi(v, phi)` was rotating around the origin using `magnitude(v)` as the xy-projection length, so the result didn't lie on the original sphere — magnitude wasn't preserved.

Both now correctly hold "change one spherical component, preserve the other two" — `setTheta` keeps `r` and `phi`, `setPhi` keeps `r` and `theta`. The fix also corrects the internal parameter names (`setTheta`'s arg was named `phi` and vice versa). Public TypeScript types are unchanged, and `mapTheta` / `mapPhi` produce correct results automatically because they sit on top.
