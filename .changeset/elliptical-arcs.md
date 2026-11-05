---
'curvy': minor
---

**Elliptical arcs.** `curvy/arc` gains `Arc.Elliptical` alongside `Arc.Circular`, and a new `Arc` union type covers both. `Arc.elliptical({ center?, radiusX, radiusY, rotation?, startAngle?, sweep? })` describes a piece of a possibly rotated ellipse in SVG's own parametrization: the point at angle `a` is `center + R(rotation) * (radiusX * cos(a), radiusY * sin(a))`. Only the radii are required. The defaults give a full, unrotated ellipse around the origin.

Every arc operation now accepts either kind:

- `solve`, `startPoint`, and `endPoint` evaluate at the parametric angle. That angle is not the direction from the center, and unlike a circle's it is not an arc-length parameter.
- `length` evaluates the incomplete elliptic integral through Carlson's symmetric forms. It runs in a fixed number of steps with relative error near `1e-15`.
- `boundingBox` stays exact in closed form, rotation included.
- `toPath` lowers exactly to rational cubics by carrying the circular construction through the ellipse's stretch and rotation.
- `toPathData` emits native `A rx ry rotation` commands. A flat ellipse (one radius `0`) emits `L` commands through its turning points, since SVG would draw a zero-radius `A` as a single straight line.
- `reverse` keeps the kind, and `equals` compares across the union, so arcs of different kinds are never equal.

```ts
import { Arc } from 'curvy/arc'

const oval = Arc.elliptical({ center: Vector2.make(100, 50), radiusX: 100, radiusY: 50 })
Arc.toPathData(oval) // 'M 200,50 A 100 50 0 0 1 0,50.00000000000001 A 100 50 0 0 1 200,50'
Arc.length(Arc.elliptical({ radiusX: 2, radiusY: 1 })) // 9.688448220547677
```

**`CoordinateSystem.image` accepts rational paths.** The certified polar image now takes a `RationalCubicPath2d` as well as a `CubicPath2d`, so a chart-space ellipse can be drawn in a polar system without an intermediate approximation spending part of the tolerance budget:

```ts
const system = CoordinateSystem.polar({ theta: Dimension.turns })
const node = Arc.elliptical({ center: Vector2.make(0.125, 100), radiusX: 0.125, radiusY: 20 })
CubicPath2d.toPathData(CoordinateSystem.image(system, Arc.toPath(node), 0.25))
```

A rational path's Bernstein weights must be positive, which every lowered arc satisfies, and `image` throws otherwise. On a cartesian system a rational path is approximated with `RationalCubicPath2d.approximateAsCubicPath`, while a polynomial path still comes back unchanged.
