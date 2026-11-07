---
'curvy': minor
---

**`Arc` (`curvy/arc`) describes circular and elliptical arcs as values.** The type is the union of `Arc.Circular` and `Arc.Elliptical`, built three ways:

- `Arc.circular({ center?, radius, startAngle?, sweep? })`
- `Arc.elliptical({ center?, radiusX, radiusY, rotation?, startAngle?, sweep? })`, in SVG's parametrization: the point at angle `a` is `center + R(rotation) * (radiusX * cos(a), radiusY * sin(a))`.
- `Arc.fromConjugateDiameters(center, a, b)`, the full ellipse `center + a * cos(t) + b * sin(t)`. A circle under a linear map, such as a parallel projection, comes out in this form, and the constructor works out the radii and rotation.

Angles are radians, and a positive angle turns `+x` toward `+y`, as [CONVENTIONS.md](https://github.com/tkofh/curvy/blob/main/CONVENTIONS.md) sets out. A negative `sweep` runs the other way, and one past `2 * pi` keeps going around. The defaults give a full circle or ellipse around the origin.

Every operation takes either kind:

- `solve(arc, t)`, `startPoint`, and `endPoint` evaluate in closed form, with `t in [0, 1]` a fraction of the sweep. On a circle `t` is also proportional to arc length; on an ellipse it is not.
- `length` is closed-form for a circle and an elliptic integral with relative error near `1e-15` for an ellipse.
- `boundingBox` is exact and takes no tolerance.
- `toPath` lowers the arc exactly to a `RationalCubicPath2d`. To transform an arc, transform that path.
- `toPathData` emits SVG `A` commands. Zero sweep or radius emits a bare `M`, a flat ellipse emits `L` commands, and a sweep past one turn clamps to one lap.
- `reverse` keeps the kind, and `equals` compares within tolerance, with arcs of different kinds never equal.

```ts
const tick = Arc.circular({
  center: Vector2.make(200, 200),
  radius: 120,
  startAngle: -Math.PI / 2,
  sweep: Math.PI / 6,
})
Arc.length(tick) // 62.83..., which is 20 * pi
Arc.toPathData(tick) // 'M 200,80 A 120 120 0 0 1 260,96.07695154586736'

const e = Arc.fromConjugateDiameters(Vector2.zero, Vector2.make(2, 0), Vector2.make(1, 1))
Arc.solve(e, 0.25) // Vector2(1, 1) up to rounding: a quarter turn, at the tip of b
```
