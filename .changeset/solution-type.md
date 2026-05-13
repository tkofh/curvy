---
'curvy': major
---

Replace the bare `ZeroOrOne<T>` / `ZeroToOne<T>` / `ZeroToTwo<T>` / `ZeroToThree<T>` return shapes with a single `Solution<T>` type and namespace, exposed at `curvy/solution`.

Each variant is a small tagged object with named accessors. `One<T>` exposes `.value: T`; `Two<T>` and `Three<T>` expose `.values: readonly [T, T]` / `readonly [T, T, T]`. All variants have a `_tag` discriminator and a `length` field, are iterable via `Symbol.iterator`, and are `Pipeable` — so a `Solution` can sit at the head of a `pipe(...)` chain. Existing iteration patterns (`for..of`, spread, `result.length`) keep working without any adapter; what's new is the named-accessor ergonomics and a small operations API.

**Type aliases:**

```ts
import { Solution } from 'curvy/solution'

Solution.None // { _tag: 'none', length: 0, ...iterable }
Solution.One<T> // { _tag: 'one', length: 1, value: T, ...iterable }
Solution.Two<T> // { _tag: 'two', length: 2, value: T, values: readonly [T, T], ...iterable }
Solution.Three<T> // { _tag: 'three', length: 3, value: T, values: readonly [T, T, T], ...iterable }
Solution.Some<T> // One | Two | Three — every Some<T> exposes `.value: T`
Solution<T> // None | Some<T> — most permissive

// At-most aliases for trait-narrowed return shapes
Solution.AtMostOne<T> // None | One<T>
Solution.AtMostTwo<T> // None | One<T> | Two<T>
Solution.AtMostThree<T> // = Solution<T>
```

`.value` is the primary (first / leftmost) value and is uniformly available on every non-empty variant. So narrowing a `Solution<T>` via `Solution.isSome(s)` is enough to get a typed `s.value`.

**Operations:**

- `Solution.none`, `Solution.one(v)`, `Solution.two(a, b)`, `Solution.three(a, b, c)`, `Solution.fromArray(arr)` — constructors.
- `Solution.isNone(s)` / `Solution.isSome(s)` — type-narrowing predicates.
- `Solution.match(s, { onNone, onSome })` (and pipeable form) — pattern-match by emptiness; `onSome` receives the input's narrowed type so an `AtMostOne<T>` input gives `onSome` a `One<T>` to read `.value` from.
- `s.value` — primary value, available directly on any `Some<T>`.
- `Solution.valueOrUndefined(s)` — primary value or `undefined` for the open `Solution<T>` case.
- `Solution.last(s)` — `T | undefined` (returns `T` when called on `Some<T>`).
- `Solution.min(s)` / `Solution.max(s)` — numeric `number | undefined` (returns `number` when called on `Some<number>`).
- `Solution.unsafeFirst(s)` / `Solution.unsafeLast(s)` / `Solution.unsafeMin(s)` / `Solution.unsafeMax(s)` — throw on empty.
- `Solution.filter(s, predicate)` — drop values that don't match.
- `Solution.clip(s, interval)` — drop numeric values outside an interval.
- `Solution.map(s, f)` — transform every value.

**API migration:**

Every `solveInverse` / `domain` / `roots` / `extrema` / `root` return type is renamed to its `Solution.AtMost*` equivalent. The runtime shape is identical for the previously-tuple-shaped returns (quadratic / cubic).

The one runtime behavior change: **`LinearPolynomial.solveInverse` now returns `Solution.AtMostOne<number>` instead of `number | null`**, so the constant-polynomial case yields `Solution.none` (`[]`) rather than `null`. The same goes for `LinearPolynomial.domain`, `LinearPolynomial.toInverseSolver`, `LinearPolynomial.root`, and `QuadraticPolynomial.domain`. Callers checking `result === null` should switch to `Solution.isNone(result)` (or `result.length === 0`); callers using `result` as a `number` should index it (`result[0]`) or use `Solution.first(result)`.

```ts
// before
const t = LinearPolynomial.solveInverse(p, 5)
if (t === null) {
  /* constant polynomial */
} else {
  use(t)
}

// after — direct narrowing
const t = LinearPolynomial.solveInverse(p, 5)
if (Solution.isSome(t)) {
  use(t.value) // .value is type-safe under Some<T>
}

// after — pattern match
const result = LinearPolynomial.solveInverse(p, 5).pipe(
  Solution.match({
    onNone: () => 0,
    onSome: ({ value }) => value * 2,
  }),
)
```

When you've earned narrower types via the trait system — e.g. `LinearPolynomial<Monotonic>.solveInverse` returns `Solution.One<number>` rather than `Solution.AtMostOne<number>` — `.value` is directly accessible without any narrowing check, since `One<T>` is non-empty by construction.

The rest of the existing tuple-returning operations (`QuadraticPolynomial.solveInverse`, `CubicPolynomial.solveInverse`, the curve `solveAtX` / `solveAtY` helpers, etc.) are completely unchanged at runtime — only the type names move.
