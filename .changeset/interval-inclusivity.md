---
'curvy': major
---

**Endpoint inclusivity is now part of the `Interval` value, not a per-call option.** The `Interval` type is now a discriminated union of four variants — `Closed` (`[a, b]`), `OpenStart` (`(a, b]`), `OpenEnd` (`[a, b)`), and `Open` (`(a, b)`) — each carrying a literal `kind` discriminant. Operations that depend on inclusivity (`contains`, `filter`, `equals`) dispatch on `kind`; operations that don't (`lerp`, `normalize`, `remap`, `size`, `clamp`, `scaleShift`) accept the broader `Bounds` type so the signature itself documents what each operation reads.

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

The four per-edge modifiers narrow the result type via overloads (e.g. `toStartOpen(Closed) → OpenStart`, `toStartOpen(OpenEnd) → Open`).

**Predicates.** Four variant-narrowing (`isClosed`, `isOpen`, `isOpenStart`, `isOpenEnd`) plus four edge-narrowing (`isOpenAtStart`, `isOpenAtEnd`, `isClosedAtStart`, `isClosedAtEnd`).

**Equality.** `equals` now compares both endpoints AND kind — `[0, 1]` and `[0, 1)` are no longer equal. New `aligned` provides the looser numeric-range comparison (`Bounds`-typed) for the previous behavior.

**`unit` and `biunit`** are now typed as `Closed`, not the broader `Interval`.

```ts
// Before
Interval.contains(i, x, { includeStart: false, includeEnd: false })

// After
Interval.contains(Interval.toOpen(i), x)
// or construct directly:
Interval.contains(Interval.makeOpen(0, 1), x)
```

**`Solution.filterInterval`** loses its options arg. Pass an interval of the kind you want:

```ts
// Before
Solution.filterInterval(s, Interval.unit, { includeStart: false, includeEnd: false })

// After
Solution.filterInterval(s, Interval.toOpen(Interval.unit))
```
