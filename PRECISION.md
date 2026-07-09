# Precision

How curvy handles floating-point arithmetic: what is computed exactly, what is
compared tolerantly, what the tolerances are relative to, and what the
resulting guarantees mean. This is the reference for the library's numerical
contract; if a behavior contradicts this document, one of the two is a bug.

## The model

Two rules, applied everywhere:

1. **Constructions are exact IEEE 754.** Building a spline, collecting a
   characteristic matrix product, evaluating a polynomial, transforming a
   curve — no operation rounds, snaps, or otherwise post-processes its result.
   Values are exactly what the arithmetic produces.
2. **Predicates are tolerance-aware.** Every discrete question asked of
   computed values — equal? monotonic? invertible? continuous? how many
   roots? — is answered inside a tolerance band scaled to the data, never by
   raw comparison.

The split follows from how float error behaves. Each arithmetic operation is
exactly rounded (at most half an ulp of relative error), so long chains of
construction arithmetic stay accurate to roughly their length in ulps —
proportionate error that no downstream consumer can distinguish from a
microscopically different input. The two places error turns into _wrongness_
are different in kind: **cancellation** (subtracting nearly equal computed
values erases the correct leading digits and promotes prior rounding residue
to the entire result) and **discrete decisions** (a sign test or root count
read off a value that sits within rounding distance of the decision
boundary). Constructions tolerate the first; predicates absorb the second.
Tolerating error at the predicate layer is also why constructions are free to
skip defensive rounding entirely — curvy v1 snapped every constructed value
to 8 decimals, which traded silent geometry corruption for the illusion of
cleanliness, and v2 removed it.

A useful consequence of the two rules: every classification in the library is
**invariant under uniform scaling of the input data**. Scale all control
points by 10⁶ and every `is*`/`as*` verdict, root count, and continuity check
is unchanged, because every tolerance is proportional to the magnitudes that
enter the question.

## The constants (`curvy/number`)

| constant             | value   | meaning                                                                                                                                                  |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EPSILON`            | `1e-10` | Absolute coincidence floor. A modeling default that assumes coordinates of order ~1; pass explicit tolerances when your data has a different resolution. |
| `RELATIVE_TOLERANCE` | `1e-12` | Relative band for sign and degeneracy decisions about computed quantities. Multiply by the natural magnitude of the quantity under test.                 |

`RELATIVE_TOLERANCE` sits ~4,500× above per-operation rounding noise
(2⁻⁵² ≈ 2.2e-16 relative) — headroom for noise accumulated across an entire
construction pipeline — and far below anything geometrically meaningful. A
value inside the band can only be noise; a genuine geometric feature exceeds
it by orders of magnitude.

## The three regimes

Every tolerant comparison in the library falls into one of three regimes,
distinguished by where its scale comes from.

### 1. Normalized domains — absolute is already relative

Curve parameter space is `[0, 1]` by construction, so a fixed absolute band
is meaningful there without any scaling. `Interval.containsApprox`,
`Solution.clipApprox`, and the interval clipping inside `solveAtX`/`solveAtY`
use plain absolute `EPSILON` for this reason, via `epsEquals` semantics.
`epsEquals(a, b, eps?)` itself remains available as the raw absolute
comparison for any caller who knows their domain's scale.

### 2. Identity of values and points — the hybrid band

"Are these the same value / the same point?" is answered by
`coincident(a, b, options?)`:

```
|a − b| ≤ absolute + relative · max(|a|, |b|)
```

with `absolute = EPSILON` and `relative = RELATIVE_TOLERANCE` by default. The
relative term covers rounding noise, which grows with magnitude — half an ulp
at 10⁹ is ~1.2e-7, far outside any fixed absolute band — while the absolute
term covers the neighborhood of zero, where relative comparison degenerates
(no nonzero value is relatively close to `0`, and real data is full of exact
zeros). The band is strictly wider than the absolute comparison alone.

Built on `coincident`:

- `equals` on `Vector2`/`Vector3`/`Vector4`, `Matrix2x2`/`3x3`/`4x4`, all
  polynomial degrees, `Interval` (per field);
- `Path2d` continuity (`isContinuous`, `asContinuous`) and `toPathData`'s
  move-command insertion;
- the knot-ordering checks behind the per-axis path monotonicity brands;
- knot snapping and segment bracketing in `solveAtX`/`solveAtY`;
- `Affine2d.fromMatrix`'s bottom-row check, with its zero band additionally
  widened by the magnitude of the matrix's other entries.

**`coincident` is not transitive.** `coincident(a, b)` and `coincident(b, c)`
do not imply `coincident(a, c)`; chains of pairwise-coincident values can
drift beyond the band. This is intentional — continuity, for example, is a
pairwise claim about each junction, not a claim that all knots of a long path
agree to within one band.

### 3. Sign and degeneracy of derived scalars — relative to the forming terms

A quantity computed as a cancellation between terms — a determinant, a
discriminant, a derivative that a construction drives to zero — has a sign
that is pure noise once its magnitude falls below `RELATIVE_TOLERANCE` times
the terms that formed it. Each such decision names its own scale:

| decision                                | scale                                                   |
| --------------------------------------- | ------------------------------------------------------- |
| polynomial monotonicity (sign coverage) | largest derivative value attained on the interval       |
| matrix invertibility                    | Hadamard bound — the product of the row norms           |
| quadratic root count                    | `max(c1², ǀ4·c2·cǀ)` — the two discriminant terms       |
| cubic solver branch dispatch            | `max(ǀ4p³ǀ, 27q²)` — the depressed discriminant's terms |
| rational easing constraint singularity  | the Cramer-system term magnitudes                       |
| arc-length Newton convergence           | the segment length                                      |

Two of these deserve elaboration:

**Monotonicity** is classified from the derivative's _values_, not its root
locations (`Monotonicity.fromDerivativeRange(min, max, tolerance?)`). Root
locations are ill-conditioned exactly where monotonicity is delicate: near a
grazing touch, an ulp of coefficient noise moves a root across an interval
boundary, while the derivative values it corresponds to stay pinned near
zero. The classifier takes the derivative's exact range over the interval
(endpoint values, plus interior stationary values) and sets each
sign-coverage bit only when the corresponding bound exceeds the band. The
bitmask encoding is preserved: the OR of two adjacent subintervals'
classifications is still the classification of their union.

**Invertibility** compares the determinant against the Hadamard bound, which
the absolute determinant can never exceed. Their ratio is a scale-free
measure of row independence — 1 for orthogonal rows, 0 for parallel ones —
so `diag(1e-8, 1e-8, 1)` is correctly invertible (its inverse is exactly
`diag(1e8, 1e8, 1)`) while a large matrix with nearly dependent rows is
correctly singular even when its raw determinant is sizeable.

## What the brands guarantee

Trait brands are claims at working precision, in the backward-error sense:
_the object has the property, or is within rounding distance of one that
does._ Concretely, `Monotonic` (and `Increasing`/`Decreasing`, per axis or
combined) certifies that the derivative takes no opposite-sign values
exceeding `RELATIVE_TOLERANCE × max|derivative|` on the interval — which is
exactly the condition under which `solveInverse` is unique to matching
precision, the purpose the brand exists to serve. A brand is not a claim of
exact-arithmetic truth, and cannot be: near the boundary, exact-arithmetic
truth is unknowable from rounded coefficients.

## What stays exact, deliberately

- **Degree-collapse dispatch** (`c3 === 0`, `c2 === 0` in the solvers and
  classifiers) — these route to cheaper code paths; they are not semantic
  claims. A cubic with `c3 = 1e-17` of noise takes the general path, which
  handles near-degeneracy anyway.
- **`solveSystem`'s division guard** — a construction, not a predicate. It
  rejects exact division by zero; a nearly singular system returns a result
  whose error is proportional to its conditioning, which is the honest
  outcome for a construction.
- **All construction arithmetic** — per rule 1.

## Working with the model

**Overriding tolerances.** Predicates that take tolerances accept them per
call (`coincident(a, b, { absolute, relative })`,
`fromDerivativeRange(min, max, tolerance)`, `epsEquals(a, b, eps)`,
`containsApprox(i, v, eps)`). Pass an explicit `absolute` when your domain
has a known resolution — e.g. comparing font-unit coordinates where anything
under half a unit is meaningless. There is no global tolerance state, by
design: brands are cached in the type system, and a brand asserted under one
ambient setting and consumed under another would be unsound.

**Known limit: extreme translation.** The hybrid band scales with coordinate
_magnitude_, which conflates distance-from-origin with feature size. Geometry
of unit feature size living at coordinates ~10¹² gets a coincidence band of
~1 — the same order as its features. This correctly reflects storage reality
(at that offset, doubles genuinely cannot hold unit-scale geometry to better
than ~10⁻⁴), but if you need fine features far from the origin, translate
toward the origin first — precision near zero is free.

**Writing numerical tests.** Dyadic values (integers, halves, quarters) are
exactly representable and never round: ideal for exactness tests, useless for
noise tests. To exercise rounding behavior, use non-dyadic coordinates
(`0.1`, `k + 2.3`). Two properties make good regression guards: uniform
scaling of all inputs must not change any classification, and genuinely
distinct geometry must stay distinct at every magnitude.

**Performance.** All of these predicates cost single nanoseconds — a few
comparisons and multiplies next to solvers running `sqrt`/`cbrt`/`acos` and
32-point quadrature. None is hot enough to justify weakening the model.
