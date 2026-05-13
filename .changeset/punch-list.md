---
'curvy': minor
---

A handful of ergonomics improvements surfaced by real consumer usage.

**`Solution.unsafeValue(s, message?)`.** Throws on `None`, returns `s.value` on `Some`. The data-last form requires a message — it's where the assertion is hardest to read without one:

```ts
const x = CubicPolynomial.solveInverse(p, y).pipe(
  Solution.unsafeValue('expected a monotonic inverse'),
)
```

Useful when the type system can't prove non-emptiness but you have a domain reason to assert it without going through the trait refiner first.

**`Cardinal2d.withInterpolatedEndpoints`.** Names the intent — "the resulting curve interpolates its first and last control points" — that `withDuplicatedEndpoints` and `withReflectedEndpoints(c, 0)` already provide. The latter two are mechanism-named; the new one matches the user's question.

```ts
spline.pipe(Cardinal2d.withInterpolatedEndpoints, Cardinal2d.toPath)
```

**`fromTuples` on every spline.** Convenience constructor for data coming from JSON/CSV/tuple-shaped sources:

```ts
import { Bezier2d, RationalBezier2d } from 'curvy/splines'

Bezier2d.fromTuples([[0, 0], [1, 2], [3, 2], [4, 0]])
Hermite2d.fromTuples([[0, 0], [1, 1], [1, 0], [1, -1]]) // alternating point/velocity
Cardinal2d.fromTuples([[0, 0], [1, 1], [2, 0]], { tension: 0.5 })
Basis2d.fromTuples([[0, 0], [1, 1], [2, 0]])
RationalBezier2d.fromTuples([[0, 0, 1], [1, 2, 5], [3, 2, 5], [4, 0, 1]]) // (x, y, weight)
```

**`coefficients(p)` on every polynomial.** Returns the monomial coefficients as a typed tuple — useful for downstream consumers who want destructuring or array-style access alongside the existing `.c0`/`.c1`/etc. properties:

```ts
import { CubicPolynomial } from 'curvy/polynomial'

const [c0, c1, c2, c3] = CubicPolynomial.coefficients(p)
```

Tuple arity matches the polynomial's degree (`Linear` → `[number, number]`, etc.).
