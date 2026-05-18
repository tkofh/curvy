---
'curvy': minor
---

**`RationalCubicCurve2d.fromBezierPoints` 2-arg easing overload.** A new overload pins the endpoints at `(0, 0)` and `(1, 1)` with unit weights, leaving the two interior handles as the only inputs — the rational analog of CSS's `cubic-bezier(x1, y1, x2, y2)`.

```ts
import { RationalCubicCurve2d } from 'curvy/curve'
import { Vector2 } from 'curvy/vector'

// CSS ease-in-out, with weights for true rational control. Unit weights here
// recover the polynomial Bézier.
const ease = RationalCubicCurve2d.fromBezierPoints(
  Vector2.makeWeighted(0.42, 0, 1),
  Vector2.makeWeighted(0.58, 1, 1),
)

RationalCubicCurve2d.solve(ease, 0) // → (0, 0)
RationalCubicCurve2d.solve(ease, 1) // → (1, 1)
```

The four-arg form is unchanged; the runtime dispatches on `arguments.length`.
