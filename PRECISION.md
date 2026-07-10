# Precision

How curvy handles floating-point arithmetic: what it computes exactly, what
it compares tolerantly, what the tolerances are relative to, and what the
resulting guarantees mean. This is the reference for the library's numerical
contract. If a behavior contradicts this document, one of the two is a bug.

## The model

Two rules apply everywhere:

1. **Constructions are exact IEEE 754.** No operation rounds, snaps, or
   otherwise post-processes its result: building a spline, collecting a
   characteristic matrix product, evaluating a polynomial, and transforming
   a curve all return exactly what the arithmetic produces.
2. **Predicates are tolerance-aware.** The library never decides a discrete
   question about a computed value by raw comparison: it judges equality,
   monotonicity, invertibility, continuity, and root count inside a
   tolerance band scaled to the data.

Rule 1 holds because construction error is harmless on its own terms. Every
operation is exactly rounded, so a chain of arithmetic returns the exact
result for inputs a few ulps away: no consumer of the values can distinguish
that from a microscopically different curve. Even cancellation fits this
bound. Defensive rounding would only hide real corruption under
clean-looking values.

Rule 2 exists because predicates are where that same error becomes a wrong
answer. A **discrete decision** (a sign test, a root count, a containment
check) reads a category off a value, and cancellation manufactures values
that sit within rounding distance of the decision boundary, all residue and
no signal. A raw comparison lets those last bits pick the category; a
tolerance band scaled to the data does not. The
[background links](#background) at the end cover the mechanics.

The two rules together make every classification in the library **invariant
under uniform scaling of the input data**. Scale all control points by 10⁶
and every `is*`/`as*` verdict, root count, and continuity check is unchanged,
because every tolerance is proportional to the magnitudes that enter the
question.

## The three regimes

Rule 2 promises a tolerance band scaled to the data. The three regimes are
where that scale comes from. Every tolerant comparison in the library uses
exactly one of them.

### 1. Normalized domains

Curve parameter space is `[0, 1]` by construction, so a fixed absolute band
is meaningful there without any scaling. `Interval.containsApprox`,
`Solution.clipApprox`, and the interval clipping inside `solveAtX`/`solveAtY`
use plain absolute `EPSILON` (`1e-10`, from `curvy/number`) via `epsEquals`
semantics. `epsEquals(a, b, eps?)` itself remains available as the raw
absolute comparison for any caller who knows their domain's scale.

### 2. Identity of values and points

`coincident(a, b, absolute?, relative?)` answers "Are these the same value /
the same point?":

```
|a − b| ≤ absolute + relative · max(|a|, |b|)
```

with `absolute = EPSILON` and `relative = RELATIVE_TOLERANCE` (`1e-12`) by
default. The rationale for both values lives with their definitions in
`curvy/number`. The relative term covers rounding noise, which grows with
magnitude: an ulp at 10⁹ is ~1.2e-7, far outside any fixed absolute band.
The absolute term covers the neighborhood of zero, where relative comparison
degenerates: no nonzero value is relatively close to `0`, and real data is
full of exact zeros. This hybrid band is at least as wide as the absolute
comparison alone.

Built on `coincident`:

- `equals` on `Vector2`/`Vector3`/`Vector4`, `Matrix2x2`/`3x3`/`4x4`, all
  polynomial degrees, `Interval` (per field)
- `Path2d` continuity (`isContinuous`, `asContinuous`) and `toPathData`'s
  move-command insertion
- the knot-ordering checks behind the per-axis path monotonicity brands
- knot snapping and segment bracketing in `solveAtX`/`solveAtY`
- `Affine2d.fromMatrix`'s bottom-row check, with its zero band widened by
  the magnitude of the matrix's other entries

**`coincident` is not transitive.** `coincident(a, b)` and `coincident(b, c)`
do not imply `coincident(a, c)`. Chains of pairwise-coincident values can
drift beyond the band. That is the behavior continuity needs: it claims each
junction's two knots agree, and the first and last knots of a long path may
still sit far apart.

### 3. Sign and degeneracy of derived scalars

A quantity computed as a cancellation between terms has a sign that is pure
noise once its magnitude falls below `RELATIVE_TOLERANCE` times the terms
that formed it. Determinants, discriminants, and derivatives that a
construction drives to zero all fit this shape, and each such decision names
its own scale:

| decision                                | scale                                                  |
| --------------------------------------- | ------------------------------------------------------ |
| polynomial monotonicity (sign coverage) | largest derivative value attained on the interval      |
| matrix invertibility                    | Hadamard bound: the product of the row norms           |
| quadratic root count                    | `max(c1², ǀ4·c2·cǀ)`: the two discriminant terms       |
| cubic solver branch dispatch            | `max(ǀ4p³ǀ, 27q²)`: the depressed discriminant's terms |
| rational easing constraint singularity  | the Cramer-system term magnitudes                      |
| arc-length Newton convergence           | the segment length                                     |

**Monotonicity** classification reads the derivative's _values_ and ignores
its root locations (`Monotonicity.fromDerivativeRange(min, max, tolerance?)`).
Root locations are ill-conditioned exactly where monotonicity is delicate:
near a grazing touch, an ulp of coefficient noise moves a root across an
interval boundary, while the derivative values it corresponds to stay pinned
near zero. The classifier takes the derivative's exact range over the
interval (endpoint values, plus interior stationary values) and sets each
sign-coverage bit (positive values attained, negative values attained) only
when the corresponding bound exceeds the band. The
tolerant classification preserves the bitmask encoding: the OR of two
adjacent subintervals' classifications is still the classification of their
union.

**Invertibility** compares the determinant against the Hadamard bound, which
the absolute determinant can never exceed. Their ratio is a scale-free
measure of row independence (1 for orthogonal rows, 0 for parallel ones), so
`diag(1e-8, 1e-8, 1)` is correctly invertible (its inverse is exactly
`diag(1e8, 1e8, 1)`) while a large matrix with nearly dependent rows is
correctly singular even when its raw determinant is sizeable.

## What the brands guarantee

Trait brands are claims at working precision, in the backward-error sense:
_the object has the property, or is within rounding distance of one that
does._ `Monotonic` (and `Increasing`/`Decreasing`, per axis or combined)
certifies that the derivative takes no opposite-sign values exceeding
`RELATIVE_TOLERANCE × max|derivative|` on the interval: exactly the
condition under which `solveInverse` is unique to matching precision, the
purpose the brand exists to serve. A brand is not a claim of
exact-arithmetic truth, and cannot be: near the boundary, exact-arithmetic
truth is unknowable from rounded coefficients.

## What stays exact

Two checks in the codebase look like rule 2 predicates but are exempt, each
for its own reason:

- **Degree-collapse dispatch** (`c3 === 0`, `c2 === 0` in the solvers and
  classifiers) routes to cheaper code paths and makes no semantic claim. A
  cubic with `c3 = 1e-17` of noise takes the general path, which handles
  near-degeneracy anyway.
- **`solveSystem`'s division guard** belongs to a construction, not a
  predicate. It rejects exact division by zero. A nearly singular system
  returns a result whose error is proportional to its conditioning, which
  is the honest outcome for a construction.

## Working with the model

**Overriding tolerances.** Predicates that take tolerances accept them per
call (`coincident(a, b, absolute, relative)`,
`fromDerivativeRange(min, max, tolerance)`, `epsEquals(a, b, eps)`,
`containsApprox(i, v, eps)`). Pass an explicit `absolute` when your domain
has a known resolution, e.g. comparing font-unit coordinates where anything
under half a unit is meaningless. There is no global tolerance state: the
type system caches brands, and a brand asserted under one ambient setting
and consumed under another would be unsound.

**Known limit: extreme translation.** The hybrid band scales with coordinate
_magnitude_, which conflates distance-from-origin with feature size. Geometry
of unit feature size living at coordinates ~10¹² gets a band of ~1, the same
order as its features. The band reflects what doubles can store: at that
offset, they cannot hold unit-scale geometry to better than ~10⁻⁴. If you
need fine features far from the origin, translate toward the origin first:
doubles near zero have precision to spare.

**Writing numerical tests.** Dyadic values (integers, halves, quarters) are
exactly representable and never round: ideal for exactness tests, useless for
noise tests. To exercise rounding behavior, use non-dyadic coordinates
(`0.1`, `k + 2.3`). Two properties make good regression guards: uniform
scaling of all inputs must not change any classification, and genuinely
distinct geometry must stay distinct at every magnitude.

**Performance.** All of these predicates cost single nanoseconds: a few
comparisons and multiplies next to solvers running `sqrt`/`cbrt`/`acos` and
32-point quadrature. None is hot enough to justify weakening the model.

## Background

This document leans on three ideas from floating-point arithmetic:

- **ulp**: the gap between two adjacent representable doubles, 2⁻⁵²
  (≈ 2.2e-16) relative to the value, so it grows with magnitude.
- **cancellation**: subtracting nearly equal values erases the correct
  leading digits and leaves only prior rounding residue.
- **backward error**: describing a computed result by the smallest input
  change that would make it exact, which is the natural way to state
  floating-point guarantees.

For the mechanics, in ascending depth:

- [The Floating-Point Guide](https://floating-point-gui.de/): representation,
  rounding, and why `0.1 + 0.2 !== 0.3`.
- Bruce Dawson,
  [Comparing Floating Point Numbers, 2012 Edition](https://randomascii.wordpress.com/2012/02/25/comparing-floating-point-numbers-2012-edition/):
  the design space of comparison tolerances, and the closest companion to
  this document.
- David Goldberg,
  [What Every Computer Scientist Should Know About Floating-Point Arithmetic](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html):
  the deep end.
