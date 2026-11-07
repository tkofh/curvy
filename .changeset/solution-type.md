---
'curvy': major
---

**Polynomial solvers return a `Solution` instead of an array or `null`.**

These functions return a `Solution` from `curvy/solution`, a tagged value (`None`, `One`, `Two`, or `Three`) that holds zero to three results:

- `solveInverse`, `toInverseSolver`, and `roots` on `QuadraticPolynomial` and `CubicPolynomial`, plus `CubicPolynomial.extrema`. In 1.x they returned readonly arrays.
- `LinearPolynomial.solveInverse`, `toInverseSolver`, and `root`. In 1.x they returned `number | null`.
- `domain` on all three polynomials. In 1.x it returned `Interval | null` (`Interval` for cubics), and on a range the polynomial never reaches it could also return a `NaN` interval or throw. Those cases now return `Solution.none`.

`QuadraticPolynomial.extreme` still returns `Vector2 | null`.

A `Solution` has `.length` and is iterable, so destructuring, spread, and `for..of` keep working. It is not an array: index access (`roots[0]`) reads `undefined`, array methods such as `.map` and `.includes` are missing, `Array.isArray` returns `false`, and `JSON.stringify` writes an object. Spread it (`[...roots]`) where you need an array.

```ts
// 1.x
const t = LinearPolynomial.solveInverse(p, 5)
if (t !== null) use(t)
const first = QuadraticPolynomial.roots(q)[0]

// 2.0
const t = LinearPolynomial.solveInverse(p, 5)
if (Solution.isSome(t)) use(t.value)
const first = Solution.valueOrUndefined(QuadraticPolynomial.roots(q))
```

Every non-empty `Solution` has its first value as `.value`, and `Two` and `Three` add `.values`. The namespace provides:

- `isNone`, `isSome`, and `match(s, { onNone, onSome })` to branch on emptiness.
- `valueOrUndefined`, `last`, `min`, and `max`, which return `undefined` when empty.
- `unsafeValue(s, message?)`, `unsafeLast`, `unsafeMin`, and `unsafeMax`, which throw when empty.
- `map` and `filter`.
- `clip(s, interval)`, which keeps the values the interval contains, honoring its endpoint inclusivity.
- `clipApprox(s, interval)`, which also keeps values within `EPSILON` of either end. Use it on solver output, where a valid root can land a few ulps outside.

`curvy/solution` exports only the namespace, so write the type as `Solution.Solution<number>`. Solver signatures use the narrower aliases `Solution.AtMostOne<T>`, `AtMostTwo<T>`, and `AtMostThree<T>`.

For every changed signature, see the [migration guide](https://github.com/tkofh/curvy/blob/main/MIGRATION.md).
