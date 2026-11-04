---
'curvy': minor
---

**Rays and the polar scalar maps.** `CoordinateSystem.ray` constructs the exact cartesian image of the chart-space segment that holds `theta` fixed and runs `r` across a radial span — the radial counterpart of `arc`. On a polar system the image is a single straight rational segment; on a cartesian system it is the vertical segment at `x = theta`. `rayPathData` emits the same segment as SVG `M`/`L` commands, with a bare `M` for a zero-length span.

Unlike `arc` and `sector`, `ray` accepts negative mapped radii: a negative mapped radius reflects through the center — the same convention `toCartesian` and `image` already apply — and a span whose mapped radii change sign stays one straight segment passing through the center. The split is deliberate: point maps are total under the reflection convention, while a reflected _shape_ renders at the antipodal angle, which in layout code is the signature of a broken radial map. The new "Polar conventions" section of `PRECISION.md` records the rationale, alongside a "Working with certificates" section on why certified tolerances only compose in output space.

`mapAngle` and `mapRadius` expose the two scalar halves of `toCartesian`: chart angle to on-screen radians (unwrapped, so differences are sweeps), and chart radius to signed on-screen distance. Both narrow their system parameter to `Polar` — the module's first kind-narrowed exports. The module doc now states the principle: operations stay total over the union wherever both kinds have an honest reading, and narrow their parameter where only one does.

```ts
import { CoordinateSystem, Dimension } from 'curvy/coordinates'

const system = CoordinateSystem.polar({ theta: Dimension.degrees, thetaOrigin: -90 })

// A radial gridline at 12 o'clock, from the hole to the rim:
CoordinateSystem.rayPathData(system, 0, { start: 80, end: 120 })

// Rotate a tick label to face its angle (SVG rotate() wants degrees):
const rotate = (180 / Math.PI) * CoordinateSystem.mapAngle(system, 45)
```
