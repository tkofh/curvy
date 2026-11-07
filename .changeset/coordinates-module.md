---
'curvy': minor
---

**Coordinate systems for charts.** The new `curvy/coordinates` module maps chart-space geometry onto the plane, for layouts that place rectangles in polar coordinates and draw them as SVG.

`Dimension` describes one chart axis:

- `linear(scale?, offset?)`, `power(exponent, scale?, offset?)`, `sqrt(scale?, offset?)`, and `logarithmic(scale?, offset?, base?)` are number lines. A square-root radius keeps each sector's on-screen area proportional to its chart area.
- `cyclical(period)` wraps, for angles and hue, with `radians`, `degrees`, and `turns` as constants. `wrap`, `delta`, `unwrap`, `lerp`, `congruent`, and `contains` handle the seam: `Dimension.delta(Dimension.degrees, 350, 10)` is `20`, the short way across.

`CoordinateSystem` is `cartesian` or `polar({ center?, theta?, winding?, radius?, thetaOrigin? })`. The radius takes any `Dimension` except `cyclical`. A chart point packs into a `Vector2` as `(theta, r)`, angular first, in the same order as `Vector2.fromPolar(theta, r)`. `toCartesian` and `fromCartesian` convert points, and `mapAngle` and `mapRadius` apply one polar axis at a time.

The polar map bends straight lines, so mapping a curve's control points draws the wrong curve. Chart-aligned shapes get exact constructors instead. `arc` (fixed radius), `ray` (fixed angle), and `sector` (a chart rectangle) return a `RationalCubicPath2d`. `arcPathData`, `rayPathData`, and `sectorPathData` emit the same shapes as SVG path data, with native `A` commands for arcs. `containsPoint` hit-tests a sector. `image(system, path, tolerance)` maps any chart-space `CubicPath2d` or `RationalCubicPath2d`, such as a lowered `Arc.elliptical`, to a `CubicPath2d` certified to lie within `tolerance` of the true image.

```ts
const gauge = CoordinateSystem.polar({
  theta: Dimension.degrees,
  thetaOrigin: -90, // chart angle 0 at 12 o'clock
  radius: Dimension.sqrt(10),
})

CoordinateSystem.mapRadius(gauge, 100) // 100
CoordinateSystem.sectorPathData(gauge, { start: 0, end: 90 }, { start: 64, end: 144 })
```

A negative mapped radius reflects through the center in points, rays, and `image`, while `arc` and `sector` throw on one. On a logarithmic radius, operations throw for a chart radius at or below `0`. The "Polar conventions" and "Certified approximations" sections of [PRECISION.md](https://github.com/tkofh/curvy/blob/main/PRECISION.md) give the details.
