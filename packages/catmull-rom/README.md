# `@curvy/catmull-rom`

Cubic Catmull Rom splines pass through each of their control points except the first and last point. The way they pass
through these points is at a fixed level of tension

## Basic Example

```typescript
import { createCubicCardinalSpline } from '@curvy/catmull-rom'

const catmullRomSpline = createCubicCardinalSpline([
  // This point is not passed through
  {x: -1, y: 0},

  // These points are passed through
  {x: 0, y: 0},
  {x: 0.5, y: 0.5},
  {x: 1, y: 1},

  // This point is not passed through
  {x: 2, y: 1}
])

catmullRomSpline.solveT(0)
// equals { x: 0, y: 0 }

catmullRomSpline.solve({x: 1})
// equals { x: 1, y: 1 }
```