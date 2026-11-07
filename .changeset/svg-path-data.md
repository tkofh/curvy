---
'curvy': major
---

**The `@curvy/svg` package is discontinued, and curvy writes SVG path data itself.** `LinearPath2d.toPathData`, `QuadraticPath2d.toPathData` and `CubicPath2d.toPathData` return the value for a `<path>` element's `d` attribute, using `L`, `Q` and `C` commands respectively. A gap between adjacent curves starts a fresh `M`. `RationalCubicPath2d` has no `toPathData`. Each curve module's `toPathDataSegment` writes one curve's command without the leading `M`, and `Arc` and `Polygon2d` have their own `toPathData`.

Drop the `@curvy/svg` dependency and go from spline to path to string:

```ts
// 1.0.9
import * as Path from '@curvy/svg/path'
import * as Bezier2d from 'curvy/splines/bezier2d'

const d = Bezier2d.make(p0, p1, p2, p3).pipe(Path.fromBezier2d, Path.render)

// 2.0
import { CubicPath2d } from 'curvy/path'
import { Bezier2d } from 'curvy/splines'

const d = Bezier2d.make(p0, p1, p2, p3).pipe(Bezier2d.toPath, CubicPath2d.toPathData)
```

`@curvy/svg` serialized only `Bezier2d`. The other splines, except `RationalBezier2d`, take the same route through their own `toPath`.

**The printed digits differ from `render`.** `render` printed the stored control points, which 1.x had rounded to 8 decimal places. `toPathData` recovers the control points from each curve's polynomial coefficients at full double precision, so fractional input picks up floating-point noise. For the control points (0.1, 0.7), (1.3, 2.9), (3.7, 2.1), (4.3, 0.3):

```text
1.0.9  M 0.1,0.7 C 1.3,2.9 3.7,2.1 4.3,0.3
2.0    M 0.1,0.7 C 1.3000000000000003,2.8999999999999995 3.7000000000000006,2.1 4.3,0.30000000000000004
```

Small integer coordinates print as before. `toPathData` has no precision option, so round the numbers in the string when you need short output or stable snapshots:

```ts
const short = d.replace(/-?[\d.]+(?:e[-+]?\d+)?/g, (n) => String(Number(Number(n).toFixed(6))))
```

See [MIGRATION.md](https://github.com/tkofh/curvy/blob/main/MIGRATION.md) for the full upgrade guide.
