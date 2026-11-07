---
'curvy': major
---

**Imports move to grouped subpaths that export each namespace by name.** In 1.x, each module had its own subpath and you imported it whole with `import * as`. Version 2.0 has 21 subpaths, one per group, and you import namespaces from them by name:

| 1.0.9                                                                                            | 2.0                                                  |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `import * as Vector2 from 'curvy/vector2'` (also `vector3`, `vector4`)                           | `import { Vector2 } from 'curvy/vector'`             |
| `import * as Matrix3x3 from 'curvy/matrix3x3'` (also `matrix2x2`, `matrix4x4`)                   | `import { Matrix3x3 } from 'curvy/matrix'`           |
| `import * as CubicPolynomial from 'curvy/polynomial/cubic'` (also `linear`, `quadratic`)         | `import { CubicPolynomial } from 'curvy/polynomial'` |
| `import * as CubicCurve2d from 'curvy/curve/cubic2d'` (also `linear2d`, `quadratic2d`)           | `import { CubicCurve2d } from 'curvy/curve'`         |
| `import * as CubicPath2d from 'curvy/path/cubic2d'` (also `linear2d`, `quadratic2d`)             | `import { CubicPath2d } from 'curvy/path'`           |
| `import * as Bezier2d from 'curvy/splines/bezier2d'` (also `hermite2d`, `cardinal2d`, `basis2d`) | `import { Bezier2d } from 'curvy/splines'`           |
| `import * as Interval from 'curvy/interval'`                                                     | `import { Interval } from 'curvy/interval'`          |
| `import { pipe, dual, Pipeable } from 'curvy/pipe'`                                              | `import { pipe, dual, Pipeable } from 'curvy/utils'` |
| `import { lerp, clamp, round } from 'curvy/utils'`                                               | `import { lerp, clamp, round } from 'curvy/number'`  |

All ten numeric helpers move to `curvy/number`: `lerp`, `clamp`, `clip`, `normalize`, `remap`, `minMax`, `mod`, `round`, `roundUp`, and `roundDown`. `invariant` stays in `curvy/utils`, and the `PRECISION` constant is removed.

The other 12 subpaths are new and have no 1.x counterpart: `curvy/piecewise`, `curvy/monotonicity`, `curvy/solution`, `curvy/characteristic`, `curvy/transform`, `curvy/coordinates`, `curvy/arc`, `curvy/polygon`, `curvy/quaternion`, `curvy/plane`, `curvy/polyhedron`, and `curvy/camera`. Only the subpaths in `exports` are supported, and file paths into `dist/` are not.

**`curvy/interval` keeps its path and changes its shape.** `import * as Interval from 'curvy/interval'` still resolves. It now binds the module, which exports the namespace as `Interval`, so `Interval.make` is `undefined`. TypeScript reports the missing property, and plain JavaScript throws `TypeError: Interval.make is not a function` at the first call.

**Types.** Every group except `curvy/solution` and `curvy/characteristic` exports each namespace's main type under the namespace's name, so `Vector2` works as a type and `Vector2.Vector2` still does. Write the solution type as `Solution.Solution<T>`. The 1.x secondary types are reachable only through their namespace: `Matrix2x2.Matrix2x2Coordinate` (and the 3x3 and 4x4 forms) and `Interval.ScaleShift`.

The full export-by-export table is in [MIGRATION.md](https://github.com/tkofh/curvy/blob/main/MIGRATION.md).
