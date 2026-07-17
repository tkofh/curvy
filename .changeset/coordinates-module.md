---
'curvy': minor
---

**Coordinate systems and axis dimensions.** A new `curvy/coordinates` module maps chart-space geometry onto the cartesian plane, built for layout engines that position rectangles in polar coordinates and render them as SVG.

**`Dimension`** describes the structure of a single chart axis: `linear(scale?, offset?)` for ordinary number lines and unit conversions, `cyclical(period)` for axes that wrap — angles, hue. The unit constants `radians`, `degrees`, and `turns` are just periods. Cyclical axes get the operations that make splining through angles work:

```ts
import { Dimension } from 'curvy/coordinates'

Dimension.delta(Dimension.degrees, 350, 10) // 20 — the short way across the seam
Dimension.unwrap(Dimension.degrees, [350, 5, 20]) // [350, 365, 380] — lift, spline, then wrap samples
Dimension.lerp(Dimension.degrees, 350, 10, 0.5) // 0
Dimension.congruent(Dimension.radians, 2 * Math.PI - 1e-16, 0) // true
```

`congruent` judges the shortest wrapped difference against a band of `EPSILON * period` — the normalized-domain regime generalized to a domain of size `period` (see `PRECISION.md`).

**`CoordinateSystem`** is a kind-discriminated union of `cartesian` (the identity) and `polar(config?)` — center, angular axis, winding, radial map. Chart points pack as `(theta, r)` into `Vector2` `x`/`y`, angular-first like the rest of the surface. `toCartesian` / `fromCartesian` convert points exactly.

Because the polar map is nonlinear, it does not commute with control-point mapping — converting a curve's control points pointwise produces the wrong curve. Shapes therefore have their own constructors, and they are exact: `arc(s, theta, r)` builds a circular arc as quarter-turn rational cubic segments (the rational-quadratic circle representation, degree-elevated in homogeneous space), and `sector(s, theta, r)` builds the image of an axis-aligned chart rect — an annular sector — as one closed `RationalCubicPath2d`.

```ts
import { CoordinateSystem, Dimension } from 'curvy/coordinates'

const system = CoordinateSystem.polar({ theta: Dimension.degrees })

// Exact geometry for hit-testing and bounds:
const ring = CoordinateSystem.sector(system, { start: 30, end: 90 }, { start: 80, end: 120 })

// Exact SVG, straight into <path d={...}>:
CoordinateSystem.sectorPathData(system, { start: 30, end: 90 }, { start: 80, end: 120 })
```

`arcPathData` / `sectorPathData` emit SVG `A` commands computed from the chart description rather than recovered from curve coefficients, so circles stay circles all the way into the DOM. Degenerate inputs stay constructible (zero sweep, zero radial width, pie slices at inner radius 0), full-turn sectors emit a two-subpath annulus that fills correctly under both `nonzero` and `evenodd`, and sweeps past one period clamp.
