---
'curvy': major
---

**Consolidated public module surface.** The `package.json` `exports` map is reduced from ~30 subpaths to 11. Every group exposes a single namespace-indexed subpath, and per-module subpaths are removed. The internal directory layout is unchanged; only the public import shape moves.

**New v2 surface:**

| Subpath                | Style         | Members                                                                                                                                |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `curvy/vector`         | namespaces    | `Vector2`, `Vector3`, `Vector4`                                                                                                        |
| `curvy/matrix`         | namespaces    | `Matrix2x2`, `Matrix3x3`, `Matrix4x4`                                                                                                  |
| `curvy/polynomial`     | namespaces    | `LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial`                                                                           |
| `curvy/curve`          | namespaces    | `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`, `RationalCubicCurve2d`                                                            |
| `curvy/path`           | namespaces    | `LinearPath2d`, `QuadraticPath2d`, `CubicPath2d`, `RationalCubicPath2d`                                                                |
| `curvy/splines`        | namespaces    | `Bezier2d`, `Hermite2d`, `Cardinal2d`, `Basis2d`, `RationalBezier2d`                                                                   |
| `curvy/interval`       | namespace     | `Interval`                                                                                                                             |
| `curvy/solution`       | namespace     | `Solution`                                                                                                                             |
| `curvy/characteristic` | namespace     | `Characteristic`                                                                                                                       |
| `curvy/number`         | named exports | `lerp`, `clamp`, `clip`, `normalize`, `remap`, `minMax`, `mod`, `round`, `roundUp`, `roundDown`, `epsEquals`, `clampToZero`, `EPSILON` |
| `curvy/utils`          | named exports | `pipe`, `dual`, `Pipeable`, `invariant`                                                                                                |

The split principle: **namespaces for things that look like algebraic structures with operations** (you build them and operate on them), **named exports for free-floating utilities** (you call them inline). Consumers can still promote any of the named-export modules to a namespace via `import * as` if they prefer.

**Per-module subpaths removed.** Every previous `curvy/<group>/<module>` subpath collapses into the group index:

```ts
// before
import * as Vector2 from 'curvy/vector2'
import * as CubicCurve2d from 'curvy/curve/cubic2d'
import * as RationalCubicPath2d from 'curvy/path/rationalCubic2d'
import * as Bezier2d from 'curvy/splines/bezier2d'

// after
import { Vector2 } from 'curvy/vector'
import { CubicCurve2d, RationalCubicCurve2d } from 'curvy/curve'
import { RationalCubicPath2d } from 'curvy/path'
import { Bezier2d } from 'curvy/splines'
```

The internal namespace identity (`Vector2.make`, `CubicCurve2d.solve`, etc.) is unchanged — only the path you import from moves. Tree-shaking remains intact: importing one namespace from a group index does not pull in its siblings, given `"sideEffects": false`.

**Solo namespaces (`Interval`, `Solution`, `Characteristic`) now exported through wrappers.** These were previously bare-module subpaths. Each now lives in a directory whose `index.ts` re-exports the implementation as a namespace, so the import shape matches the multi-namespace groups:

```ts
// before
import * as Interval from 'curvy/interval'
import * as Solution from 'curvy/solution'
import * as Characteristic from 'curvy/characteristic'

// after
import { Interval } from 'curvy/interval'
import { Solution } from 'curvy/solution'
import { Characteristic } from 'curvy/characteristic'
```

**New `curvy/number` module.** The math utilities (`lerp`, `clamp`, `round`, `epsEquals`, etc.) move out of `curvy/utils` into a dedicated module. The grouping reflects what each is for: `curvy/utils` is now language plumbing every other module needs (`pipe`, `dual`, `Pipeable`, `invariant`); `curvy/number` is numeric utilities.

```ts
// before
import { lerp, clamp, epsEquals } from 'curvy/utils'

// after
import { lerp, clamp, epsEquals } from 'curvy/number'
```

**`curvy/pipe` removed.** `pipe`, `dual`, and `Pipeable` move into `curvy/utils` alongside `invariant`. The `curvy/pipe` subpath is gone.

```ts
// before
import { dual, pipe, Pipeable } from 'curvy/pipe'
import { invariant } from 'curvy/utils'

// after
import { dual, pipe, Pipeable, invariant } from 'curvy/utils'
```

**Migration summary table.**

| Before                                                      | After                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| `import * as Vector2 from 'curvy/vector2'`                  | `import { Vector2 } from 'curvy/vector'`                |
| `import * as Matrix4x4 from 'curvy/matrix4x4'`              | `import { Matrix4x4 } from 'curvy/matrix'`              |
| `import * as CubicPolynomial from 'curvy/polynomial/cubic'` | `import { CubicPolynomial } from 'curvy/polynomial'`    |
| `import * as CubicCurve2d from 'curvy/curve/cubic2d'`       | `import { CubicCurve2d } from 'curvy/curve'`            |
| `import * as CubicPath2d from 'curvy/path/cubic2d'`         | `import { CubicPath2d } from 'curvy/path'`              |
| `import * as Bezier2d from 'curvy/splines/bezier2d'`        | `import { Bezier2d } from 'curvy/splines'`              |
| `import * as Interval from 'curvy/interval'`                | `import { Interval } from 'curvy/interval'`             |
| `import * as Solution from 'curvy/solution'`                | `import { Solution } from 'curvy/solution'`             |
| `import * as Characteristic from 'curvy/characteristic'`    | `import { Characteristic } from 'curvy/characteristic'` |
| `import { lerp } from 'curvy/utils'`                        | `import { lerp } from 'curvy/number'`                   |
| `import { dual } from 'curvy/pipe'`                         | `import { dual } from 'curvy/utils'`                    |
