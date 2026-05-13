---
'curvy': major
---

Inline SVG path serialization into the core `*Path2d` modules and remove the separate `@curvy/svg` package. Each path type now exports `toPathData`, which serializes the path as an SVG path data string (the value of a `<path>` element's `d` attribute):

- `LinearPath2d.toPathData` — emits `M` and `L` commands.
- `QuadraticPath2d.toPathData` — emits `M` and `Q` commands.
- `CubicPath2d.toPathData` — emits `M` and `C` commands.

Discontinuities between adjacent curves emit a fresh `M` command, so paths with disjoint segments serialize correctly.

**Migration.** Replace `Path.fromBezier2d` + `Path.render` from `@curvy/svg` with `Bezier2d.toPath` + `CubicPath2d.toPathData`:

```ts
// before
import * as Path from '@curvy/svg/path'
import * as Bezier2d from 'curvy/splines/bezier2d'

const d = Bezier2d.make(p0, p1, p2, p3).pipe(Path.fromBezier2d, Path.render)

// after
import { CubicPath2d } from 'curvy/path'
import { Bezier2d } from 'curvy/splines'

const d = Bezier2d.make(p0, p1, p2, p3).pipe(Bezier2d.toPath, CubicPath2d.toPathData)
```

Because `toPathData` works on the polynomial representation, it covers any path — not just ones built from Béziers. Cardinal, Hermite, and Basis splines all serialize through their respective `toPath` outputs without needing a Bézier-specific path step.
