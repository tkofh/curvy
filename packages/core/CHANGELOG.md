# Change Log

## 2.0.0-alpha.12

### Minor Changes

- Added `Linear2d` to the splines family — a polyline (ordered list of points) that converts to a `LinearPath2d` by joining consecutive points with straight segments. Mirrors the surface of `Basis2d` / `Bezier2d` / `Cardinal2d` / `Hermite2d`: `make`, `fromArray`, `fromTuples`, `append`, `prepend`, `toPath`. Minimum of 2 points (1 segment).

  The motivating use case is "build a polyline from a list of (x, y) values, then realize it as a path" without writing the per-segment `LinearCurve2d.fromEndpoints` boilerplate by hand:

  ```ts
  // before
  const segments: Array<LinearCurve2d> = [];
  for (let i = 1; i < xs.length; i++) {
    segments.push(
      LinearCurve2d.fromEndpoints(
        Vector2.make(xs[i - 1]!, ys[i - 1]!),
        Vector2.make(xs[i]!, ys[i]!)
      )
    );
  }
  const path = LinearPath2d.fromArray(segments);

  // after
  const path = Linear2d.fromTuples(xs.map((x, i) => [x, ys[i]!])).pipe(
    Linear2d.toPath
  );
  ```

  `toPath` returns an unbranded `LinearPath2d`. If the polyline is monotonic in an axis, follow with `LinearPath2d.asMonotonicX` / `asMonotonicY` to brand the result (or use the `is*` refiner if you want to fall through).

## 2.0.0-alpha.10

### Minor Changes

- Added `unitRange` helpers on each polynomial module and a float-tolerant `containsApprox` on `Interval`.

  **`LinearPolynomial.unitRange(p)`, `QuadraticPolynomial.unitRange(p)`, `CubicPolynomial.unitRange(p)`** — equivalent to `range(p, Interval.unit)` but without needing to import `Interval.unit` at the call site. Same semantics: accounts for any interior extrema in `[0, 1]`. Used internally to clean up the curve-level `boundingBox` implementations.

  ```ts
  // before
  Interval2d.make(
    CubicPolynomial.range(c.x, Interval.unit),
    CubicPolynomial.range(c.y, Interval.unit)
  );
  // after
  Interval2d.make(
    CubicPolynomial.unitRange(c.x),
    CubicPolynomial.unitRange(c.y)
  );
  ```

  **`Interval.containsApprox(interval, value, eps?)`** — returns `true` when `value` is in the interval or within `eps` of either boundary. Defaults `eps` to `EPSILON` (`1e-10`). Endpoint inclusivity is ignored — at the EPSILON scale the open/closed distinction loses meaning, and the use case is float-tolerant containment checks. Use `contains` for kind-strict semantics.

  ```ts
  Interval.containsApprox(Interval.make(0, 1), 1.0000000001); // true
  Interval.containsApprox(Interval.make(0, 1), 1.5); // false
  Interval.containsApprox(Interval.make(0, 1), 1.5, 1); // true (explicit eps)
  ```

### Patch Changes

- Fixed `solveAt{X,Y}` on `MonotonicX`/`MonotonicY` paths returning `Solution.none` at most interior knots.

  At an interior knot, two adjacent segments both bracket the query within float tolerance — the leftward segment's right endpoint and the rightward segment's left endpoint are (nominally) the same value. For cubic paths, the per-segment polynomial-inverse solver could return `none` for _both_ of those brackets when accumulated drift in `c0 + c1 + c2 + c3` pushed the cubic's true root just outside `[0, 1]`. The path-level loop then short-circuited on the first `none` and returned the empty solution even though one of the segment endpoints was the answer.

  The reproducer (Catmull-Rom from 6 knots, queried at interior knot x-values) used to return `none` for 3 of 4 interior knots; now returns the expected y at all 6.

  Two-part fix in `LinearPath2d`, `QuadraticPath2d`, `CubicPath2d`:

  - Snap to the segment endpoint y when the query is within `EPSILON` of the segment's start or end x — avoids the polynomial inversion entirely at the knot case.
  - Fall through to the next bracketing segment on `none` rather than short-circuiting. The `MonotonicX/Y` brand guarantees at most one real solution across the path, so retrying after `none` is safe.

## 2.0.0-alpha.8

### Minor Changes

- Added per-axis and per-polar `map` to all vector modules, plus filled in `Vector4`'s missing per-axis `get{X,Y,Z,W}` / `set{X,Y,Z,W}` so all three vector modules now have the full get/set/map trio.

  **Vector2**: `mapX`, `mapY`, `mapR` (radius), `mapTheta` (angle).
  **Vector3**: `mapX`, `mapY`, `mapZ`, `mapR`, `mapTheta` (polar), `mapPhi` (azimuthal).
  **Vector4**: full `get{X,Y,Z,W}` / `set{X,Y,Z,W}` / `map{X,Y,Z,W}` surface, matching Vector2/3's per-axis API.

  Each `map[coord]` takes a `(component: number) => number` and returns a new vector with that component replaced. Both data-first and data-last forms via `dual`, like the existing setters.

  ```ts
  const flipped = Vector2.mapY(v, (y) => -y);
  const doubled = v.pipe(Vector2.mapX((x) => x * 2));
  const rotated = v.pipe(Vector2.mapTheta((t) => t + Math.PI / 2));
  const scaled = v.pipe(Vector3.mapR((r) => r * 2));
  ```

  `Vector4` still doesn't get a polar/spherical surface — no canonical 4D analog.

### Patch Changes

- Fixed `Vector3.setTheta` and `Vector3.setPhi`, which weren't holding their documented invariants.

  - `setTheta(v, theta)` was using `v.y` directly in place of the azimuthal angle, so it didn't actually preserve `φ` and produced garbage for any vector with `v.y` not coincidentally equal to its azimuthal angle in radians.
  - `setPhi(v, phi)` was rotating around the origin using `magnitude(v)` as the xy-projection length, so the result didn't lie on the original sphere — magnitude wasn't preserved.

  Both now correctly hold "change one spherical component, preserve the other two" — `setTheta` keeps `r` and `φ`, `setPhi` keeps `r` and `θ`. The fix also corrects the internal parameter names (`setTheta`'s arg was named `phi` and vice versa). Public TypeScript types are unchanged.

  `mapTheta` / `mapPhi` (added in the same release) are unaffected — they compose on top of these setters and now produce correct results automatically.

## 2.0.0-alpha.7

### Minor Changes

- 1f81e51: Added per-axis monotonicity traits and `solveAt{X,Y}` to non-rational path modules (`LinearPath2d`, `QuadraticPath2d`, `CubicPath2d`).

  **New trait brands** (in `path/traits.ts`): `MonotonicX`, `IncreasingX extends MonotonicX`, `DecreasingX extends MonotonicX`, and the y-axis counterparts. A path is `IncreasingX` when every segment's x-polynomial is strictly increasing on `[0, 1]` _and_ adjacent segments' x-ranges don't overlap (modulo `EPSILON` for float drift at joins) — together those guarantee the path's `u → x` mapping is monotonic across the whole parameter domain.

  **New refiners and assertions** on each non-rational path: `isMonotonicX`, `isIncreasingX`, `isDecreasingX`, `isMonotonicY`, `isIncreasingY`, `isDecreasingY`, plus the `as*` throwing variants. Following the existing pattern, `IncreasingX` and `DecreasingX` both narrow to `MonotonicX` via brand intersection — so a path refined by `isIncreasingX` is accepted anywhere `MonotonicX` is required, no extra `asMonotonicX` step needed.

  **New operations**: `solveAtX` and `solveAtY` on each non-rational path, gated by the corresponding `Monotonic{X,Y}` brand. Returns `Solution.AtMostOne<number>` — locates the segment whose axis range contains the query and delegates to the curve-level solver. The monotonicity guarantee at the path level means there's at most one match across all segments. Returns `Solution.none` when the query is outside the path's range.

  ```ts
  const path = CubicPath2d.make(easingCurve).pipe(CubicPath2d.asMonotonicX);
  const yAt = CubicPath2d.solveAtX(path, 0.3); // Solution.AtMostOne<number>
  ```

  A general (non-monotonic) `solveAtX` would have unbounded cardinality (segments × per-curve roots), so it's deferred until there's a use case.

- 1f81e51: Added `fromTuple` to each vector module: `Vector2.fromTuple([x, y])`, `Vector3.fromTuple([x, y, z])`, `Vector4.fromTuple([x, y, z, w])`. The inverse of `components`, useful when interop with array-shaped data (JSON, SVG path commands, libraries that hand back tuples) would otherwise force a spread into `make`.

  ```ts
  // before
  const v = Vector2.make(...t);
  // after
  const v = Vector2.fromTuple(t);
  ```

## 2.0.0-alpha.6

### Patch Changes

- Revert the namespace + type re-export pattern at group index files (originally added in alpha.4) and the associated dts-emission pipeline change (alpha.5). The pattern crashed TypeScript in some downstream consumer setups.

  Type access reverts to the namespace-nested form:

  ```ts
  import * as Vector2 from "curvy/vector";

  const v: Vector2.Vector2 = Vector2.make(1, 2);
  ```

  Each group's `index.ts` is back to plain `export * as Foo from './foo'` re-exports. Build pipeline returns to tsdown-only (no separate tsc pass, no post-build script).

  No other API changes.

## 2.0.0-alpha.5

### Patch Changes

- Fix declaration emission so the alpha.4 namespace + type re-export pattern actually works for consumers.

  In alpha.4 the index files were rewritten so that `import { Vector2 } from 'curvy/vector'` resolves as both a value (namespace) and a type (interface). The source-level change was correct, but tsdown's declaration bundler was dropping the value-side re-export from the emitted `.d.ts` — consumers got the type but not the namespace, so `Vector2.make(...)` typecheck-failed.

  The build now uses tsc for declaration emission (per-file, not bundled), tsdown for runtime, and a post-build step that inlines brand-symbol references from internal modules and strips the `*.internal.d.ts` files from `dist/`. End result: the namespace+type pattern works at the consumer's typecheck, and the published tarball no longer ships any internal declarations.

  No API changes.

## 2.0.0-alpha.4

### Minor Changes

- Punch-list additions surfaced by the design-tokens repo's integration of curvy alpha.

  **Namespace types re-exported at the index level.** Each group's `index.ts` (`curvy/vector`, `curvy/curve`, `curvy/path`, `curvy/splines`, `curvy/polynomial`, `curvy/matrix`, `curvy/interval`, `curvy/solution`) now exports each namespace's primary type at the root, so the type name and namespace name coexist:

  ```ts
  import { Vector2 } from "curvy/vector";

  const v: Vector2 = Vector2.make(1, 2); // type and namespace both named Vector2
  ```

  Previously the type was only reachable as `Vector2.Vector2`, which read awkwardly. The pattern violates Effect-style purity but the ergonomic win is real. Nested types (e.g. `Vector2.Weighted`, `Cardinal2d.Options`, `Interval.Closed`) still live in their namespaces.

  **`Solution.unsafeValue(s, message?)`.** Throws on `None`, returns `s.value` on `Some`. The data-last form requires a message — it's where the assertion is hardest to read without one:

  ```ts
  const x = CubicPolynomial.solveInverse(p, y).pipe(
    Solution.unsafeValue("expected a monotonic inverse")
  );
  ```

  Useful when the type system can't prove non-emptiness but you have a domain reason to assert it without going through the trait refiner first.

  **`Cardinal2d.withInterpolatedEndpoints`.** Names the intent — "the resulting curve interpolates its first and last control points" — that `withDuplicatedEndpoints` and `withReflectedEndpoints(c, 0)` already provide. The latter two are mechanism-named; the new one matches the user's question.

  ```ts
  spline.pipe(Cardinal2d.withInterpolatedEndpoints, Cardinal2d.toPath);
  ```

  **`fromTuples` on every spline.** Convenience constructor for data coming from JSON/CSV/tuple-shaped sources:

  ```ts
  import { Bezier2d, RationalBezier2d } from "curvy/splines";

  Bezier2d.fromTuples([
    [0, 0],
    [1, 2],
    [3, 2],
    [4, 0],
  ]);
  Hermite2d.fromTuples([
    [0, 0],
    [1, 1],
    [1, 0],
    [1, -1],
  ]); // alternating point/velocity
  Cardinal2d.fromTuples(
    [
      [0, 0],
      [1, 1],
      [2, 0],
    ],
    { tension: 0.5 }
  );
  Basis2d.fromTuples([
    [0, 0],
    [1, 1],
    [2, 0],
  ]);
  RationalBezier2d.fromTuples([
    [0, 0, 1],
    [1, 2, 5],
    [3, 2, 5],
    [4, 0, 1],
  ]); // (x, y, weight)
  ```

  **`coefficients(p)` on every polynomial.** Returns the monomial coefficients as a typed tuple — useful for downstream consumers who want destructuring or array-style access alongside the existing `.c0`/`.c1`/etc. properties:

  ```ts
  import { CubicPolynomial } from "curvy/polynomial";

  const [c0, c1, c2, c3] = CubicPolynomial.coefficients(p);
  ```

  Tuple arity matches the polynomial's degree (`Linear` → `[number, number]`, etc.).

## 2.0.0-alpha.3

### Minor Changes

- **Cardinal splines now carry `tension` and `alpha` as part of the spline itself.** Previously these were "evaluation parameters" passed to `toPath` / `toBezier`. They're not — they're identity parameters of the curve: the same control points with different tensions describe different curves. The type now reflects that.

  ```ts
  import { Cardinal2d } from "curvy/splines";

  interface Cardinal2d {
    readonly points: ReadonlyArray<Vector2>;
    readonly tension: number; // default 0.5
    readonly alpha: number; // default 0.5
    // ...
  }
  ```

  **Constructors** support two shapes, distinguishable at the first-arg level:

  ```ts
  // Default options (centripetal Catmull-Rom, tension 0.5).
  Cardinal2d.make(p0, p1, p2, p3);

  // Explicit options first, then control points.
  Cardinal2d.make({ tension: 0.7, alpha: 0.5 }, p0, p1, p2, p3);

  // Array form with optional options.
  Cardinal2d.fromArray([p0, p1, p2, p3]);
  Cardinal2d.fromArray([p0, p1, p2, p3], { tension: 0.7 });
  ```

  **Pipeable setters** for mid-stream configuration. Control points are preserved across all of these; only the named field changes:

  ```ts
  const tightened = spline.pipe(Cardinal2d.withTension(0.7));
  const uniform = spline.pipe(Cardinal2d.withAlpha(0));
  const both = spline.pipe(Cardinal2d.withOptions({ tension: 0.2, alpha: 1 }));
  ```

  `Cardinal2d.withOptions` is a partial update — omitted fields are preserved from the input.

  **`toPath` and `toBezier` are nullary now** — they read tension/alpha off the spline:

  ```ts
  spline.pipe(Cardinal2d.toPath); // before: Cardinal2d.toPath(0.5)
  spline.pipe(Cardinal2d.toBezier);
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

## 2.0.0-alpha.2

### Minor Changes

- **New `Interval2d` + `Bounds2d` in `curvy/interval`, plus `boundingBox` on every curve and path.** An `Interval2d` is the Cartesian product of two intervals — the smallest abstraction for "is this curve inside this region?" without dragging in a richer rectangle/transform model. Mirrors the `Interval`/`Bounds` split in 1D: `Interval2d` carries per-axis kinds; `Bounds2d` is the structural minimum used by operations (like `size`) that don't depend on endpoint inclusivity.

  ```ts
  import { Interval, Interval2d } from "curvy/interval";
  import { Vector2 } from "curvy/vector";

  const allowed = Interval2d.make(Interval.make(0, 100), Interval.make(0, 1));
  Interval2d.containsVector(allowed, Vector2.make(50, 0.5)); // true
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
  Interval2d.union(closedA, closedB); // Interval2d<Closed, Closed>
  Interval2d.union(openA, openB); // Interval2d<Open, Open>
  Interval2d.union(closedA, openB); // Interval2d<Interval, Interval>
  ```

  The runtime is genuinely kind-correct: each endpoint of the result is the extremum of the inputs', and its inclusivity follows the input that contributed it. When endpoints tie, the result is closed at that point if either input includes it.

  **`Interval.union(a, b)` — the underlying primitive.** Exposed on the interval module because it's a self-contained operation worth using on its own.

  **`boundingBox` is available on every polynomial curve and path:**

  ```ts
  import { CubicCurve2d } from "curvy/curve";
  import { CubicPath2d } from "curvy/path";

  CubicCurve2d.boundingBox(curve); // Interval2d<Closed, Closed>
  CubicPath2d.boundingBox(path); // Interval2d<Closed, Closed>
  ```

  Curve-level implementations account for interior extrema (so the box is tight against the curve, not just its control polygon). Path-level implementations union per-segment boxes via `Interval2d.union`.

  Rational cubic curves don't get a `boundingBox` yet — computing the bbox of `(x(t)/w(t), y(t)/w(t))` requires finding roots of a degree-5 polynomial, which is a real implementation rather than a one-liner over existing primitives. Deferred. Workaround: `RationalCubicPath2d.approximateAsCubicPath(path, tolerance).pipe(CubicPath2d.boundingBox)` produces a slightly-padded but valid outer bound.

  **New `Interval.containsInterval(outer, inner)` helper.** Kind-aware interval-subset test, the primitive underneath `Interval2d.containsInterval2d`. Exposed on the interval module because it's a self-contained operation that's useful on its own.

  **Polynomial `range` return types tightened to `Closed`.** `LinearPolynomial.range`, `QuadraticPolynomial.range`, and `CubicPolynomial.range` previously declared `Interval` returns but always built `Closed` at runtime. The tightening lets `boundingBox` thread `Interval2d<Closed, Closed>` through without casts. Also fixes a latent bug in `LinearPolynomial.range` where decreasing polynomials would throw on `Interval.make`'s ordering check — now uses `fromMinMax`.

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
