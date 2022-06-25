# `@curvy/hermite`

## Basic Example

```typescript
import { createCubicCardinalSpline, createCubicTCBSpline } from '@curvy/hermite/src'

const tcbSpline = createCubicTCBSpline(
  // TCB Splines pass through each point provided 
  // and automatically calculate the tangent points
  [
    [0, 0],
    [25, 50],
    [50, 25],
    [75, 100],
    [100, 50]
  ],
  {
    // Tension, Continuity, and Bias should be between -1 and 1
    tension: 0,
    continuity: 0,
    bias: 0,

    // Optionally provide a virtual start and end point
    // Otherwise, the first and last points are re-used
    virtualStart: [-25, 0],
    virtualEnd: [125, 50]
  }
)

const cardinalSpline = createCubicCardinalSpline(
  // Cardinal Splines also pass through each point provided 
  // and automatically calculate the tangent points, but 
  // with only one parameter: a
  [
    [0, 0],
    [25, 50],
    [50, 25],
    [75, 100],
    [100, 50]
  ],
  {
    // A should (but does not need to) be between 0 and 1
    a: 0.5,

    // Optionally provide a virtual start and end point
    // Otherwise, the first and last points are re-used
    virtualStart: [-25, 0],
    virtualEnd: [125, 50]
  }
)

```