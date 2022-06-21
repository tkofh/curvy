# Curvy

**Define and access Cubic Bezier Splines**

Stitch together one or more Cubic Bézier curves into a spline, then use the spline for interpolation, lookup, or
anything else!

## Features

* **Intuitive Definition**: An array of 2D points define the curves
* **Easy Access**: Solve the curve at a position along the curve, or from either axis
* **Useful Metadata**: Get the monotonicity along each axis, the bounding box, and the extrema along the curve

## Installation

Curvy can be found on npm and installed with your favorite package manager.

The `@curvy/bezier` package covers the common use cases:

```shell
$ yarn add @curvy/bezier
# or
$ npm install @curvy/bezier
```

## Features

### `@curvy/bezier`

[![npm version](https://img.shields.io/npm/v/@curvy/bezier)](https://www.npmjs.com/package/@curvy/bezier)

`@curvy/bezier` covers the common use cases for Cubic Bézier splines.

```typescript
import { createCubicBezierSpline } from '@curvy/bezier'

const easeInOut = createCubicBezierSpline([
  { x: 0, y: 0 },
  { x: 0.5, y: 0.2 },
  { x: 0.5, y: 0.8 },
  { x: 1, y: 1 }
])

// solve y for a given x
const y = easeInOut.solveY(0.25)

// solve x for a given y
const x = easeInOut.solveX(0.75)

// solve the point at a given t along the curve
const pointAtT = easeInOut.solveT(0.9)

// solve the point at a given distance along the curve
const pointATLength = easeInOut.solveLength(0.8)
```

### `@curvy/spline-utils`

[![npm version](https://img.shields.io/npm/v/@curvy/spline-utils)](https://www.npmjs.com/package/@curvy/spline-utils)

`@curvy/spline-utils` contains utilities for working with splines and extracting additional information from them

```typescript
import { createCubicBezierSpline } from '@curvy/bezier'
import { mapSpline, remapSpline } from '@curvy/spline-utils'

const base = createCubicBezierSpline([
  { x: 0, y: 0 },
  { x: 0.25, y: 5 },
  { x: 0.75, y: -4 },
  { x: 1, y: 1 }
])

// map a spline from its current bounding box to a new one
const mapped = mapSpline(base, { x: { min: 10, max: 20 }, y: { min: -20, max: -10 } })

// map a spline from one bounding box to another
const remapped = remapSpline(
  base,
  { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } },
  { x: { min: -10, max: 10 }, y: { min: -10, max: 10 } }
)
```

### `@curvy/visualize`

![npm version](https://img.shields.io/npm/v/@curvy/visualize)

`@curvy/visualize` helps visualize splines after they've been created

```typescript
import { createCubicBezierSpline } from '@curvy/bezier'
import { toPath } from '@curvy/visualize'

const spline = createCubicBezierSpline([
  { x: 0, y: 0 },
  { x: 25, y: 500 },
  { x: 75, y: -400 },
  { x: 100, y: 100 }
])

document.write(`<svg viewBox="0 0 120 120">
  <path stroke-width="0.1" stroke="black" fill="none" d="${toPath(spline)}" />
</svg>`)
```