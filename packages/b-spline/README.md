# `@curvy/b-spline`

B Splines do not pass through any of the control points intentionally. In exchange, the acceleration of the curve is
guaranteed to be continuous.

## Basic Example

```typescript
import {createCubicBSpline} from '@curvy/catmull-rom'

const bSpline = createCubicBSpline([
  {x: -5, y: 0},
  {x: 0, y: 0},
  {x: 0.5, y: 0.5},
  {x: 1, y: 1},
  {x: 2, y: 1}
])
```