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
under uniform scaling of the input data**. Scale all control points by 1e6
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

The same reasoning extends to any domain whose size is fixed by
construction rather than by the data: a band of `EPSILON * P` is to a
domain of size `P` what plain `EPSILON` is to `[0, 1]`. Cyclical axes use
exactly this generalization. `Dimension.congruent` compares the shortest
wrapped difference `Dimension.delta(d, a, b)` against `EPSILON * period`,
so `2*pi - 1e-16` and `0` are the same angle, and representatives whole
periods apart agree whenever their wrapped positions do. Because the band
scales with the period, the verdict is unchanged whether a hue axis is
stated as `[0, 360)` or `[0, 1)`. Like `coincident`, the comparison is not
transitive, and values stored millions of periods from zero lose angular
resolution to representation error before the band enters the question.

Rotations live on a fixed scale too. A unit quaternion has length `1` and a
rotation matrix has orthonormal columns whatever the data, so both checks
use plain `EPSILON`. `Quaternion.isUnit` tests
`abs(x^2 + y^2 + z^2 + w^2 - 1) <= EPSILON`, and `Rotation3d.fromMatrix3x3`
holds each column's squared length and each pair's dot product within
`EPSILON` of a rotation's. `Frame3d.make` normalizes its two directions and
requires their dot product within `EPSILON` of zero.

Unit normals put two plane questions on a fixed scale as well.
`Plane3d.intersection` reports no single point when the determinant of the
three unit normals is within `EPSILON` of zero, and `Plane3d.intersectRay`
calls a ray parallel to a plane when the cosine between the ray and the
normal is within `EPSILON` of zero.

### 2. Identity of values and points

`coincident(a, b, absolute?, relative?)` answers "Are these the same value /
the same point?":

```
|a - b| <= absolute + relative * max(|a|, |b|)
```

with `absolute = EPSILON` and `relative = RELATIVE_TOLERANCE` (`1e-12`) by
default. The rationale for both values lives with their definitions in
`curvy/number`. The relative term covers rounding noise, which grows with
magnitude: an ulp at 1e9 is ~1.2e-7, far outside any fixed absolute band.
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
- `Polygon2d.clip` and `split`'s on-the-line test, which counts a vertex
  as on the cutting line when its signed distance is within
  `EPSILON + RELATIVE_TOLERANCE * M`, `M` being the largest coordinate
  among the vertices and the line's origin
- the same on-plane test for 3D: `Polygon3d.clip` and `split`, the
  planarity check in `Polygon3d.isPlanar` and `isConvex`, and the
  start-on-the-plane case
  of `Plane3d.intersectRay`, with `M` taken over the coordinates and the
  plane's `|offset|`
- the ordering predicates in `curvy/number`: `before`, `atMost`, `within`,
  `inside`, `overlaps`, and `touches`

**`coincident` is not transitive.** `coincident(a, b)` and `coincident(b, c)`
do not imply `coincident(a, c)`. Chains of pairwise-coincident values can
drift beyond the band. That is the behavior continuity needs: it claims each
junction's two knots agree, and the first and last knots of a long path may
still sit far apart.

**Ordering.** The ordering predicates answer "Does this come before that?"
and its relatives with the same band, so rounding noise never orders two
values. `before` and `inside` are strict: they hold only beyond the band.
`atMost`, `within`, and `touches` are closed: they hold within it.
`overlaps` asks whether two ranges share more than a point, and `touches`
whether they share at least one.

**Non-finite values compare exactly.** Against an infinity the band is
infinite itself (`|5 - Infinity| <= relative * Infinity`) and would call
every finite value equal to it, while `Infinity - Infinity` is `NaN` and
would leave an infinity unequal to itself. So `coincident` falls back to
`===` when either value is non-finite: an infinity equals only the infinity
of the same sign, and `NaN` equals nothing. The ordering predicates inherit
this, so every finite value comes before `Infinity`.

### 3. Sign and degeneracy of derived scalars

A quantity computed as a cancellation between terms has a sign that is pure
noise once its magnitude falls below `RELATIVE_TOLERANCE` times the terms
that formed it. Determinants, discriminants, and derivatives that a
construction drives to zero all fit this shape, and each such decision names
its own scale:

| decision                                         | scale                                                      |
| ------------------------------------------------ | ---------------------------------------------------------- |
| polynomial monotonicity (sign coverage)          | largest derivative value attained on the interval          |
| matrix invertibility                             | Hadamard bound: the product of the row norms               |
| quadratic root count                             | `max(c1^2, \|4*c2*c\|)`: the two discriminant terms        |
| cubic solver branch dispatch                     | `max(\|4p^3\|, 27q^2)`: the depressed discriminant's terms |
| rational easing constraint singularity           | the Cramer-system term magnitudes                          |
| arc-length Newton convergence                    | the segment length                                         |
| polygon area sign (winding, degeneracy)          | the shoelace products, plus `M` times the edge lengths     |
| polygon corner turn (convexity, hull, fillets)   | the cross-product terms, plus `M` times the edge lengths   |
| 3D polygon and triangle area (normal, `through`) | the vector-area products, plus `M` times the edge lengths  |

In the polygon rows, `M` is the largest coordinate magnitude among the
vertices. Each edge vector is a difference of coordinates that large, so
it carries rounding error on the order of an ulp of `M`, and the band
grows with it. That ties the polygon verdicts to the known limit on
extreme translation below.

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

`Affine2d` and `Affine3d` apply the same test to their linear part alone.
Translation never makes an affine map singular, and counting the
translation column in the row norms would inflate the bound with distance
from the origin: a `1e-3` scale translated by `1000` would read as
singular.

## Certified approximations

Rule 1 covers constructions whose exact answer is representable. A few
operations construct an object in a genuinely different representation:
`RationalCubicCurve2d.approximateAsCubicCurves` and
`RationalCubicPath2d.approximateAsCubicPath` rebuild a rational curve from
polynomial cubics, `CoordinateSystem.image` rebuilds the nonlinear polar
image of a polynomial or rational chart path the same way, and the tolerance-taking `boundingBox`
on rational curves and paths returns a box it cannot compute tightly in
closed form. No exact answer exists in the output's representation, so
these operations carry a third contract: the caller supplies a positive
`tolerance` in output-space units, and the result is certified to deviate
from the true object by at most that much.

For the cubic approximations the certificate is a symmetric Hausdorff
bound: every point of the true object lies within `tolerance` of the
output, and every point of the output lies within `tolerance` of the true
object. The bound is established by subdividing until interval enclosures
prove it, never by sampling, which can only ever disprove it. For
`boundingBox` the certificate is per-side slack: the returned box contains
the object and overhangs the tight box by at most `tolerance` on each
side. Emitted segments start and end exactly on the true object, so
junctions of a continuous input stay closed.

`tolerance` is not a rule 2 band. It has no default and does not scale
with the data: it is the caller's statement of how much geometric
deviation the use can absorb, a fraction of a pixel for SVG output. One
honest limit: refinement depth is capped at 20 levels (up to ~1e6 output
segments per input curve), with 30 more inside the certifier. A
certification that fails below the cap always subdivides further and can
never issue a false certificate, but a candidate still uncertified at the
refinement cap is accepted best-effort, so the guarantee is conditional on
the cap not biting. At any tolerance coarser than the geometry's own
rounding noise the cap is unreachable and the bound is unconditional.

## Working with certificates

The section above says what one certified operation promises. Two
boundaries on that promise matter when certified results feed further
work.

**The certificate is geometric, not parametric.** The symmetric Hausdorff
bound relates point sets: every point of the output lies within
`tolerance` of the true object, and conversely. It says nothing about
parameter alignment: `solve(output, t)` is within `tolerance` of _some_
point of the true object, not of the true object's point at the same
`t`. Set-level questions inherit the bound — the output's bounding box
deviates from the true box by at most `tolerance` per side, a
distance-to-curve query is off by at most `tolerance` — but quantities
read off the parameterization inherit nothing: evaluation at a shared
parameter, tangent direction, curvature, arc length, and dash phase all
sit outside the certificate. Where exact lengths matter, stay with the
exact representations: `Arc.length` is closed form on a circular arc and
an elliptic integral evaluated to about `1e-15` relative error on an
elliptical one, and the images built by `arc`, `sector`, and `ray` are
exact up to IEEE 754 rounding.

**Certificates compose in output space only.** A tolerance is a promise
in the output's own units, and a further nonlinear map re-prices it by
its local stretch. Sending a chart-space result through a polar system
magnifies a chart-space deviation `e` to as much as
`e * max(rho * k, |m|)` on screen, where `rho` is the mapped radius,
`k = 2*pi / period` converts the angular unit, and `m` is the radial
map's slope at that radius: the scale itself on a `Linear` radius, and
unbounded near chart radius `0` on a square-root one. The angular term is the trap: under `Dimension.turns`
(`k = 2*pi`) at a 200px radius, a `0.125` chart-space certificate is
only a ~157px screen bound. Splitting a pixel budget into a chart-space
half and an output-space half is therefore wrong by the full stretch
factor. The rule: keep chart-space construction exact — degree
elevation, the shape constructors, `Arc.toPath` for ellipses, all of
which `image` accepts directly — and spend the one certified
operation as late as possible, in the space whose units the tolerance
names. For screen output that means `image` with a pixel-fraction
tolerance is the last step, never an early one.

## Polar conventions

Two semantic conventions in the coordinates module read like numerical
decisions and are documented here so their rationale has one home.

**Point maps reflect a negative mapped radius; region constructors
reject it.** The polar point map is total: a negative mapped radius
reflects through the center, the standard mathematical convention, and
`toCartesian`, `image`, and `ray` all apply it. `ray` stays exact under
reflection because the radial map is continuous and monotone, so the
image of a radial span along a fixed direction is the set of points
between its mapped endpoints — one straight segment, even when the
mapped radii change sign mid-span. The shape constructors `arc` and `sector`
(and their path-data twins) instead throw on a negative mapped radius:
a reflected arc renders at the antipodal angle, which in layout code is
the signature of a broken radial map, not an intent — the same reasoning
behind canvas `arc()` rejecting negative radii. Callers who want the
reflection behavior for shapes can clamp or split spans at the mapped
zero radius themselves; its chart preimage is `fromCartesian(s, center).y`.

**Curves lap, regions clamp.** Path-valued outputs — `arc`, `image`,
`Arc.toPath` — preserve sweeps past one period, tracing the circle more
than once, because parameterization is part of a curve's identity: laps
carry arc length, dash phase, and `solveByDistance` structure. The
region-valued outputs — `sector`, `sectorPathData` — clamp sweeps to one
full period, because a region covered twice is the same region, and a
lapping boundary actively breaks rendering: under `evenodd` a
double-covered area becomes a hole, and the two-subpath annulus emission
stops working. `arcPathData` also clamps, for a narrower reason: a
retraced lap has no geometric extent that path data can express.

**Radial maps are monotone, and only the logarithm has a domain.** Every
radial dimension maps chart radius to mapped radius by a strictly
monotone function, which is what `ray`'s straight segments, `image`'s
endpoint-mapped radius enclosures, and `fromCartesian`'s inverse rely on.
`Power` uses the signed power `sign(x) * abs(x)^exponent` rather than
rejecting negative input: the point map stays total, the reflection
convention above carries over unchanged, and it is the same choice
d3's power scales make. `Logarithmic` cannot follow suit, because no
monotone extension of `log` reaches `r <= 0` with finite values.
Operations that map a non-positive chart radius through it throw, rather
than return `-Infinity` or `NaN` coordinates that would surface later as
an empty or broken SVG path. `image` certifies a positive lower bound on
each segment's chart radius before it runs, by the same subdivision
enclosures it uses everywhere else, so a path that merely has a loose
control polygon below zero is still accepted.

## What the brands guarantee

Trait brands are claims at working precision, in the backward-error sense:
_the object has the property, or is within rounding distance of one that
does._ `Monotonic` (and `Increasing`/`Decreasing`, per axis or combined)
certifies that the derivative takes no opposite-sign values exceeding
`RELATIVE_TOLERANCE * max|derivative|` on the interval: exactly the
condition under which `solveInverse` is unique to matching precision, the
purpose the brand exists to serve. A brand is not a claim of
exact-arithmetic truth, and cannot be: near the boundary, exact-arithmetic
truth is unknowable from rounded coefficients.

The geometric brands follow the same model. `Convex` on a `Polygon2d` claims
that every corner turn exceeding its rounding band turns the same way, and
that the outline goes around once. `Planar` on a `Polygon3d` claims that
the polygon has area and every vertex lies on its plane within the on-plane
band, and a convex `Polygon3d` carries both brands. `Unit` on a
`Quaternion` claims length `1` within `EPSILON`. Operations that guarantee a property by construction
brand their results without re-checking them: products of unit quaternions,
clipped, split, and inset convex polygons, and convex hulls. Their results land
within rounding distance of the property, which is all a brand promises.

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
of unit feature size living at coordinates ~1e12 gets a band of ~1, the same
order as its features. The band reflects what doubles can store: at that
offset, they cannot hold unit-scale geometry to better than ~1e-4. If you
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

- **ulp**: the gap between two adjacent representable doubles, 2^-52
  (~2.2e-16) relative to the value, so it grows with magnitude.
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
