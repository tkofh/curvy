# `@curvy/hermite`

Cubic Hermite splines are drawn with a starting point and an ending point, along with the velocity of the curve coming
out of those points. Points are passed in with the following order:
* P0, or start point
* v0, or start velocity
* P1, or end point
* v1, or end velocity

## Basic Example

```typescript
import { createCubicHermiteSpline } from '@curvy/hermite'

const hermiteSpline = createCubicHermiteSpline([
  // The curve starts at (0, 0)
  { x: 0, y: 0 },
  
  // The curve is leaving the start at 100 to the right
  { x: 100, y: 0 },
  
  // The curve ends at (100, 100)
  { x: 100, y: 100 },
  
  // The curve is leaving the end a bit slower and to the top right
  { x: 50, y: 50 },
])

hermiteSpline.solveT(0)
// equals { x: 0, y: 0 }

hermiteSpline.solve({ x: 100 })
// equals { x: 100, y: 100 }
```