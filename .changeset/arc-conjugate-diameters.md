---
'curvy': minor
---

**Ellipses from conjugate semi-diameters.** `Arc.fromConjugateDiameters(center, a, b)` builds the full ellipse traced by `center + a * cos(t) + b * sin(t)`, which is how a circle comes out of any linear map, such as a parallel projection. The arc starts at `center + a`, runs toward `center + b`, and keeps that parametrization, so a point at parametric extent `t` from the start is `center + a * cos(t) + b * sin(t)`. It finds `radiusX`, `radiusY`, and `rotation` for you.

```ts
import { Arc } from 'curvy/arc'
import { Vector2 } from 'curvy/vector'

const e = Arc.fromConjugateDiameters(Vector2.zero, Vector2.make(2, 0), Vector2.make(1, 1))

Arc.solve(e, 0.25) // Vector2(1, 1), up to rounding
```
