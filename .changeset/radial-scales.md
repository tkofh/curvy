---
'curvy': minor
---

**Square-root, power, and logarithmic radii.** `curvy/coordinates` gains two number-line `Dimension` kinds alongside `Linear`, and polar systems accept either as their radial axis:

- `Dimension.power(exponent, scale?, offset?)` maps `x` to `scale * sign(x) * abs(x)^exponent + offset`. `Dimension.sqrt(scale?, offset?)` is the exponent-`0.5` shorthand. With offset `0`, a square-root radius makes every sector's on-screen area proportional to its chart-space area, so outer rings stop looking bigger than their data.
- `Dimension.logarithmic(scale?, offset?, base?)` maps `x` to `scale * log(x) + offset`, base `10` by default, for data spanning orders of magnitude. Bases `10`, `2`, and `Math.E` use the dedicated `Math` functions, so exact powers of the base map to exact integers.

```ts
import { CoordinateSystem, Dimension } from 'curvy/coordinates'

const areaTrue = CoordinateSystem.polar({ theta: Dimension.degrees, radius: Dimension.sqrt(10) })
CoordinateSystem.mapRadius(areaTrue, 100) // 100

// Decades 40px apart, with chart value 1 at radius 20:
const decades = CoordinateSystem.polar({ radius: Dimension.logarithmic(40, 20) })
CoordinateSystem.mapRadius(decades, 1000) // 140
```

Every coordinate-system operation supports the new radii. `arc`, `sector`, and `ray` stay exact, since a fixed chart radius still maps to one circle and a fixed angle to one straight line. `fromCartesian` inverts the map, and `image` certifies its usual Hausdorff bound through the non-linear map. The power map is signed, so it is total and keeps the existing reflection convention for negative mapped radii. A logarithmic radius has no image at or below zero, so operations that map such a chart radius throw, and `image` throws when a path reaches one. `PRECISION.md`'s "Polar conventions" section records the reasoning.

`polar` now rejects only a `Cyclical` radius. The `Dimension` operations (`delta`, `lerp`, `contains`, and the rest) treat both new kinds like `Linear`, reading chart values directly. Code that switches exhaustively on `Dimension['kind']` needs cases for `'power'` and `'logarithmic'`.
