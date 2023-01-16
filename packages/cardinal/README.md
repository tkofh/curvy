# `@curvy/cardinal`

Cubic Cardinal splines pass through each of their control points except the first and last point. The way they pass
through these points can be modified with a tension parameter.

## Basic Example

```typescript
import {createCubicCardinalSpline} from '@curvy/cardinal'

const cardinalSpline = createCubicCardinalSpline(
  [
    // This point is not passed through
    {x: -1, y: 0},

    // These points are passed through
    {x: 0, y: 0},
    {x: 0.5, y: 0.5},
    {x: 1, y: 1},

    // This point is not passed through
    {x: 2, y: 1}
  ],
  // this is the tension. should be between 0 and 1, but doesn't have to be.
  1
)

cardinalSpline.solveT(0)
// equals { x: 0, y: 0 }

cardinalSpline.solve({x: 1})
// equals { x: 1, y: 1 }
```