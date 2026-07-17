---
'curvy': minor
---

**First-class circular arcs.** A new `curvy/arc` module makes arcs values rather than constructions: `Arc.circular({ center?, radius, startAngle?, sweep? })` describes a circular arc directly — no coordinate system required — and everything downstream reads from that description. Angles are radians from `+x`, positive rotating `+x` toward `+y`; direction and multiplicity live in the sweep's sign and magnitude, so a negative sweep runs the other way and a sweep past `2 * pi` keeps orbiting. Only `radius` is required — the defaults give a full circle around the origin.

The description keeps the closed-form answers that lowering destroys. `length` is `radius * abs(sweep)`, exact. `solve(arc, t)` is one `cos`/`sin` — and because a circle is traced at constant speed, the uniform parameter is also the arc-length parameter, a property no polynomial path has. `boundingBox` is exact with no tolerance parameter, since extremes only occur at endpoints or crossed axis directions. `startPoint`, `endPoint`, `reverse`, and a tolerance-aware `equals` round out the queries.

```ts
import { Arc } from 'curvy/arc'

const tick = Arc.circular({
  center: Vector2.make(200, 200),
  radius: 120,
  startAngle: -Math.PI / 2,
  sweep: Math.PI / 6,
})

Arc.length(tick) // 20 * pi, in closed form
Arc.toPathData(tick) // 'M 200,80 A 120 120 0 0 1 ...'
```

Lowering is exact and shared with the coordinates module — `CoordinateSystem.arc` and `Arc.toPath` now run the same machinery. `Arc.toPath` builds a `RationalCubicPath2d` of at-most-quarter-turn rational segments, exact up to IEEE 754 rounding, with multi-turn sweeps tracing the circle more than once; transform the lowered path with `RationalCubicPath2d.transform`, since circles are not closed under affine maps but rational cubics are. `Arc.toPathData` emits SVG `A` commands computed from the description, with the same degenerate contracts as `CoordinateSystem.arcPathData`: zero sweep or zero radius emit a bare `M`, full turns close on the exact starting coordinates, and sweeps past one turn clamp to a single circle, which is all path data can express.

`Arc.Circular` is the module's only member today. The kind-named type leaves room for an elliptical sibling and an `Arc` union later without renames, mirroring how `CoordinateSystem` holds `Cartesian` and `Polar`.
