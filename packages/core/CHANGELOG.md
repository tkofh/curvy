# Change Log

## 2.0.0-alpha.1

### Minor Changes

- **New `curvy/box` module + `boundingBox` on every curve and path.** A `Box2d` is the Cartesian product of two intervals — the smallest abstraction that lets you say "is this curve inside this region?" without dragging in a richer rectangle/transform abstraction.

  ```ts
  import { Box2d } from "curvy/box";
  import { Interval } from "curvy/interval";
  import { Vector2 } from "curvy/vector";

  const allowed = Box2d.make(Interval.make(0, 100), Interval.make(0, 1));
  Box2d.containsVector(allowed, Vector2.make(50, 0.5)); // true
  ```

  The type is generic over per-axis interval subtype so a closed-on-closed box stays `Box2d<Closed, Closed>` and mixed-openness boxes preserve that information through the type system. The minimum surface:

  - `Box2d.make(xInterval, yInterval)` — preserves both axis subtypes
  - `Box2d.fromCorners(p0, p1)` — order-independent, returns `Box2d<Closed, Closed>`
  - `Box2d.fromVectors(...points)` — smallest closed box enclosing all inputs
  - `Box2d.containsVector(box, v)` — point-in-box test, respects per-axis kinds
  - `Box2d.containsBox(outer, inner)` — subset test, respects kinds on both sides
  - `Box2d.size(box)` — `(width, height)` as `Vector2`
  - `Box2d.equals(a, b)` — kind-aware equality
  - `Box2d.union(a, b)` — smallest closed box enclosing both
  - `Box2d.isBox2d` — guard

  **`boundingBox` is now available on every polynomial curve and path:**

  ```ts
  import { CubicCurve2d } from "curvy/curve";
  import { CubicPath2d } from "curvy/path";

  CubicCurve2d.boundingBox(curve); // Box2d<Closed, Closed>
  CubicPath2d.boundingBox(path); // Box2d<Closed, Closed> — union over segments
  ```

  The curve-level implementations account for interior extrema (so the box is tight against the curve, not just its control polygon). The path-level implementations union per-segment boxes via `Box2d.union`.

  Rational cubic curves don't get a `boundingBox` yet — computing the bbox of `(x(t)/w(t), y(t)/w(t))` requires finding roots of a degree-5 polynomial, which is a real implementation rather than a one-liner over existing primitives. Deferred to a later pass.

  **New `Interval.containsInterval(outer, inner)` helper.** Kind-aware interval-subset test, the primitive underneath `Box2d.containsBox`. Exposed on the interval module because it's a self-contained operation that's useful on its own.

  **Polynomial `range` return types tightened to `Closed`.** `LinearPolynomial.range`, `QuadraticPolynomial.range`, and `CubicPolynomial.range` previously declared `Interval` returns but always built `Closed` at runtime. The tightening lets `boundingBox` thread `Box2d<Closed, Closed>` through the type system without casts. Also fixes a latent bug in `LinearPolynomial.range` where decreasing polynomials (where `solve(p, start) > solve(p, end)`) would throw on the `Interval.make` ordering check — now uses `fromMinMax`.

## 2.0.0-alpha.0

### Major Changes

- 39d3758: **New `curvy/characteristic` module.** The characteristic matrices that identify each cubic spline family now live in a shared module rather than being scattered across the spline modules.

  ```ts
  import { Characteristic } from "curvy/characteristic";

  Characteristic.cubicBezier; // Matrix4x4 — was Bezier2d.characteristic
  Characteristic.cubicHermite; // Matrix4x4 — was Hermite2d.characteristic
  Characteristic.cubicBasisSpline; // Matrix4x4 — was Basis2d.characteristic
  Characteristic.cubicCardinal; // (tension: number) => Matrix4x4 — was Cardinal2d.characteristic
  Characteristic.cubicCatmullRom; // Matrix4x4 — was Cardinal2d.catRomCharacteristic
  ```

  **The per-spline `characteristic` exports are removed.** Update imports to pull from the new module. The runtime values are unchanged; only the import path moves. `Cardinal2d.catRomCharacteristic` similarly moves to `Characteristic.cubicCatmullRom`.

  **New `Characteristic.apply` helper.** Applies a characteristic matrix to N channels of control values, producing N cubic polynomials in monomial form. This is the operation Freya Holmér describes in _The Continuity of Splines_ — the matrix IS the spline, and `apply` is the canonical way to combine it with control points to produce a polynomial.

  ```ts
  import { Characteristic } from "curvy/characteristic";
  import { Vector4 } from "curvy/vector";

  // Polynomial 2D spline: two channels (x, y)
  const [x, y] = Characteristic.apply(
    Characteristic.cubicBezier,
    Vector4.make(p0.x, p1.x, p2.x, p3.x),
    Vector4.make(p0.y, p1.y, p2.y, p3.y)
  );

  // Rational 2D spline: same matrix, three channels (x, y, w)
  const [x, y, w] = Characteristic.apply(
    Characteristic.cubicBezier,
    Vector4.make(
      p0.x * p0.weight,
      p1.x * p1.weight,
      p2.x * p2.weight,
      p3.x * p3.weight
    ),
    Vector4.make(
      p0.y * p0.weight,
      p1.y * p1.weight,
      p2.y * p2.weight,
      p3.y * p3.weight
    ),
    Vector4.make(p0.weight, p1.weight, p2.weight, p3.weight)
  );
  ```

  The polynomial pipeline (`CubicCurve2d.fromBezierPoints`, `splines/util.ts → toCurves`) and the rational pipeline (`RationalCubicCurve2d.fromBezierPoints`) both flow through `apply` now — the unified entry point makes the spline-family-as-matrix story visible at the type level.

  **Cardinal cache moved.** The per-tension memoization that used to live in `Cardinal2d` now lives inside `Characteristic.cubicCardinal`. Behavior unchanged.

- b99c3bf: Sweep the `from*` constructor surface for naming coherence. The library accumulated several inconsistencies organically; v2 lands one rule per verb: `make` is the primary variadic constructor, `fromArray` is its array form, `fromXxx` is for genuinely-from-X semantic constructors named for what their inputs represent.

  **Renames (curve modules):** `LinearCurve2d.fromPoints`, `QuadraticCurve2d.fromPoints`, `CubicCurve2d.fromPoints` → `fromCoefficients`. The old name was a misnomer — the function takes `Vector2`s but stores them as polynomial coefficient bundles, not as points on the curve. The new name is honest about that.

  ```ts
  // before
  CubicCurve2d.fromPoints(c0, c1, c2, c3); // Vector2s = polynomial coefficients
  // after
  CubicCurve2d.fromCoefficients(c0, c1, c2, c3);
  ```

  **Renames (path modules):** `LinearPath2d`, `QuadraticPath2d`, `CubicPath2d` switch from `fromCurves` / `fromCurveArray` to `make` / `fromArray`, matching every spline module's `make` + `fromArray` convention.

  ```ts
  // before
  CubicPath2d.fromCurves(c0, c1);
  CubicPath2d.fromCurveArray([c0, c1]);
  // after
  CubicPath2d.make(c0, c1);
  CubicPath2d.fromArray([c0, c1]);
  ```

  **Removed (Bézier conversion primitive):** `Bezier2d.fromSpline` is now package-private. Its only callers were the other splines' own `toBezier` methods, and SVG path serialization (which now lives in core, not a separate package). End users should reach for `Cardinal2d.toBezier`, `Hermite2d.toBezier`, or `Basis2d.toBezier` rather than constructing a basis-conversion call by hand.

  **New (curve modules):** `LinearCurve2d.fromBezierPoints`, `QuadraticCurve2d.fromBezierPoints`, `CubicCurve2d.fromBezierPoints` — closed-form Bernstein-basis to monomial conversion. Constructs a single curve from real Bézier control points without the round-trip through `Bezier2d` + `toPath`. For cubics, `p0` and `p3` are the curve's endpoints and `p1`, `p2` are off-curve control handles; for quadratics, `p1` is the single control handle; for the linear case, `p0` and `p1` are the endpoints.

  ```ts
  const c = CubicCurve2d.fromBezierPoints(
    Vector2.make(0, 0),
    Vector2.make(1, 0),
    Vector2.make(1, 1),
    Vector2.make(0, 1)
  );
  ```

  **New (polynomial modules):** `QuadraticPolynomial.fromPoints` and `CubicPolynomial.fromPoints` — Lagrange interpolation through 3 and 4 `(x, y)` points, completing the symmetry with `LinearPolynomial.fromPoints` (which already existed). Implementation uses Newton's divided differences collected to monomial form. The input `x` values must be distinct.

  ```ts
  // y = x² + 2x + 3
  const p = QuadraticPolynomial.fromPoints(
    Vector2.make(-1, 2),
    Vector2.make(0, 3),
    Vector2.make(1, 6)
  );
  ```

  **Renamed (matrix module):** `Matrix3x3.matrix3x3` → `Matrix3x3.make`. The `Matrix2x2` and `Matrix4x4` modules already used `make`; only `Matrix3x3` had the type-name-as-constructor variant, breaking symmetry across the matrix family.

- 68026f7: **Endpoint inclusivity is now part of the `Interval` value, not a per-call option.** The `Interval` type is now a discriminated union of four variants — `Closed` (`[a, b]`), `OpenStart` (`(a, b]`), `OpenEnd` (`[a, b)`), and `Open` (`(a, b)`) — each carrying a literal `kind` discriminant. Operations that depend on inclusivity (`contains`, `filter`, `equals`) dispatch on `kind`; operations that don't (`lerp`, `normalize`, `remap`, `size`, `clamp`, `scaleShift`) accept the broader `Bounds` type so the signature itself documents what each operation reads.

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

  **`unit` and `biunit`** are now typed as `Closed`, not the broader `Interval`. **New `unitOpen`**: the open unit interval `(0, 1)` — the symmetric open counterpart to `unit`, useful for strict-interior filtering (e.g. clipping polynomial roots that must lie strictly inside `[0, 1]`).

  ```ts
  // Before
  Interval.contains(i, x, { includeStart: false, includeEnd: false });

  // After
  Interval.contains(Interval.toOpen(i), x);
  // or construct directly:
  Interval.contains(Interval.makeOpen(0, 1), x);
  ```

  **`Solution.filterInterval` is renamed to `Solution.clip`** and loses its options arg. Pass an interval of the kind you want:

  ```ts
  // Before
  Solution.filterInterval(s, Interval.unit, {
    includeStart: false,
    includeEnd: false,
  });

  // After
  Solution.clip(s, Interval.toOpen(Interval.unit));
  // or use the new constant:
  Solution.clip(s, Interval.unitOpen);
  ```

- 01f7bc0: **Consolidated public module surface.** The `package.json` `exports` map is reduced from ~30 subpaths to 11. Every group exposes a single namespace-indexed subpath, and per-module subpaths are removed. The internal directory layout is unchanged; only the public import shape moves.

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
  import * as Vector2 from "curvy/vector2";
  import * as CubicCurve2d from "curvy/curve/cubic2d";
  import * as RationalCubicPath2d from "curvy/path/rationalCubic2d";
  import * as Bezier2d from "curvy/splines/bezier2d";

  // after
  import { Vector2 } from "curvy/vector";
  import { CubicCurve2d, RationalCubicCurve2d } from "curvy/curve";
  import { RationalCubicPath2d } from "curvy/path";
  import { Bezier2d } from "curvy/splines";
  ```

  The internal namespace identity (`Vector2.make`, `CubicCurve2d.solve`, etc.) is unchanged — only the path you import from moves. Tree-shaking remains intact: importing one namespace from a group index does not pull in its siblings, given `"sideEffects": false`.

  **Solo namespaces (`Interval`, `Solution`, `Characteristic`) now exported through wrappers.** These were previously bare-module subpaths. Each now lives in a directory whose `index.ts` re-exports the implementation as a namespace, so the import shape matches the multi-namespace groups:

  ```ts
  // before
  import * as Interval from "curvy/interval";
  import * as Solution from "curvy/solution";
  import * as Characteristic from "curvy/characteristic";

  // after
  import { Interval } from "curvy/interval";
  import { Solution } from "curvy/solution";
  import { Characteristic } from "curvy/characteristic";
  ```

  **New `curvy/number` module.** The math utilities (`lerp`, `clamp`, `round`, `epsEquals`, etc.) move out of `curvy/utils` into a dedicated module. The grouping reflects what each is for: `curvy/utils` is now language plumbing every other module needs (`pipe`, `dual`, `Pipeable`, `invariant`); `curvy/number` is numeric utilities.

  ```ts
  // before
  import { lerp, clamp, epsEquals } from "curvy/utils";

  // after
  import { lerp, clamp, epsEquals } from "curvy/number";
  ```

  **`curvy/pipe` removed.** `pipe`, `dual`, and `Pipeable` move into `curvy/utils` alongside `invariant`. The `curvy/pipe` subpath is gone.

  ```ts
  // before
  import { dual, pipe, Pipeable } from "curvy/pipe";
  import { invariant } from "curvy/utils";

  // after
  import { dual, pipe, Pipeable, invariant } from "curvy/utils";
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

- 55714cf: **Precision is now a property of operations, not values.** Removed the implicit `round()` from constructors and operation results across `Vector2`/`3`/`4`, `Matrix2x2`/`3x3`/`4x4`, the `Linear`/`Quadratic`/`Cubic` polynomial types, and `Interval`. Previously every value was snapped to an 8-decimal grid on construction; values are now stored as exact IEEE doubles. This is a breaking change for code that relied on strict equality (`===`, `toBe`) on computed results — comparisons must now be approximate.

  New APIs for explicit precision:

  - **`equals(a, b)`** on each value type (`Vector2`, `Vector3`, `Vector4`, `Matrix2x2`, `Matrix3x3`, `Matrix4x4`, `LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial`, `Interval`), in both data-first and data-last forms. Uses a per-component absolute tolerance of `EPSILON = 1e-10`. For non-default tolerance, compose `epsEquals` directly (`(a, b) => epsEquals(a.x, b.x, 1e-6) && ...`).
  - **`epsEquals(a, b, eps?)`** in `curvy/number` — approximate equality for raw numbers, with optional tolerance override.
  - **`clampToZero(value, eps)`** in `curvy/number` — snaps near-zero values to exactly zero, useful for stable sign tests.
  - **`EPSILON`** constant in `curvy/number`.

  The cubic root finder still clamps its discriminant to zero internally to keep double/triple-root cubics on the correct branch — now via explicit `clampToZero(disc, 1e-12)` rather than the previous implicit `round(disc, 12)`.

  `round()` itself remains exported from `curvy/number` for explicit egress snapping (e.g. for SVG output, where you want a fixed display precision).

  Performance: removing constructor-level rounding makes a realistic workflow (build a 4-segment Bezier path, sample 1000 points) about **2× faster**; `Matrix4x4.make` is **~17× faster**; `CubicCurve2d.length` is **~1.8× faster**.

- 6e3087e: Rename `Bezier2d.appendCurvatureMirrored` to `Bezier2d.appendCurvatureAligned` for consistency with the rest of the `*Aligned` family (`appendTangentAligned`, `appendVelocityAligned`, `appendAccelerationAligned`). The internal binding was already named `appendCurvatureAligned`; this aligns the public surface.
- eb48939: Replace the bare `ZeroOrOne<T>` / `ZeroToOne<T>` / `ZeroToTwo<T>` / `ZeroToThree<T>` return shapes with a single `Solution<T>` type and namespace, exposed at `curvy/solution`.

  Each variant is a small tagged object with named accessors. `One<T>` exposes `.value: T`; `Two<T>` and `Three<T>` expose `.values: readonly [T, T]` / `readonly [T, T, T]`. All variants have a `_tag` discriminator and a `length` field, are iterable via `Symbol.iterator`, and are `Pipeable` — so a `Solution` can sit at the head of a `pipe(...)` chain. Existing iteration patterns (`for..of`, spread, `result.length`) keep working without any adapter; what's new is the named-accessor ergonomics and a small operations API.

  **Type aliases:**

  ```ts
  import { Solution } from "curvy/solution";

  Solution.None; // { _tag: 'none', length: 0, ...iterable }
  Solution.One<T>; // { _tag: 'one', length: 1, value: T, ...iterable }
  Solution.Two<T>; // { _tag: 'two', length: 2, value: T, values: readonly [T, T], ...iterable }
  Solution.Three<T>; // { _tag: 'three', length: 3, value: T, values: readonly [T, T, T], ...iterable }
  Solution.Some<T>; // One | Two | Three — every Some<T> exposes `.value: T`
  Solution<T>; // None | Some<T> — most permissive

  // At-most aliases for trait-narrowed return shapes
  Solution.AtMostOne<T>; // None | One<T>
  Solution.AtMostTwo<T>; // None | One<T> | Two<T>
  Solution.AtMostThree<T>; // = Solution<T>
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
  const t = LinearPolynomial.solveInverse(p, 5);
  if (t === null) {
    /* constant polynomial */
  } else {
    use(t);
  }

  // after — direct narrowing
  const t = LinearPolynomial.solveInverse(p, 5);
  if (Solution.isSome(t)) {
    use(t.value); // .value is type-safe under Some<T>
  }

  // after — pattern match
  const result = LinearPolynomial.solveInverse(p, 5).pipe(
    Solution.match({
      onNone: () => 0,
      onSome: ({ value }) => value * 2,
    })
  );
  ```

  When you've earned narrower types via the trait system — e.g. `LinearPolynomial<Monotonic>.solveInverse` returns `Solution.One<number>` rather than `Solution.AtMostOne<number>` — `.value` is directly accessible without any narrowing check, since `One<T>` is non-empty by construction.

  The rest of the existing tuple-returning operations (`QuadraticPolynomial.solveInverse`, `CubicPolynomial.solveInverse`, the curve `solveAtX` / `solveAtY` helpers, etc.) are completely unchanged at runtime — only the type names move.

- b99c3bf: Inline SVG path serialization into the core `*Path2d` modules and remove the separate `@curvy/svg` package. Each path type now exports `toPathData`, which serializes the path as an SVG path data string (the value of a `<path>` element's `d` attribute):

  - `LinearPath2d.toPathData` — emits `M` and `L` commands.
  - `QuadraticPath2d.toPathData` — emits `M` and `Q` commands.
  - `CubicPath2d.toPathData` — emits `M` and `C` commands.

  Discontinuities between adjacent curves emit a fresh `M` command, so paths with disjoint segments serialize correctly.

  **Migration.** Replace `Path.fromBezier2d` + `Path.render` from `@curvy/svg` with `Bezier2d.toPath` + `CubicPath2d.toPathData`:

  ```ts
  // before
  import * as Path from "@curvy/svg/path";
  import * as Bezier2d from "curvy/splines/bezier2d";

  const d = Bezier2d.make(p0, p1, p2, p3).pipe(Path.fromBezier2d, Path.render);

  // after
  import { CubicPath2d } from "curvy/path";
  import { Bezier2d } from "curvy/splines";

  const d = Bezier2d.make(p0, p1, p2, p3).pipe(
    Bezier2d.toPath,
    CubicPath2d.toPathData
  );
  ```

  Because `toPathData` works on the polynomial representation, it covers any path — not just ones built from Béziers. Cardinal, Hermite, and Basis splines all serialize through their respective `toPath` outputs without needing a Bézier-specific path step.

- eb48939: Add a type-level trait system for polynomials, curves, and paths. Traits are phantom brands carried in a generic type parameter — they exist only at the type level, the runtime value is unchanged. Refiners check the property at runtime and narrow the type accordingly; assertions throw on failure.

  **Polynomials.** `LinearPolynomial`, `QuadraticPolynomial`, and `CubicPolynomial` now take a covariant `Traits` type parameter (`out Traits = unknown`). The library exports three brands:

  - `Monotonic` — strictly monotonic (excludes constant)
  - `Increasing` — strictly increasing (implies `Monotonic`)
  - `Decreasing` — strictly decreasing (implies `Monotonic`)

  Each polynomial module exposes:

  - `isMonotonic`, `isIncreasing`, `isDecreasing` — type-narrowing predicates
  - `asMonotonic`, `asIncreasing`, `asDecreasing` — runtime-checked assertions that throw on failure

  For quadratic and cubic polynomials, all of the above accept an optional `Interval` argument (a quadratic with c2 ≠ 0 isn't globally monotonic, but it can be on an interval that avoids its extremum).

  `solveInverse` is overloaded so that a `Monotonic`-branded polynomial returns a tighter shape:

  | Polynomial                       | Plain return                   | `Monotonic` return |
  | -------------------------------- | ------------------------------ | ------------------ |
  | `LinearPolynomial<Monotonic>`    | `ZeroOrOne` (`number \| null`) | `number`           |
  | `QuadraticPolynomial<Monotonic>` | `ZeroToTwo`                    | `ZeroToOne` (new)  |
  | `CubicPolynomial<Monotonic>`     | `ZeroToThree`                  | `ZeroToOne`        |

  ```ts
  const p = LinearPolynomial.make(0, 2); // LinearPolynomial<unknown>
  const inv = LinearPolynomial.solveInverse(p, 4); // ZeroOrOne
  if (LinearPolynomial.isMonotonic(p)) {
    // p is now LinearPolynomial<Monotonic>
    const tight = LinearPolynomial.solveInverse(p, 4); // number — null branch eliminated
  }
  ```

  **Curves.** `LinearCurve2d`, `QuadraticCurve2d`, and `CubicCurve2d` are now generic over per-axis trait sets: `LinearCurve2d<out XTraits = unknown, out YTraits = unknown>`. The two parameters track the trait sets of the curve's x and y polynomials independently — useful for asymmetric properties like "monotonic in x, anything in y" (an easing function / function-of-x curve).

  Per-axis refiners (`isMonotonicX`, `isMonotonicY`, `isIncreasingX`, `isIncreasingY`, `isDecreasingX`, `isDecreasingY`) and a combined `isMonotonic` that requires both axes monotonic. All check over the curve's natural parameter domain `[0, 1]`. Assertions follow the same `as*` naming.

  **Paths.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` are now generic: `<out Trait = unknown>`. One brand is shipped:

  - `Continuous` — adjacent curves connect at their join points (G⁰)

  Each path module exposes `isContinuous` and `asContinuous`. Splines emit continuous paths by construction, so `Bezier2d.toPath`, `Cardinal2d.toPath`, etc. all produce paths that pass `isContinuous`.

  **Variance.** All trait parameters are declared with the TS 4.7+ `out` covariance modifier. This means a `CubicPolynomial<Monotonic>` is assignable to a `CubicPolynomial<unknown>` (drop traits going up the lattice), and TypeScript will refuse a future change that introduces a contravariant use of the trait parameter.

  **Behavior change:** `monotonicity()` over a zero-width interval now throws (`monotonicity is undefined over a zero-width interval`) instead of returning `'constant'`. The previous return value conflated "polynomial is structurally constant" with "you queried at a single point" — only the former is a meaningful property of the polynomial. The runtime `Monotonicity` enum still has `'constant'` as a value for the structural case.

### Minor Changes

- 55714cf: Added **`CubicPath2d.solveByDistance(path, s): Vector2`** for sampling a path by normalized arc length (`s ∈ [0, 1]`).

  Unlike `solve`, which is parameterized by curve `u`, `solveByDistance` returns points at constant speed along the path — `s = 0.5` is the actual arc-length midpoint regardless of how the underlying parameterization stretches. This is the primitive most motion-design and animation use cases actually want from a curve library.

  Available in both data-first and data-last forms. Internally caches cumulative segment lengths by path identity (paths are immutable), so repeated calls on the same path skip the length-table rebuild. Within each segment, the local parameter is found via Newton's method on the curve's analytic derivative, with bracket-clamped fallback to bisection for cusps and pathological convergence.

- 55714cf: Added **`Bezier2d.subdivide(b, u): [Bezier2d, Bezier2d]`** for splitting a multi-segment cubic Bezier at a global parameter `u ∈ (0, 1)` via de Casteljau's algorithm. The two halves together trace the same curve as the input — the left covers `[0, u]`, the right covers `[u, 1]`.

  Available in both data-first and data-last forms. Useful for adaptive flattening, intersection testing, trimming, and chunking a curve across discrete buckets (responsive viewport breakpoints, animation segments, etc.). Splits at exact segment boundaries are detected and handled by slicing rather than running de Casteljau.

- eb48939: Add `solveAtX` and `solveAtY` to `LinearCurve2d`, `QuadraticCurve2d`, and `CubicCurve2d`. Where `solve(c, t)` evaluates the curve at a parameter `t` and returns `(x, y)`, `solveAt{X,Y}(c, value)` looks at the curve as a relation between its two axes and asks "what's the orthogonal coordinate when this axis equals the given value?"

  Results are filtered to the curve's parameter domain `[0, 1]` — only intersections with the actual drawn curve are returned, not roots of the underlying polynomial that lie outside the curve's range. Returned values are in t-ascending order.

  | Curve              | Plain return  | `<Monotonic, _>` (`solveAtX`) / `<_, Monotonic>` (`solveAtY`)                |
  | ------------------ | ------------- | ---------------------------------------------------------------------------- |
  | `LinearCurve2d`    | `ZeroToOne`   | `ZeroToOne` (always — a line crosses any axis-line at most once in `[0, 1]`) |
  | `QuadraticCurve2d` | `ZeroToTwo`   | `ZeroToOne`                                                                  |
  | `CubicCurve2d`     | `ZeroToThree` | `ZeroToOne`                                                                  |

  ```ts
  const easing = CubicCurve2d.fromBezierPoints(
    Vector2.make(0, 0),
    Vector2.make(0.42, 0),
    Vector2.make(0.58, 1),
    Vector2.make(1, 1)
  );

  if (CubicCurve2d.isMonotonic(easing)) {
    // both axes monotonic — solveAtX returns ZeroToOne
    const [y] = CubicCurve2d.solveAtX(easing, 0.5);
  }
  ```

  This is the "function-of-x" / easing-curve use case the trait system was designed around: when both axes are monotonic, the curve becomes invertible in either direction and the type system reflects that.

  **Bug fixes shipped alongside:** `QuadraticPolynomial.solveInverse` now correctly handles the `c2 = 0` case (degenerate quadratic — defers to linear) instead of dividing by zero. `CubicPolynomial.solveInverse` had a similar fallback that was forwarding `0` as the y-value instead of the actual argument; now forwards correctly. Both bugs were latent because `solveInverse` was rarely exercised on degenerate-degree polynomials before `solveAt{X,Y}` started routing through them.

- 55714cf: Added three new `Matrix4x4` primitives:

  - **`Matrix4x4.identity`** — the 4×4 identity matrix as a constant.
  - **`Matrix4x4.multiply(a, b)`** — matrix-matrix multiplication, in both data-first and data-last forms.
  - **`Matrix4x4.inverse(m)`** — matrix inverse via the adjugate / determinant formula. Throws on singular input (determinant zero).

  These are useful both as general-purpose 4×4 transform primitives and as the foundation for the new spline-conversion caching that ships in this release.

- **Approximate rational cubic curves as polynomial cubic paths.** Rational curves can't be converted exactly to polynomial Béziers — that's the entire reason rational forms exist (true circles, conic sections, etc.). But they _can_ be approximated to arbitrary tolerance via recursive subdivision, which is what PDF and SVG renderers do internally.

  Two new operations, both at the curve and path level:

  ```ts
  import { RationalCubicCurve2d } from "curvy/curve";
  import { RationalCubicPath2d } from "curvy/path";

  // Curve-level: returns ReadonlyArray<CubicCurve2d>
  RationalCubicCurve2d.approximateAsCubicCurves(rationalCurve, tolerance);

  // Path-level: returns CubicPath2d
  RationalCubicPath2d.approximateAsCubicPath(rationalPath, tolerance);
  ```

  For each segment a polynomial-cubic candidate is built by projecting the four homogeneous Bézier control points back to 2D; if the midpoint deviates from the true rational by more than `tolerance`, the segment is split at `t = 0.5` and the procedure recurses on each half. Endpoints and endpoint tangent directions are preserved exactly. For a uniform-weight curve the result is a single exact segment.

  **New `CubicPolynomial.subdivide(p, t)`.** General de Casteljau-equivalent subdivision in monomial form. Returns `[left, right]` where the left half's evaluation on `[0, 1]` matches the input's on `[0, t]`, and the right half matches on `[t, 1]`. Available data-first and data-last.

  ```ts
  import { CubicPolynomial } from "curvy/polynomial";

  const [left, right] = CubicPolynomial.subdivide(p, 0.5);
  ```

  Used internally by the rational approximation but exposed as a primitive because it's the natural building block for any subdivision-based algorithm over cubic polynomials.

- **Rational cubic curves, paths, and splines.** A new `RationalCubicCurve2d` lives in `curvy/curve`, alongside the existing polynomial cubic. It stores the curve as three monomial polynomials `x(t)`, `y(t)`, `w(t)` and evaluates as `(x(t)/w(t), y(t)/w(t))` — the projection from homogeneous coordinates back to the plane. With uniform weights the curve degenerates to a polynomial cubic.

  ```ts
  import { RationalCubicCurve2d } from "curvy/curve";
  import { Vector2 } from "curvy/vector";

  // Four weighted Bézier control points; the matrix-based constructor
  // lifts them to homogeneous (w·x, w·y, w) and runs the same characteristic
  // matrix the polynomial pipeline uses, just on three channels.
  const c = RationalCubicCurve2d.fromBezierPoints(
    Vector2.makeWeighted(0, 0, 1),
    Vector2.makeWeighted(1, 2, 5),
    Vector2.makeWeighted(2, 2, 5),
    Vector2.makeWeighted(3, 0, 1)
  );
  RationalCubicCurve2d.solve(c, 0.5); // → Vector2
  ```

  A matching path type (`RationalCubicPath2d` in `curvy/path`) and spline type (`RationalBezier2d` in `curvy/splines`) follow the same shape as their polynomial counterparts, with `solve`, `solveAtX`, `solveAtY`, and the standard pipeable API.

  **Per-axis monotonicity traits live on the curve, not the polynomials.** Unlike `CubicCurve2d` where the trait brand flows through to the underlying polynomial, rational traits are properties of the projected rational functions `x(t)/w(t)` and `y(t)/w(t)` — not of any individual polynomial. The brand therefore lives on the curve itself via a phantom property, and `RationalCubicCurve2d<XTraits, YTraits>` carries `Increasing` / `Decreasing` / `Monotonic` exactly like the polynomial curve does.

  **`makeMonotonicEasing(startSlope, endSlope)`.** A Gregory-Delbourgo style constructor for a guaranteed-monotone rational cubic easing curve. Interpolates `(0, 0)` and `(1, 1)` with the given endpoint slopes, pins `x(t) = t`, and returns a curve branded `<Increasing, Increasing>` so `solveAtX` narrows to `Solution.AtMostOne<number>` without runtime checking. Smoothstep falls out from `(0, 0)` and linear easing from `(1, 1)`.

  ```ts
  const ease = RationalCubicCurve2d.makeMonotonicEasing(0.5, 1.5);
  const result = RationalCubicCurve2d.solveAtX(ease, 0.5);
  // result: Solution.AtMostOne<number> — narrowed by the Increasing brand
  ```

  Monotonicity is verified rigorously at construction by computing the derivative numerator as a cubic in `t` and checking it doesn't change sign on `(0, 1)`. Construction throws when the slope pair can't be made monotonic under the default `α = m₀ + 1`, `β = m₁ + 1` heuristic — useful operating range is roughly `m₀, m₁ ∈ [0, 2]` with `m₀ + m₁ ≲ 3`.

### Patch Changes

- 55714cf: TypeScript declarations are now published as `.d.mts` rather than `.d.ts`, matching the ESM-only `.mjs` artifact convention. The `package.json` `exports` field has been updated accordingly, so consumers using modern TypeScript (5+) with `moduleResolution: "node16"`, `"nodenext"`, or `"bundler"` see no change — types resolve through `exports` like before.

  Two scenarios where this is observable:

  - **Deep imports past `exports`** (e.g. `import 'curvy/dist/vector/vector2.d.ts'`) will break — those file paths no longer exist. This was already unsupported, but worth flagging.
  - **Older TypeScript or non-`exports`-aware tooling** that fell back to `.d.ts` lookup by extension may need updating to a version that honors `exports`.

  This change ships alongside the build-tool migration from `unbuild` to `tsdown`. Sourcemaps for declarations are also now emitted (`.d.mts.map`), which `unbuild` did not produce.

- 55714cf: Internal: rewrote `dual()`'s per-arity hot paths to read `arguments.length` and `arguments[i]` directly from a regular `function` body, instead of unpacking `...args` rest-parameters into an array. V8 keeps `arguments` virtualized when only `length` and indexed access are used, so the hot path no longer allocates an array per call.

  No API change; `dual()`'s signatures and overload semantics are unchanged. Realistic-workflow benchmark (build a 4-segment Bezier path + 1000 samples) is **~43% faster**, and `CubicCurve2d.solve` is **~18% faster**, both because they go through `dual` repeatedly in their hot loops. Operations that don't use `dual` (like `Matrix4x4.make`) are unaffected, as expected.

- 55714cf: The Bézier basis-conversion routine that backs `Cardinal2d.toBezier`, `Hermite2d.toBezier`, and `Basis2d.toBezier` now caches the combined conversion matrix (`M_bezier⁻¹ · M_source`) per source-matrix instance via a `WeakMap`, replacing a per-call run of Cramer's rule with a single matrix-vector product per axis per quad. `Cardinal2d.characteristic(scale)` also memoizes its result by scale value, so repeated `Cardinal2d.toBezier(p, customScale)` calls hit the cache instead of constructing a fresh matrix each time.

  No API change. **`Cardinal2d.toBezier` is ~85× faster** (~9k → ~800k ops/sec for both default and custom scales). The same caching applies to every other non-Bézier spline type's `toBezier` path.

## 1.0.9

### Patch Changes

- 819cc5c: added jsdoc comments to all public members

## 1.0.8

### Patch Changes

- 18a8435: fix switched naming of theta and phi
- 18a8435: add `Vector3.cross`

## 1.0.7

### Patch Changes

- fix missing export for `Vector3.fromSpherical`

## 1.0.6

### Patch Changes

- add `Vector2.fromPolar` and `Vector3.fromSpherical`

## 1.0.5

### Patch Changes

- c1c2018: Add getters for `x`, `y`, `z`, `r`, `theta`, and `phi` in the form of `Vector3.getPhi` etc
- c1c2018: add getters for `x`, `y`, `r`, and `theta` in the form of `Vector2.getTheta` etc

## 1.0.4

### Patch Changes

- 1844bde: export pipe and utils modules

## 1.0.3

### Patch Changes

- 395dbcd: add `Basis2d.toBezier`, `Cardinal2d.toBezier`, and `Hermite2d.toBezier`
- 395dbcd: add `Bezier2d.fromSpline`

## 1.0.2

### Patch Changes

- 27ec055: add `Cardinal2d` spline
- cf4f4c0: add `Hermite2d` spline
- 27ec055: add `scale` to `Vector2`, `Vector3`, and `Vector4`
- 46e533e: add `Basis2d` spline

## 1.0.1

### Patch Changes

- 1b14680: add `curvature` for linear, quadratic, and cubic curves
- 1b14680: add `Bezier2d.appendTangentAligned` (G1 continuity), `Bezier2d.appendCurvatureAligned` (G2 continuity), `Bezier2d.appendVelocityAligned` (C1 continuity), and `Bezier2d.appendAccelerationAligned` (C2 continuity)
- 1b14680: add `LinearPolynomial.fromPoints(p1: Vector2, p2: Vector2)`
- 1b14680: add `curvature` for `CubicPolynomial`s and `QuadraticPolynomial`s
- 1b14680: add `LinearPolynomial.fromPointSlope(point: Vector2, slope: number)`
- 1b14680: add `Vector2.cross(a, b)`

## 1.0.0

### Major Changes

- aa5d726: stable release of new API

## 0.5.0

### Minor Changes

- 6bb377b: bump for npm version error

## 0.4.0

### Minor Changes

- 01b22cc: completely rework API to be functional operations on immutable data structures, modeled after the Effect library

## 0.3.3

### Patch Changes

- fix missing exports

## 0.3.2

### Patch Changes

- 748a342: add solveAlong, improve lookup table sampling
- 748a342: fix monotonicity typo
- 0627bc3: add multi spline support

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/tkofh/curvy/compare/curvy@0.1.1...curvy@0.3.0) (2024-03-11)

### Bug Fixes

- tests ([f030df3](https://github.com/tkofh/curvy/commit/f030df38db21919d28bb01fbd09b6d9134e27a89))

### Features

- curve ([4673bf7](https://github.com/tkofh/curvy/commit/4673bf7bb489f77fcd5d57f30b107a7fdf5e3bb3))
- solveT ([d93178a](https://github.com/tkofh/curvy/commit/d93178ac9d4423b7568f1de6eec122ec97253fb6))
- things ([8f441dc](https://github.com/tkofh/curvy/commit/8f441dc16e856958d476eae63d5c8e4ea1881599))
- works ([56aff20](https://github.com/tkofh/curvy/commit/56aff2048ec94bb34cc1ea0239728f89e79b86ad))

# [0.2.0](https://github.com/tkofh/curvy/compare/curvy@0.1.1...curvy@0.2.0) (2024-03-11)

### Bug Fixes

- tests ([f030df3](https://github.com/tkofh/curvy/commit/f030df38db21919d28bb01fbd09b6d9134e27a89))

### Features

- curve ([4673bf7](https://github.com/tkofh/curvy/commit/4673bf7bb489f77fcd5d57f30b107a7fdf5e3bb3))
- solveT ([d93178a](https://github.com/tkofh/curvy/commit/d93178ac9d4423b7568f1de6eec122ec97253fb6))
- things ([8f441dc](https://github.com/tkofh/curvy/commit/8f441dc16e856958d476eae63d5c8e4ea1881599))
- works ([56aff20](https://github.com/tkofh/curvy/commit/56aff2048ec94bb34cc1ea0239728f89e79b86ad))

## [0.1.1](https://github.com/tkofh/curvy/compare/curvy@0.1.0...curvy@0.1.1) (2024-03-08)

**Note:** Version bump only for package curvy

# [0.1.0](https://github.com/tkofh/curvy/compare/curvy@0.6.2...curvy@0.1.0) (2024-03-08)

### Features

- core works i think ([d33589a](https://github.com/tkofh/curvy/commit/d33589a93baf93ea3419500ce4acd5483437a72b))
- curve ([448378e](https://github.com/tkofh/curvy/commit/448378e456e93e74e8b84671684706610c6d1153))
- curve segment ([7e8ec11](https://github.com/tkofh/curvy/commit/7e8ec119e79c23b61f28a1d2cbe6d77d4d72c8c5))
- lut stuff ([57fcba9](https://github.com/tkofh/curvy/commit/57fcba98dc8bcee5449aa15c90754ddafcfdb249))
- sample ([a048baf](https://github.com/tkofh/curvy/commit/a048bafb2437b7d99d646436a1d20ddcabb1df63))
- split by segments ([5117e4c](https://github.com/tkofh/curvy/commit/5117e4cc68fdf14fe28f26dd0c97477a80c1e822))
