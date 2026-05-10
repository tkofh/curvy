---
'curvy': minor
---

Add per-domain namespace index entry points so callers can import related types in one shot rather than chaining several deep imports. Each new entry re-exports the domain's modules as namespaces named after the public type:

| Subpath | Re-exports |
|---|---|
| `curvy/curve` | `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d` |
| `curvy/path` | `LinearPath2d`, `QuadraticPath2d`, `CubicPath2d` |
| `curvy/splines` | `Bezier2d`, `Cardinal2d`, `Hermite2d`, `Basis2d` |
| `curvy/polynomial` | `LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial` |
| `curvy/matrix` | `Matrix2x2`, `Matrix3x3`, `Matrix4x4` |
| `curvy/vector` | `Vector2`, `Vector3`, `Vector4` |

```ts
// before
import * as CubicCurve2d from 'curvy/curve/cubic2d'
import * as QuadraticCurve2d from 'curvy/curve/quadratic2d'
import * as LinearCurve2d from 'curvy/curve/linear2d'

// after
import { CubicCurve2d, QuadraticCurve2d, LinearCurve2d } from 'curvy/curve'
// or
import * as Curve from 'curvy/curve'
Curve.CubicCurve2d.solve(c, 0.5)
```

The fine-grained subpaths (e.g. `curvy/curve/cubic2d`) continue to work unchanged. Modern bundlers tree-shake through namespace re-exports correctly given the package's `sideEffects: false` declaration, so importing a domain index and using a single member from it does not pull in the rest of the domain.
