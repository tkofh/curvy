---
'curvy': minor
---

**Exact degree elevation to cubic.** `CubicCurve2d.fromLinear` and `CubicCurve2d.fromQuadratic`, with path-level siblings `CubicPath2d.fromLinear` and `CubicPath2d.fromQuadratic`, re-express lower-degree curves and paths as cubics. Elevation in monomial form is zero-padding — a linear polynomial is a cubic whose `t^2` and `t^3` coefficients are zero — so the elevated curve evaluates bitwise-identically at every parameter, endpoints included, and trait brands (`Continuous`, the per-axis monotonicity brands) carry through the conversion at the type level.

The motivating consumer is `CoordinateSystem.image`, which takes only `CubicPath2d`: a straight chart-space segment now has a sanctioned route into the polar plane, where its image is an Archimedean spiral.

```ts
import { CoordinateSystem, Dimension } from 'curvy/coordinates'
import { LinearCurve2d } from 'curvy/curve'
import { CubicPath2d, LinearPath2d } from 'curvy/path'
import { Vector2 } from 'curvy/vector'

const chartPath = LinearPath2d.make(
  LinearCurve2d.fromEndpoints(Vector2.make(0, 40), Vector2.make(90, 120)),
)
const spiral = CoordinateSystem.image(
  CoordinateSystem.polar({ theta: Dimension.degrees }),
  CubicPath2d.fromLinear(chartPath),
  0.25,
)
```
