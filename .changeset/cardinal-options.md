---
'curvy': minor
---

**Cardinal splines now carry `tension` and `alpha` as part of the spline itself.** Previously these were "evaluation parameters" passed to `toPath` / `toBezier`. They're not — they're identity parameters of the curve: the same control points with different tensions describe different curves. The type now reflects that.

```ts
import { Cardinal2d } from 'curvy/splines'

interface Cardinal2d {
  readonly points: ReadonlyArray<Vector2>
  readonly tension: number // default 0.5
  readonly alpha: number // default 0.5
  // ...
}
```

**Constructors** support two shapes, distinguishable at the first-arg level:

```ts
// Default options (centripetal Catmull-Rom, tension 0.5).
Cardinal2d.make(p0, p1, p2, p3)

// Explicit options first, then control points.
Cardinal2d.make({ tension: 0.7, alpha: 0.5 }, p0, p1, p2, p3)

// Array form with optional options.
Cardinal2d.fromArray([p0, p1, p2, p3])
Cardinal2d.fromArray([p0, p1, p2, p3], { tension: 0.7 })
```

**Pipeable setters** for mid-stream configuration. Control points are preserved across all of these; only the named field changes:

```ts
const tightened = spline.pipe(Cardinal2d.withTension(0.7))
const uniform = spline.pipe(Cardinal2d.withAlpha(0))
const both = spline.pipe(Cardinal2d.withOptions({ tension: 0.2, alpha: 1 }))
```

`Cardinal2d.withOptions` is a partial update — omitted fields are preserved from the input.

**`toPath` and `toBezier` are nullary now** — they read tension/alpha off the spline:

```ts
spline.pipe(Cardinal2d.toPath) // before: Cardinal2d.toPath(0.5)
spline.pipe(Cardinal2d.toBezier)
```

**Defaults are centripetal Catmull-Rom** (`tension = 0.5`, `alpha = 0.5`). Previously `Cardinal2d.toPath(c)` produced uniform Catmull-Rom — visually different. Existing callers who relied on uniform behavior should construct with `{ alpha: 0 }` or pipe through `withAlpha(0)`.

**Alpha is new in 2.0.** Controls chord-length-weighted parameterization:

- `alpha = 0` is **uniform** — classical Catmull-Rom. Can produce cusps and self-intersections when control points cluster.
- `alpha = 0.5` is **centripetal** (Yuksel et al. 2011) — recommended default, eliminates those failure modes at minimal shape cost. **New default.**
- `alpha = 1` is **chordal** — smoother but tends to overshoot.

**`tension` is the renamed `scale`.** The old API took `scale` which was always the Cardinal tension parameter, just misnamed. No semantic change for the parameter itself, only the name and where it lives.

**Endpoint helpers preserve options.** `append`, `prepend`, `withDuplicatedEndpoints`, and `withReflectedEndpoints` carry tension/alpha through to the returned instance.

The `Characteristic.cubicCardinal(tension)` matrix is unchanged — still the correct primitive for the `alpha = 0` case. Non-uniform parameterization (`alpha != 0`) is computed per-segment from chord-length-weighted tangents because the relevant cubic is no longer a fixed characteristic matrix once chord lengths matter.

Coincident endpoints (which `withDuplicatedEndpoints` produces, and `withReflectedEndpoints(c, 0)` falls back to) are handled correctly: the formula has well-defined limits as a chord length goes to zero, and the implementation drops the divergent terms explicitly rather than propagating NaN.
