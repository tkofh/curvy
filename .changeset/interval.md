---
'curvy': major
---

**An `Interval` carries its own endpoint inclusivity, replacing the `includeStart`/`includeEnd` options.**

`Interval` is a union of four types, which a `kind` field tells apart: `Interval.Closed` `[a, b]`, `Interval.OpenStart` `(a, b]`, `Interval.OpenEnd` `[a, b)`, and `Interval.Open` `(a, b)`. `Interval.contains` and `Interval.filter` read inclusivity from the interval and no longer take an options argument. Build one with `make` (closed), `makeOpenStart`, `makeOpenEnd`, or `makeOpen`, or convert one with `toOpen`, `toClosed`, `toStartOpen`, `toStartClosed`, `toEndOpen`, or `toEndClosed`.

```ts
// 1.x
Interval.contains(i, x, { includeStart: false, includeEnd: false })
Interval.filter(Interval.unit, values, { includeStart: false })

// 2.0
Interval.contains(Interval.toOpen(i), x)
Interval.filter(Interval.toStartOpen(Interval.unit), values)
```

`Interval.clamp(i, NaN)` returns `NaN`. In 1.x it returned `i.end`.

`contains` and `filter` read `kind`, so they need an interval from a constructor: for a plain `{ start, end }` object, `contains` returns `undefined` and `filter` returns an empty array. Functions that read only the endpoints (`size`, `lerp`, `normalize`, `remap`, `clamp`, `scaleShift`, and the `to*Fn` factories) take the structural `Interval.Bounds` type and accept plain objects.

New in `curvy/interval`:

- `equals` compares endpoints and kind, and `aligned` compares endpoints only. Both allow the small tolerance described in [PRECISION.md](https://github.com/tkofh/curvy/blob/main/PRECISION.md).
- `containsApprox(i, x, eps?)` accepts values within `eps` (default `EPSILON`, `1e-10`) of the range and ignores kind.
- `union`, `containsInterval`, the open unit interval `unitOpen`, and kind predicates such as `isOpen` and `isClosedAtStart`.
- `Interval2d`, the product of an x interval and a y interval, with `make`, `fromCorners`, `fromVectors`, `containsVector`, `containsInterval2d`, `union`, `equals`, `size`, `minDistance`, and `maxDistance`.

Polynomial roots are now a `Solution` rather than an array, so `Interval.filter(Interval.unit, CubicPolynomial.roots(p))` fails to type-check and throws at runtime. Use `Solution.clip(CubicPolynomial.roots(p), Interval.unit)`, which follows the interval's kind the same way.

For every changed signature, see the [migration guide](https://github.com/tkofh/curvy/blob/main/MIGRATION.md).
