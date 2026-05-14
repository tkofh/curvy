---
'curvy': minor
---

Added per-axis and per-polar `map` to all vector modules, plus filled in `Vector4`'s missing per-axis `get{X,Y,Z,W}` / `set{X,Y,Z,W}` so all three vector modules now have the full get/set/map trio.

**Vector2**: `mapX`, `mapY`, `mapR` (radius), `mapTheta` (angle).
**Vector3**: `mapX`, `mapY`, `mapZ`, `mapR`, `mapTheta` (polar), `mapPhi` (azimuthal).
**Vector4**: full `get{X,Y,Z,W}` / `set{X,Y,Z,W}` / `map{X,Y,Z,W}` surface, matching Vector2/3's per-axis API.

Each `map[coord]` takes a `(component: number) => number` and returns a new vector with that component replaced. Both data-first and data-last forms via `dual`, like the existing setters.

```ts
const flipped = Vector2.mapY(v, (y) => -y)
const doubled = v.pipe(Vector2.mapX((x) => x * 2))
const rotated = v.pipe(Vector2.mapTheta((t) => t + Math.PI / 2))
const scaled = v.pipe(Vector3.mapR((r) => r * 2))
```

`Vector4` still doesn't get a polar/spherical surface — no canonical 4D analog.
