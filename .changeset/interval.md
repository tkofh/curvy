---
'curvy': major
---

**Endpoint inclusivity is now part of the `Interval` value, plus a 2D `Interval2d` product type.**

**Inclusivity moves into the value.** The `Interval` type is now a discriminated union of four variants — `Closed` (`[a, b]`), `OpenStart` (`(a, b]`), `OpenEnd` (`[a, b)`), and `Open` (`(a, b)`) — each carrying a literal `kind` discriminant. Operations that depend on inclusivity (`contains`, `filter`, `equals`) dispatch on `kind`; operations that don't (`lerp`, `normalize`, `remap`, `size`, `clamp`, `scaleShift`) accept the broader `Bounds` type so the signature itself documents what each operation reads.

**New `Bounds` type.** The structural minimum — any value with numeric `start` and `end`. Every `Interval` variant extends `Bounds`. Functions that operate on the numeric range without consulting kind take `Bounds`.

**Constructors.** `make` (closed, default), plus `makeOpenStart`, `makeOpenEnd`, `makeOpen`. `fromSize` and `fromMinMax` always produce `Closed`; compose with modifiers to get other kinds.

**Modifiers** — all return new instances, identity on no-ops:

| Function        | Effect                            |
| --------------- | --------------------------------- |
| `toStartOpen`   | Open the start; preserve the end  |
| `toStartClosed` | Close the start; preserve the end |
| `toEndOpen`     | Open the end; preserve the start  |
| `toEndClosed`   | Close the end; preserve the start |
| `toOpen`        | Force both endpoints open         |
| `toClosed`      | Force both endpoints closed       |

The four per-edge modifiers narrow the result type via overloads (e.g. `toStartOpen(Closed) -> OpenStart`, `toStartOpen(OpenEnd) -> Open`).

**Predicates.** Four variant-narrowing (`isClosed`, `isOpen`, `isOpenStart`, `isOpenEnd`) plus four edge-narrowing (`isOpenAtStart`, `isOpenAtEnd`, `isClosedAtStart`, `isClosedAtEnd`).

**Equality.** `equals` now compares both endpoints AND kind — `[0, 1]` and `[0, 1)` are no longer equal. New `aligned` provides the looser numeric-range comparison (`Bounds`-typed) for the previous behavior.

**`unit` and `biunit`** are now typed as `Closed`, not the broader `Interval`. **New `unitOpen`**: the open unit interval `(0, 1)` — the symmetric open counterpart to `unit`, useful for strict-interior filtering (e.g. clipping polynomial roots that must lie strictly inside `[0, 1]`).

```ts
// Before
Interval.contains(i, x, { includeStart: false, includeEnd: false })

// After
Interval.contains(Interval.toOpen(i), x)
// or construct directly:
Interval.contains(Interval.makeOpen(0, 1), x)
```

**`Solution.filterInterval` is renamed to `Solution.clip`** and loses its options arg. Pass an interval of the kind you want:

```ts
// Before
Solution.filterInterval(s, Interval.unit, { includeStart: false, includeEnd: false })

// After
Solution.clip(s, Interval.toOpen(Interval.unit))
// or use the new constant:
Solution.clip(s, Interval.unitOpen)
```

**Float-tolerant containment — `Interval.containsApprox(interval, value, eps?)`** returns `true` when `value` is in the interval or within `eps` of either boundary. Defaults `eps` to `EPSILON` (`1e-10`). Endpoint inclusivity is ignored — at the EPSILON scale the open/closed distinction loses meaning, and the use case is float-tolerant containment checks. Use `contains` for kind-strict semantics.

```ts
Interval.containsApprox(Interval.make(0, 1), 1.0000000001) // true
Interval.containsApprox(Interval.make(0, 1), 1.5) // false
Interval.containsApprox(Interval.make(0, 1), 1.5, 1) // true (explicit eps)
```

**New `Interval2d` + `Bounds2d`.** An `Interval2d` is the Cartesian product of two intervals — the smallest abstraction for "is this curve inside this region?" without dragging in a richer rectangle/transform model. It mirrors the `Interval`/`Bounds` split in 1D: `Interval2d` carries per-axis kinds; `Bounds2d` is the structural minimum used by operations (like `size`) that don't depend on endpoint inclusivity.

```ts
import { Interval, Interval2d } from 'curvy/interval'
import { Vector2 } from 'curvy/vector'

const allowed = Interval2d.make(Interval.make(0, 100), Interval.make(0, 1))
Interval2d.containsVector(allowed, Vector2.make(50, 0.5)) // true
```

`Interval2d<X, Y>` is generic over per-axis subtypes so a closed-on-closed value stays `Interval2d<Closed, Closed>` and mixed-kind values preserve that information through the type system.

**Surface:**

- `Interval2d.make(xInterval, yInterval)` — preserves both axis subtypes
- `Interval2d.fromCorners(p0, p1)` — order-independent, returns `Interval2d<Closed, Closed>`
- `Interval2d.fromVectors(...points)` — smallest closed value enclosing all inputs
- `Interval2d.containsVector(box, v)` — point-in-region, per-axis kind-aware
- `Interval2d.containsInterval2d(outer, inner)` — subset test, kind-aware on both sides
- `Interval2d.size(box)` — accepts `Bounds2d`, returns `Vector2`
- `Interval2d.union(a, b)` — kind-preserving (see below)
- `Interval2d.equals(a, b)` — kind-aware equality
- `Interval2d.isInterval2d` — guard
- `Bounds2d` — structural minimum `{ x: Bounds; y: Bounds }`

**Kind-preserving union with a collapsing type signature.** `Interval2d.union` returns a type that collapses to the input's shared kind when both axes match, and widens to the open `Interval` type when they differ:

```ts
Interval2d.union(closedA, closedB) // Interval2d<Closed, Closed>
Interval2d.union(openA, openB) // Interval2d<Open, Open>
Interval2d.union(closedA, openB) // Interval2d<Interval, Interval>
```

The runtime is genuinely kind-correct: each endpoint of the result is the extremum of the inputs', and its inclusivity follows the input that contributed it. When endpoints tie, the result is closed at that point if either input includes it.

**`Interval.union(a, b)` and `Interval.containsInterval(outer, inner)`** are the underlying 1D primitives — `union` computes the enclosing range, `containsInterval` is the kind-aware subset test underneath `Interval2d.containsInterval2d`. Both are exposed on the interval module because each is a self-contained operation worth using on its own.
