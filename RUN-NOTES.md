# RUN-NOTES — docs/comment-pass

Documentation pass over `packages/core/src` public surface, module by module,
using the comment-doctor skill with CLAUDE.md's Documentation section as the
governing standard. Every module's docs land as one commit; examples were
executed before shipping (scratch scripts under `/tmp/curvy-scratch`, not
committed).

## Scope notes

- `characteristic` is reachable from package.json exports but absent from the
  task's module ordering list. Treated as in scope (the scope rule wins);
  slotted after matrix/polynomial.
- `src/dimensions.ts` and `src/length.ts` have no direct export entry;
  checked at their consumers for re-export reachability (see curve/ notes).

## number.ts

Verified by execution (scratch scripts):

- `round(1.005, 2)` is `1`, not `1.01` — the stored double sits below the
  tie. Ties round toward `+Infinity` (`Math.round`). All three rounders
  normalize `-0` to `0`.
- `roundDown` moves away from zero for negatives (`-1.231` → `-1.24`);
  `roundUp` toward zero (`-1.239` → `-1.23`).
- `lerp` is exact at both endpoints (form `b*t + a*(1-t)`) and extrapolates
  outside `[0, 1]` — the old `@param t` text claimed "(between 0 and 1)",
  which read as a domain restriction that doesn't exist.
- `normalize`/`remap` divide by zero on degenerate bounds (`NaN`/`±Infinity`,
  verified). `normalize(lerp(t, a, b), a, b)` round-trips to ≤1 ulp (sampled).
- `clip` passes `NaN` through (compares false against both bounds — never
  replaced by `onClip`); bounds inclusive. `clamp` also passes `NaN` through.
- `mod` result takes the sign of `m` (floored division); `mod(x, 0)` is `NaN`.

Repairs: genre-label openers on the rounding trio ("Rounding function that
rounds..."); placeholder-adjacent params ("The modulus"); missing
extrapolation/degeneracy contracts on `lerp`/`normalize`/`remap`; import
boilerplate stripped from every example (CLAUDE.md: none); `{@link}` →
backticked names (7 instances).

**EPSILON rationale was absent.** PRECISION.md says "The rationale for both
values lives with their definitions in `curvy/number`", but only
RELATIVE*TOLERANCE had one. Wrote it (≈450,000× per-op rounding noise at
order-1 magnitudes, verified arithmetic). \_Flagged assumption*: that 1e-10's
specific value has no other historical motivation — worth an author check.

**Edited a CLAUDE.md exemplar.** `coincident`'s "Defaults:" sentence carried
two em-dash breaks with a nested aside (skill rule 9: rewrite), duplicated its
override guidance in a later paragraph, and used "are intentional" where the
reason itself suffices (prose-doctor house rule). Content preserved, layout
repaired. Since CLAUDE.md names this block an exemplar, review is warranted.

No change needed: `clampToZero` — verb-first opener, strict-`<` contract
visible in `@returns`, params carry real content.

Open contract question: none beyond the EPSILON rationale flag.

## @since audit (affects every module)

The registry (`npm view curvy versions/time`) disagrees with two families of
existing tags. Corrections applied module-by-module as the pass reaches them:

- **`1.1.0` never shipped.** npm has 1.0.0–1.0.9 and then 2.0.0-alpha.x. The
  30 blocks tagged `1.1.0` (equals/EPSILON family) trace to commit `66326d3`
  (2026-05-09) — thirteen months after 1.0.9 published (2025-04-05), four
  days before 2.0.0-alpha.0. Under CLAUDE.md's behavior clock ("earliest
  release in which a consumer could obtain the behavior") they are `2.0.0`.
- **The utils/pipe family postdates 1.0.0.** `./utils` and `./pipe` export
  entries first appear at `1844bde`, which shipped in **1.0.4**
  (2024-12-10); the 1.0.0–1.0.3 exports map had no path exposing them. So
  `pipe`, `dual`, `Pipeable`, `invariant`, `round`, `roundDown`, `lerp`,
  `normalize`, `remap`, `clamp`, `clip`, `minMax` are `@since 1.0.4`.
  `roundUp` and `mod` entered at `819cc5c`, 47 minutes before 1.0.9
  published → `@since 1.0.9` (assumes that commit made the publish; flagged).
- 1.x flat module paths (`./vector2`, `./matrix4x4`, `./splines/bezier2d`,
  …) existed from 1.0.0, so `1.0.0` tags in those modules are plausible and
  were left unless a specific symbol's introduction says otherwise
  ("renames don't reset it" covers the flat→directory move).

Possibility the author should veto: if 1.x was ever also published under
another package name or registry, the clock could differ.

## utils.ts

`dual`, `flow`, `pipe`, and `Pipeable` — the library's core plumbing — had
**no doc blocks at all**; only `invariant` was documented. All are public via
`curvy/utils`. Written fresh:

- `dual`: both overloads documented (arity + predicate forms are distinct
  call shapes, not a data-first/-last pair). Count-dispatch surprise
  documented: eliding an optional trailing argument routes a data-first
  call data-last — the reason the predicate overload exists. `RangeError`
  on arity 0/1 verified by execution.
- `flow`/`pipe`/`Pipeable.pipe`: arity-ladder rule applied (one full block
  on the first overload, class doc for `Pipeable`). Runtime note: `flow`
  with 10+ functions returns `undefined` (switch falls through) — types cap
  at nine so no doc warning added; recorded here as an implementation
  observation, not a doc claim.
- All examples executed: `dual` example, `flow`/`pipe` composites over
  `normalize`/`lerp`, `Vector2.make(3, 4).pipe(Vector2.scale(2),
Vector2.magnitude) // 10`, `invariant` both branches.
- "The library's value types extend `Pipeable`" verified: 52 files extend
  it.
- Left alone: the Effect-TS provenance header (mentions `pipe`/`dual` only —
  if `flow` is also Effect-derived it may deserve a mention, but extending
  an attribution claim needs author knowledge); two `biome-ignore` comments
  that look stale now the repo lints with oxlint (functional directives,
  out of a docs pass's scope); the `arguments`-virtualization inline note
  (good maintainer comment).

## vector/

Verified by execution (all `@example` values run; behavior probes in
scratch scripts):

- `components` (vector2) carried tags copy-pasted from `fromPolar`
  (`@param r - The radius.` on a function taking a vector) — the reference
  doc's stale-tags specimen, still live. Fixed.
- `zero` (all three files) was documented as a factory ("Creates a zero
  vector." + `@returns`) — it is a shared constant. Rewritten as constant
  docs with roles (additive identity; `one` as the `hadamard` identity;
  `unitX/Y/Z` as axis units).
- **Interface claim was false**: "all operations create new instances",
  but `scale(v, 1) === v` (identity shortcut, all three sizes). Interface
  docs now promise immutability, not freshness; `scale`'s data-first
  `@returns` states the shortcut.
- Zero-vector contracts documented from runs: `normalize(zero)`,
  `setR/mapR(zero, …)` → all-NaN; `setTheta/setPhi(zero, …)` → zero;
  `Vector3.getTheta(zero)` → `NaN`, `getPhi(zero)` → `0`.
- Vector2 vs Vector3 **theta trap**: 2D `theta` is the azimuth
  (`atan2`, `[-π, π]`); 3D `theta` is the physics-convention inclination
  from +z (`acos`, `[0, π]`) with `phi` as azimuth. Each getter now states
  its formula and range, and `Vector3.getTheta` cross-references the
  difference. `fromSpherical`'s claimed input ranges ("0 to π", "0 to 2π")
  were conventions, not enforced preconditions — reworded, and its formula
  is now in `@returns`.
- `subtract` never said the operand order; now `a - b` on data-first,
  "subtracts `b` from it" on data-last (order verified by run).
- `transpose` (v2/v3) defined itself by pointing at `Vector4.transpose`
  (borrowed definition, skill failure mode 9). Each file now carries a
  full definition plus an executed example; v4's kept the cross-domain
  naming line (minus "inexplicably") and its placeholder example
  (`p0`…`p3`, unrunnable) became a concrete executed one.
- vector3 `scale`: `@return` typo and `@param s`/`@param v` in reverse
  signature order; vector4 `scale` had the same order bug. Fixed.
- vector4 `softmax` had **no `@since`**; added `1.0.0` after verifying
  softmax existed in the 1.0.0-era file (git show at `01b22cc`).
- `makeWeighted`/`withWeight`: added `@throws` (invariant verified by run);
  weight positivity moved to the `Weighted` type doc as an invariant.
- `equals` pairs: `1.1.0` → `2.0.0` per the @since audit (6 tags).
- No change needed: `getX/getY/getZ/getW`, `setX/…/setW`, `mapX/…/mapW`
  accessor families (correct, conventional, at appropriate altitude);
  `add` (obvious contract, conventional text per CLAUDE.md); vector3
  `hadamard` (already glossed element-wise).

## interval/

Verified by execution and internal reading:

- **Found bug (types, not docs): `toStartClosed` overload groups are
  swapped.** Runtime: `open-start → closed`, `open → open-end`,
  `closed`/`open-end` unchanged (verified). Declared:
  `(Closed | OpenEnd): Closed` and `(OpenStart | Open): OpenEnd` — so
  `toStartClosed(openEnd)` is typed `Closed` but runs `open-end`, and
  `toStartClosed(openStart)` is typed `OpenEnd` but runs `closed`. Correct
  grouping is `(Closed | OpenStart): Closed; (OpenEnd | Open): OpenEnd`.
  The sibling `toStartOpen`/`toEndOpen`/`toEndClosed` are all correct.
  Signature changes are out of this pass's scope; the prose describes the
  true semantics. **Needs a code fix.**
- **Found doc bug: `maxDistance` is not the farthest-pair distance.** The
  implementation computes the union-AABB diagonal (per-axis
  `max(hi) − min(lo)`), which exceeds the true farthest-pair separation
  when one interval strictly nests inside the other on an axis (verified:
  nested `[0,10]` vs `[2,3]` gives `10`; true farthest pair is `8`). The
  old doc claimed both quantities; they differ. Rewrote as "union-AABB
  diagonal: an upper bound…, exact unless strictly nested on an axis".
  _Open contract question_: is the upper bound the intent (it is the right
  shape for subdivision pruning) or should the code compute the true
  farthest pair? The internal comment block believes it computes the
  farthest pair — it doesn't; that comment is also stale (not touched:
  internal files are out of scope).
- **Constructors throw on reversed endpoints** (`end < start` →
  `Error 'Interval end must be greater than or equal to start'`), and it
  cascades: `fromSize` throws on negative size, `fromMinMax()` with no
  arguments throws (min/max of nothing → `[∞, −∞]`). None of the five
  constructor docs said so; all now carry `@throws` (verified each).
- `Bounds`/`Bounds2d`: applied the skill reference's teleport-test rewrite
  (re-verified against today's code; the accepting-operations inventory is
  now exhaustive: 1D `lerp`/`normalize`/`remap`/`size`, 2D
  `size`/`minDistance`/`maxDistance`). Also stated that structural bounds
  do not enforce `start <= end`, which the branded types do — this drives
  the min/max normalization notes on `size`/`minDistance`/`maxDistance`.
- `containsInterval`/`containsInterval2d`: added "comparisons are exact —
  no tolerance" (raw `>`/`===` in the implementation; the tolerant path is
  `containsApprox`, consistent with PRECISION.md regime 1).
- `union`: added hull-not-set-union clarification (disjoint inputs are
  bridged, verified).
- `filter`: static type says the input array type survives; runtime array
  is the filtered subset. `@returns` now states both.
- `toLerpFn`/`toNormalizeFn`/`toRemapFn`: no precomputation inside
  (checked) — described as pipe/map-shaped forms, no perf claim.
- `scaleShift`/`ScaleShift`: `@returns` was placeholder ("An object
  containing the scale and shift values"); now states the equation
  `x * scale + shift`.
- The `is*` cluster (8 predicates) wore the "Type-narrowing predicate:"
  genre-label opener (skill failure mode 8) and had no `@param`/`@returns`;
  rewritten behavior-first with exact-kind vs at-side cross-references.
- Missing data-last summaries added (`aligned`, `containsInterval`,
  `union`, `containsVector`, `containsInterval2d`, `equals`,
  `minDistance`, `maxDistance` — CLAUDE.md requires a one-line summary on
  the data-last overload).
- `equals` (1D): `1.1.0` → `2.0.0` per the audit.

## solution/

- The `Solution` type doc's operations inventory named `value`, which is
  not an export (the operation is `valueOrUndefined`); fixed. `One`/`Two`/
  `Three` had bare `@since`-only blocks; now describe order and accessors.
- Nearly every function block lacked `@param`/`@returns` (CLAUDE.md
  requires them); added throughout, with `@throws` on `fromArray` and the
  `unsafe*` family (messages verified by execution: e.g.
  `'Solution.unsafeValue on empty Solution'`,
  `'Solution can hold at most 3 values, got 4'`).
- `unsafeValue`/`clip`/`clipApprox`/`map`/`match` had one shared block
  above the const; restructured per-overload per the dual-signature
  convention (data-first carries the contract; data-last keeps summary +
  formula). Both embedded examples executed against real polynomials
  (`match` over `LinearPolynomial.solveInverse`, `unsafeValue` over
  `CubicPolynomial.solveInverse`).
- "ULPs" → "ulps" (PRECISION.md's casing); `clipApprox` now names
  `EPSILON` as the tolerance (implementation delegates to
  `containsApprox` default).
- No change needed: `Solution` type doc body (strong), `None`, `Some`,
  `AtMost*` aliases beyond dash swaps, `isNone`/`isSome` beyond the
  genre-label rewrite.

## monotonicity/

- Converted the 3×4 states table to a list (prose-doctor house style:
  tables earn their keep at 4+ columns / 6+ rows); trimmed the
  "principled, not arbitrary" rhetorical contrast to the OR-property fact
  it was justifying.
- `fromComparison` compares exactly (raw `<`/`>`): endpoint values one ulp
  apart never classify `Constant`. Stated, with a pointer to
  `fromDerivativeRange` for noisy inputs (behavior verified).
- `fromDerivativeRange` gained a verified example showing the
  graze-tolerance case (`-1e-15` dip still classifies `Increasing`); its
  double-dash sentence restructured.
- `isStrict` lost the genre-label opener.
- No change needed: the four state constants (accurate, compact) and the
  `fromDerivativeRange` rationale paragraphs (already PRECISION.md
  regime 3 distilled — the strongest block in the module).
- Session note: `origin/docs/comment-pass` appeared mid-run pointing at
  an earlier commit of this branch. No `git push` was run by this pass;
  something outside the session (IDE sync?) is mirroring the branch.

## matrix/

- **Found doc bug: `traits.ts` claimed the wrong tolerance regime.**
  `Invertible` said "determinant is non-zero (within the default absolute
  tolerance)"; the implementation (and PRECISION.md regime 3) uses
  `RELATIVE_TOLERANCE` × the Hadamard bound — scale-free, not absolute.
  Same wrong claim sat on `isInvertible` in both 3×3 and 4×4. All fixed.
  traits.ts also said the refiners live "on each matrix module" — 2×2 has
  none (no `inverse` at all); now names 3×3/4×4.
- **Found broken examples.** (a) `Matrix2x2.vectorProductRight`'s example
  claimed `(33, 62)`; the product is `(23, 34)` (wrong arithmetic in the
  shipped comment). (b) `Matrix3x3.solveSystem`'s example matrix `(1…9)`
  is singular — the documented call throws
  (`det = 0`, verified). Replaced with a verified solvable system.
  (c) Example imports referenced `curvy/matrix2x2`/`curvy/matrix3x3`/
  `curvy/vector3` — 1.x module paths that no longer exist (same rot class
  as the reference doc's `curvy/utils` case), and one example called
  `Vector3.vector3(...)`, which was never an export. All examples now
  import-free with executed values.
- **`make` defaults were wrong in 2×2** ("Defaults to 0" ×4; actually each
  omitted value copies the previous argument — `make(5)` fills the matrix).
  3×3 had no default docs (same chain); **4×4 uses a different rule**:
  first row cascades, later rows default to the first row's columns, so
  `make(1, 2, 3, 4)` repeats the row (all verified by run and against the
  internals).
- `solveSystem` (all sizes): documented the exact-zero-determinant throw
  and the near-singular conditioning caveat (PRECISION.md's construction
  guard; throw verified). `vectorProductLeft`/`Right` now define the
  convention (`M · v` vs `vᵀ · M`) instead of naming it.
- `minor` (3×3, 4×4) returns the submatrix, not the scalar minor the name
  suggests; docs now say so. 4×4 `minor` and `fromColumns` were missing
  `@since`/`@returns`.
- @since audit applied: `equals` pairs, 4×4 `identity`/`multiply`
  (`1.1.0` → `2.0.0`; identity/multiply introduced 2026-05-09 at
  `bc6fb50`, after 1.0.9).
- Coordinate selectors (`0`/`'x'` etc.) now documented on the Coordinate
  types and the set/get params.
- No change needed: `fromRows`, `toRows`/`toColumns`, `transpose`,
  `multiply` bodies (correct `a · b` statement), 3×3/4×4 `reverseRows`/
  `reverseColumns` ("reversed" is accurate at these sizes; 2×2 now says
  "swaps").

## polynomial/

Two found code bugs (docs describe current behavior; both need fixes):

- **`LinearPolynomial.domain` throws for every decreasing polynomial.**
  It builds `Interval.make(x(range.start), x(range.end))` unsorted; a
  decreasing polynomial yields reversed endpoints and the interval
  constructor throws (verified: `domain(make(1, -2), [3, 7])` →
  `'Interval end must be greater than or equal to start'`). Quadratic and
  cubic use `fromMinMax` and are fine. Fix: sort (or `fromMinMax`) in
  `linear.internal.ts`. The doc now carries an honest `@throws`.
- **`QuadraticPolynomial.curvature` has a parenthesization bug**: it
  computes `|p''| / (1 + |p'(x)|³)` — `1 + (d ** 2) ** 1.5` — instead of
  the standard `|p''| / (1 + p'(x)²)^(3/2)`. Verified numerically
  (`curvature(x², 1)` = 0.2222 vs standard 0.1789); cubic's curvature is
  correctly parenthesized, confirming intent. The quadratic doc names the
  deviation until the fix.

Other findings:

- `domain` constant-polynomial semantics are inconsistent: linear special-
  cases the degenerate range `[c0, c0]` (returns the full line) but
  returns `none` for any wider range containing `c0`; quadratic/cubic have
  no special case at all (always `none` for constants). Documented
  per-module; the asymmetry is an open contract question.
- The reference doc's open question on `domain` ("behavior when an
  endpoint value is never attained") is resolved by the implementation:
  `none` only when _both_ endpoint values are unattained; one-sided hulls
  otherwise. Documented on quadratic/cubic, with the reference's `x²` over
  `[1, 4]` → `[-2, 2]` hull example executed and shipped on quadratic.
- "Solves for x" verb corrected to "Evaluates at" across all three
  modules (the reference's failure mode 4); solveInverse reframed as
  "finds the inputs attaining y" with ascending-order and
  tolerance-aware root-count contracts (verified: ascending, double-root
  collapse).
- `extreme` (quadratic) returns `Vector2 | null` — documented the `null`
  case (degenerate `c2 === 0`) and the vertex-point shape; cubic's
  `extrema` returns x-locations (not points) — shape difference now
  explicit in both docs.
- Verified and documented: `length` closed form for the parabola (matches
  the analytic value to full precision) vs quadrature for the cubic;
  `fromPoints` divide-by-zero on repeated x's; `subdivide`'s open-interval
  throw; `roots` ordering; quadratic `make`'s `c2` default of `1` (already
  documented — the only non-zero default in the family).
- `toSolver`/`toInverseSolver` (quadratic) and `make`/`fromColumns`-class
  blocks (cubic `make`) were missing `@since`/`@returns`; added.
  `equals` tags moved off phantom 1.1.0 (6 tags across the module).
- traits.ts: `monotonicity()` "returns `'increasing'`" was stale (numeric
  enum since the Monotonicity rework); fixed.

## characteristic/

- In scope despite being absent from the task's module ordering (it is in
  package.json exports). Small and strong; repairs were prose-level: the
  shouted "The matrix IS the family", `s`-vs-`tension` name drift between
  `cubicCardinal`'s prose and its parameter, placeholder
  `@param tension - The tension parameter.`, link conversions.
- Verified the four matrices against the standard Bézier/Hermite/uniform
  B-spline/Cardinal bases (all match; `cubicCatmullRom` =
  `cubicCardinal(0.5)` consistent with the tension story).
- No change needed: `apply` (the strongest block in the module — channel
  model, pipeline usage, generalization note all accurate against the
  implementation).

## transform/

- **Wrong tolerance claims again** (same class as matrix/): `isInvertible`
  said "determinant non-zero within the default absolute tolerance" (it
  delegates to the Hadamard-bound test) and `equals` said "within the
  default absolute tolerance" (it delegates to `Matrix3x3.equals`'s
  coincident hybrid band). Both fixed.
- `fromMatrix`'s `@throws` now names the actual tolerance shape (zero band
  widened by the matrix's other entries, per PRECISION.md).
- `andThen`'s inline example moved to `@example`, import boilerplate
  dropped, executed (translate-then-rotate maps the origin to `(0, 1)` up
  to representation error). `reflectAcrossLine`'s throw verified as an
  exact zero-magnitude test.
- traits.ts's `{@link ../matrix/traits.ts}` file-path link converted to
  prose.
- No change needed: `rotate` (the y-up/y-down orientation note is exactly
  the right surprise documentation), `scaleAround`, `shear`, `linearPart`
  rationale (verified against usage).

## curve/

- "Solves the curve for parameter t" → "Evaluates at" across all four
  curve kinds (the reference's evaluate-vs-solve lesson), with
  no-clamping/extrapolation stated on data-first overloads.
- **The "(approximates)" hedge on `LinearCurve2d.length` was false** — a
  straight segment's length is the exact closed form
  `|velocity| * size(interval)` (verified). Cubic's hedge was accurate
  and now says _why_ (numerical quadrature).
- `solveAtX`/`solveAtY` return the **crossing value** (y at x / x at y),
  not the parameter `t` — verified by run and now unambiguous;
  "the empty tuple" corrected to `Solution.none` with its conditions.
- The `Type-narrowing predicate:` genre label (the reference's failure
  mode 8, quoted from this codebase) removed across ~30 predicate blocks
  in curve files; directional predicates and assertions that carried bare
  `@since`-only blocks got full contracts, applied by exact-match
  scripting with per-file verification and a final zero-residue grep.
- `curve2d.ts` (`Curve2dOps`) is not re-exported from the curve index —
  it reaches consumers only through `Path2d.make`'s signature. Treated
  lightly (contributor-leaning by design); "intentionally small"
  self-justification trimmed.
- `src/dimensions.ts` and `src/length.ts` carry no doc blocks and no
  direct export entry; dimensions' types are reachable through public
  signatures (`Vector2 extends TwoDimensional`). No blocks to repair;
  whether `TwoDimensional` deserves one is an open question for the
  author.

## path/

- **The reference doc's failure-mode-4 specimen (`cubic2d.solve`,
  "Solves a cubic path for a given parameter… The solved vector") was
  still live**; its worked rewrite now ships on all three polynomial
  paths, including the resolved open contract question: `u` clamps to the
  nearest endpoint within an `EPSILON` grazing band and **throws** beyond
  it (`'path parameter must be within [0, 1]'`, verified).
- **The exemplar `rationalCubic2d.solve` lost its "delegates to
  `RationalCubicCurve2d.solve`" clause** per the skill reference's
  contributor-leakage lesson (failure mode 5); `boundingBox`'s
  "Per-segment delegates to" likewise reworded to name the public
  per-segment operation as fact rather than wiring.
- **Found inconsistency: `RationalCubicPath2d.solve` has no range guard.**
  Its siblings throw the clear invariant; the rational path indexes past
  the segment array and dies with `Cannot read properties of undefined
(reading 'w')` (verified). Documented as "not range-checked"; the code
  should adopt the same invariant.
- Path constructors (`make`/`fromArray`, all four kinds) throw on empty
  input (`'… requires at least one curve'`, verified); none documented
  it. All now carry `@throws`.
- Trait-cluster genre labels rewritten with the semantics from
  `path/traits.ts` (x/y monotonicity across segments = per-segment
  monotone + non-overlapping ranges; `MonotonicX` as the `solveAtX`
  prerequisite). `solveByDistance` off the phantom 1.1.0 (introduced
  post-1.0.9 at `bc6fb50`).

## splines/

- **The reference's placeholder specimens repaired from the
  implementation** (the reference explicitly declines to guess these):
  - `appendTangentAligned.ratio`: length of the _derived_ first handle
    relative to the incoming handle, along the shared tangent. `1`
    matches lengths (C¹) — confirmed structurally:
    `appendVelocityAligned` delegates with `ratio = 1`. `0` collapses
    the handle; negative reverses the tangent (cusp). Geometry verified
    by run (`ratio = 2` doubles the mirrored handle).
  - `appendCurvatureAligned.a`/`b`: `a` is the same tangent-scale role
    (defined in place, not by analogy — failure mode 9); `b` slides the
    derived second handle along the shared tangent within the
    G²-preserving family (`b = 0` is the default member), read off
    `p5 = p3 + (p3−p2)(2a + a² + b/2) + (p1−p2)a²`.
- The whole append family now states which handles are derived vs
  passed, and carries `@since 1.0.1` (family committed one minute before
  the 1.0.1 publish — registry-verified).
- `Bezier2d` constructors document the `3n + 1` control-point invariant
  and its two throw messages (both verified).
- cardinal2d (exemplar file), rationalBezier2d, hermite2d, linear2d:
  already strong; repairs were `{@link}` conversions (including the
  exemplar `transform`'s `{@link toBezier}`), dash appositions, and
  freshness-claim softening. `splines/util.ts` is not exported from the
  index — out of scope.
- Note: interface freshness claims ("all operations create new
  instances") were softened module-wide to the immutability promise;
  verified false in vectors (scale identity) and unverifiable cheaply
  elsewhere — the weaker claim is safe everywhere.

## Final checks

- `pnpm typecheck` (run per-module throughout and at the end): clean.
- `pnpm lint` (oxlint, 101 files): 0 warnings, 0 errors.
- `pnpm format` (oxfmt): source files clean; RUN-NOTES.md formatted
  before its own commit.
- `pnpm test` (vitest): **553/553 pass** across 16 files.
- No runtime file changed: `git diff --stat` per commit touches only doc
  comments in public `.ts` files (internal files untouched, per scope).

## Skill friction

- **Exemplars vs. rules.** CLAUDE.md names `coincident` an exemplar, but the
  block violated CLAUDE.md's own cross-reference convention (`{@link}` ×4)
  and skill rule 9 (two clause-level breaks in one sentence). An exemplar
  that predates part of the standard leaves the pass unsure whether the
  exemplar or the rule is calibration truth. Cited: `coincident`,
  `number.ts`. (Also upcoming: `cardinal2d.transform` exemplar contains
  `{@link toBezier}`.)
- **Example default.** The task brief says examples are "default-on for
  non-trivial operations"; CLAUDE.md's actual rule is narrower (add where a
  first-time caller would hold the API wrong, or where a concrete input
  beats a paragraph); and the blessed exemplars (`rationalCubic2d.solve`,
  `boundingBox` — dual signatures, decidedly non-trivial) ship none.
  Followed CLAUDE.md's literal rule: kept/added examples on dual shapes and
  surprise-carrying contracts, no example added where the first guess is
  right. Cited: `path/rationalCubic2d.ts` vs CLAUDE.md Examples bullet.
- **Skill reference flags an exemplar as a failure case.** comment-doctor's
  reference (failure mode 5, contributor leakage) quotes
  `rationalCubic2d.solve`'s "delegates to `RationalCubicCurve2d.solve`"
  clause as a defect; CLAUDE.md holds the same block up as the standard.
  Resolved per the skill (CLAUDE.md is silent on leakage, so no conflict):
  the clause is repaired in `path/rationalCubic2d.ts`.
- **The @since clock needs an evidence standard.** CLAUDE.md defines the
  behavior clock ("earliest release in which a consumer could obtain the
  behavior") but not how to verify it or what to do when a tag names a
  release that never shipped. This pass found 30 tags citing a phantom
  `1.1.0` and a dozen `1.0.0` tags for symbols whose module entry first
  shipped in 1.0.4 — all fixed from `npm view curvy versions/time` plus
  introduction-commit traces, which is real work per tag. A sentence in
  CLAUDE.md naming the registry as ground truth (and the alpha-line →
  `2.0.0` collapse, which I inferred from `coincident`'s tag) would make
  the next pass mechanical. Cited: `EPSILON` (1.1.0 → 2.0.0), `pipe`
  (1.0.0 → 1.0.4), `roundUp` (1.0.0 → 1.0.9), splines `append*` (none →
  1.0.1).
- **Dual-signature rule conflict, resolved by precedence but unfixed at
  the source.** CLAUDE.md: data-last keeps "a one-line summary, its tags,
  and its own `@since`". comment-doctor's reference (curried-pair
  checklist): "Twin overloads carry the same full body prose". CLAUDE.md
  won throughout, but the skill reference should either adopt the
  summary-form rule or note the divergence — as written, every dual pair
  in this repo violates its checklist. Cited: any dual export.
- **"Convert old links when touching their block" under-specifies a full
  pass.** When every block is reviewed, "touching" is ambiguous —
  link-only conversion makes a block "changed" that is otherwise "no
  change needed". I converted every `{@link}` in public files (≈40) and
  counted link-only edits as no-change-plus-convention. Worth a CLAUDE.md
  word. Cited: `epsEquals`, `unitOpen`, `cardinal2d.transform`.
- **No `@throws` convention exists.** CLAUDE.md specifies `@param`/
  `@returns`/`@since` but not `@throws`; the codebase mixed "@throws If…",
  "@throws When…", and omission for functions that do throw (all interval
  constructors, `solveSystem`, path constructors). I standardized on
  ``@throws `Error` when …`` and added it wherever a throw was verified —
  the form needs blessing. Cited: `Interval.make`, `Matrix2x2.solveSystem`.
- **Documenting found defects has no house policy.** Verification surfaced
  real bugs (`LinearPolynomial.domain`'s decreasing-case throw,
  `QuadraticPolynomial.curvature`'s formula, `toStartClosed`'s swapped
  overloads, `maxDistance`'s farthest-pair claim,
  `RationalCubicPath2d.solve`'s missing guard). The skill says document
  the surprise where the reader meets it; nothing says how to mark
  "this is a defect, not a contract". I documented actual behavior
  (with the deviation named inline where a consumer computes wrong
  numbers today, e.g. quadratic `curvature`) and flagged every case here
  for code fixes — those doc sentences should be deleted with the fixes.
- **prose-doctor's table threshold cuts against a genuinely tabular
  mapping.** The `Monotonicity` states table (3 columns × 4 rows) fell
  under the "lists until 4+ columns / 6+ rows" house rule and became a
  list; the table arguably scanned better for a value/name/meaning
  mapping. Cited: `monotonicity.ts` states list.
- **Example-format friction is settled but was expensive to infer.** "No
  import boilerplate" + "consumer's namespaced vocabulary" required
  reading the index files to learn the `Vector2.make(...)` call shape;
  1.x-era examples carried imports for modules that no longer exist
  (`curvy/matrix2x2`, the reference's `curvy/utils` case) and, worse,
  wrong arithmetic (`vectorProductRight`) and a singular example matrix
  whose documented call throws (`Matrix3x3.solveSystem`). "An example
  ships only verified — run it" is the single highest-value rule in the
  skill for this codebase.
