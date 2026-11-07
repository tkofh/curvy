# Migrating from curvy 1.x to 2.0

This guide moves code written against curvy 1.0.9 to 2.0. Version 2.0 is a large release. Most import paths change, values are no longer rounded, solvers return a new `Solution` type, and several constructors are renamed. Work through the sections in order: the first lists the changes that slip past the compiler, and the last confirms which 1.x calls need nothing beyond the new import.

Examples call the 2.0 namespaces (`Vector2`, `Interval`, `Solution`) without import lines, except where the import is the point.

## Silent changes

TypeScript accepts the code in this table, and 2.0 runs it without an error but returns a different result:

| 1.0.9 code                                                                                                | What 2.0 does                                                                        | Fix                                                                              |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `Vector2.fromPolar(r, theta)`, `Vector3.fromSpherical(r, theta, phi)`                                     | Reads the radius as an angle and returns a different vector                          | Put the angles first ([Vectors](#vectors))                                       |
| `Cardinal2d.toPath(c)`, `Cardinal2d.toBezier(c)`                                                          | Draws centripetal Catmull-Rom, a different curve through the same points             | Build the spline with `{ alpha: 0 }` ([Cardinal splines](#cardinal-splines))     |
| `t === null` on the result of `LinearPolynomial.solveInverse`, `toInverseSolver`, `root`, or any `domain` | Never holds, because an empty result is `Solution.none`, an object                   | `Solution.isNone(t)` or `Solution.isSome(t)` ([Solver results](#solver-results)) |
| `===` on a computed value, such as `Vector2.magnitude(v) === 1.41421356`                                  | Fails, because 1.x rounded results to 8 decimal places and 2.0 returns exact doubles | `equals` or `coincident` ([Precision](#precision))                               |
| `solveSystem` on a nearly singular `Matrix2x2`, `Matrix3x3`, or `Matrix4x4`                               | Returns very large components where 1.x threw                                        | Test the determinant before solving ([Precision](#precision))                    |

TypeScript rejects the code in this second table at the call site. Untyped JavaScript, or a call through `any`, runs it to a wrong result or fails away from the cause:

| 1.0.9 code                                                            | What 2.0 does                                                                                                       | Fix                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `Cardinal2d.toPath(c, 0.7)`, `Cardinal2d.toBezier(c, 0.7)`            | Ignores the `0.7` and uses the spline's own tension and alpha                                                       | Set the tension on the spline ([Cardinal splines](#cardinal-splines)) |
| `roots[0]`, `roots.map(f)`, `Array.isArray(roots)` on a solver result | `undefined`, a `TypeError`, and `false`                                                                             | The `Solution` accessors ([Solver results](#solver-results))          |
| `monotonicity(...) === 'increasing'`                                  | Never holds, because `monotonicity` returns a number                                                                | `=== Monotonicity.Increasing` ([Monotonicity](#monotonicity))         |
| `import * as Interval from 'curvy/interval'`                          | The import still resolves, but the module now exports a namespace named `Interval`, so `Interval.make` is undefined | `import { Interval } from 'curvy/interval'` ([Imports](#imports))     |

## Imports

In 1.x, each module had its own subpath and you imported it whole, as in `import * as Vector2 from 'curvy/vector2'`. In 2.0, related modules share a subpath, and you import each namespace by name:

| 1.0.9 subpath                                                                                                  | 2.0 import                                                                     |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `curvy/vector2`                                                                                                | `import { Vector2 } from 'curvy/vector'`                                       |
| `curvy/vector3`                                                                                                | `import { Vector3 } from 'curvy/vector'`                                       |
| `curvy/vector4`                                                                                                | `import { Vector4 } from 'curvy/vector'`                                       |
| `curvy/matrix2x2`                                                                                              | `import { Matrix2x2 } from 'curvy/matrix'`                                     |
| `curvy/matrix3x3`                                                                                              | `import { Matrix3x3 } from 'curvy/matrix'`                                     |
| `curvy/matrix4x4`                                                                                              | `import { Matrix4x4 } from 'curvy/matrix'`                                     |
| `curvy/polynomial/linear`                                                                                      | `import { LinearPolynomial } from 'curvy/polynomial'`                          |
| `curvy/polynomial/quadratic`                                                                                   | `import { QuadraticPolynomial } from 'curvy/polynomial'`                       |
| `curvy/polynomial/cubic`                                                                                       | `import { CubicPolynomial } from 'curvy/polynomial'`                           |
| `curvy/curve/linear2d`                                                                                         | `import { LinearCurve2d } from 'curvy/curve'`                                  |
| `curvy/curve/quadratic2d`                                                                                      | `import { QuadraticCurve2d } from 'curvy/curve'`                               |
| `curvy/curve/cubic2d`                                                                                          | `import { CubicCurve2d } from 'curvy/curve'`                                   |
| `curvy/path/linear2d`                                                                                          | `import { LinearPath2d } from 'curvy/path'`                                    |
| `curvy/path/quadratic2d`                                                                                       | `import { QuadraticPath2d } from 'curvy/path'`                                 |
| `curvy/path/cubic2d`                                                                                           | `import { CubicPath2d } from 'curvy/path'`                                     |
| `curvy/splines/bezier2d`                                                                                       | `import { Bezier2d } from 'curvy/splines'`                                     |
| `curvy/splines/hermite2d`                                                                                      | `import { Hermite2d } from 'curvy/splines'`                                    |
| `curvy/splines/cardinal2d`                                                                                     | `import { Cardinal2d } from 'curvy/splines'`                                   |
| `curvy/splines/basis2d`                                                                                        | `import { Basis2d } from 'curvy/splines'`                                      |
| `curvy/interval`                                                                                               | `import { Interval } from 'curvy/interval'`, the same path with a named import |
| `curvy/pipe`                                                                                                   | `import { pipe, dual, Pipeable } from 'curvy/utils'`                           |
| `curvy/utils`: `lerp`, `normalize`, `remap`, `clamp`, `clip`, `minMax`, `mod`, `round`, `roundDown`, `roundUp` | `import { ... } from 'curvy/number'`                                           |
| `curvy/utils`: `invariant`                                                                                     | `import { invariant } from 'curvy/utils'`, unchanged                           |
| `curvy/utils`: `PRECISION`                                                                                     | Removed ([Precision](#precision))                                              |
| `@curvy/svg/path`                                                                                              | Removed ([SVG output](#svg-output))                                            |

- Each imported name is both the namespace and its main type, so `Vector2.make(1, 2)` and `let v: Vector2` both work. The 1.x spelling `Vector2.Vector2` still works.
- Secondary types are reachable only through their namespace: `Matrix2x2.Matrix2x2Coordinate` (likewise for `Matrix3x3` and `Matrix4x4`) and `Interval.ScaleShift`.
- Three new subpaths hold names this guide uses: `curvy/solution` (`Solution`), `curvy/monotonicity` (`Monotonicity`), and `curvy/characteristic` (`Characteristic`). `Solution` and `Characteristic` are namespaces only, so write the type as `Solution.Solution<number>`.
- The other new subpaths (`curvy/piecewise`, `transform`, `coordinates`, `arc`, `polygon`, `quaternion`, `plane`, `polyhedron`, and `camera`) hold new features.
- Import only the subpaths in the package's `exports` map. The file layout under `dist/` changed.

## Renamed and reshaped calls

| 1.0.9                                                                              | 2.0                                                                                                                                                               |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Vector2.unit`, `Vector3.unit`, `Vector4.unit`                                     | `Vector2.one`, `Vector3.one`, `Vector4.one`. `Vector3.unitX`, `unitY`, and `unitZ` keep their names.                                                              |
| `Vector2.fromPolar(r, theta)`                                                      | `Vector2.fromPolar(theta, r)`                                                                                                                                     |
| `Vector3.fromSpherical(r, theta, phi)`                                             | `Vector3.fromSpherical(theta, phi, r)`                                                                                                                            |
| `Matrix3x3.matrix3x3(m00, ..., m22)`                                               | `Matrix3x3.make(m00, ..., m22)`                                                                                                                                   |
| `LinearCurve2d.fromPoints(c0, c1)`                                                 | `LinearCurve2d.fromCoefficients(c0, c1)`. The arguments are coefficient vectors, as in 1.x. `LinearCurve2d.fromEndpoints(p0, p1)` is new and takes the endpoints. |
| `QuadraticCurve2d.fromPoints(c0, c1, c2)`                                          | `QuadraticCurve2d.fromCoefficients(c0, c1, c2)`. `fromBezierPoints(p0, p1, p2)` is new and takes Bézier control points.                                           |
| `CubicCurve2d.fromPoints(c0, c1, c2, c3)`                                          | `CubicCurve2d.fromCoefficients(c0, c1, c2, c3)`. `fromBezierPoints(p0, p1, p2, p3)` is new and takes Bézier control points.                                       |
| `CubicPath2d.fromCurves(c0, c1)`, also on `LinearPath2d` and `QuadraticPath2d`     | `CubicPath2d.fromArray([c0, c1])`                                                                                                                                 |
| `CubicPath2d.fromCurveArray(curves)`, also on `LinearPath2d` and `QuadraticPath2d` | `CubicPath2d.fromArray(curves)`                                                                                                                                   |
| `Interval.fromMinMax(a, b, c)`                                                     | `Interval.fromValues([a, b, c])`. `Interval.fromMinMax` takes exactly two numbers and throws for any other count.                                                 |
| `Bezier2d.appendCurvatureMirrored(p, a, b, p6)`                                    | `Bezier2d.appendCurvatureAligned(p, a, b, p6)`                                                                                                                    |
| `Basis2d.append(s, p4, p5)`, `Basis2d.prepend(s, p0)`                              | `Basis2d.append(s, [p4, p5])`, `Basis2d.prepend(s, [p0])`. Data-last: `Basis2d.append([p4, p5])(s)`.                                                              |
| `Cardinal2d.append(c, p4, p5)`, `Cardinal2d.prepend(c, p0)`                        | `Cardinal2d.append(c, [p4, p5])`, `Cardinal2d.prepend(c, [p0])`                                                                                                   |
| `Cardinal2d.make(p0, p1, p2, p3)`                                                  | `Cardinal2d.fromArray([p0, p1, p2, p3], { alpha: 0 })` ([Cardinal splines](#cardinal-splines))                                                                    |
| `Cardinal2d.toPath(c, tension)`, `Cardinal2d.toBezier(c, tension)`                 | [Cardinal splines](#cardinal-splines)                                                                                                                             |
| `Bezier2d.characteristic` and the other spline matrices                            | [Characteristic matrices](#characteristic-matrices)                                                                                                               |
| Polynomial `roots`, `solveInverse`, `root`, `extrema`, and `domain`                | Return a `Solution` ([Solver results](#solver-results))                                                                                                           |
| Polynomial `monotonicity`                                                          | Returns a number ([Monotonicity](#monotonicity))                                                                                                                  |
| `Path.render(Path.fromBezier2d(b))` from `@curvy/svg`                              | `CubicPath2d.toPathData(Bezier2d.toPath(b))` ([SVG output](#svg-output))                                                                                          |

## Precision

1.x rounded numbers to 8 decimal places. It rounded every component of a vector, matrix, polynomial, or `Interval` when it built the value, and it rounded scalar results such as vector magnitudes and dot products, determinants, polynomial values and roots, lengths, and curvature. It also stored the spline characteristic matrices rounded, with 1/6 as `0.16666667` or `0.16666666`.

2.0 stores and returns exact doubles, so a computed value carries rounding noise in its last bits:

```ts
Vector2.make(0.1 + 0.2, 0).x === 0.3
// 1.0.9: true
// 2.0: false, because the component is 0.30000000000000004

CubicPolynomial.roots(CubicPolynomial.make(-6, 11, -6, 1))
// 1.0.9: [1, 2, 3]
// 2.0: Solution.Three(1.0000000000000002, 2, 3)
```

Compare computed values with a tolerance:

- `equals(a, b)` (data-last `equals(b)(a)`) on `Vector2`, `Vector3`, `Vector4`, `Matrix2x2`, `Matrix3x3`, `Matrix4x4`, `LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial`, and `Interval` compares each component with `coincident`. `Interval.equals` also requires the same endpoint kind.
- `coincident(a, b, absolute?, relative?)` from `curvy/number` holds when `|a - b| <= absolute + relative * max(|a|, |b|)`. The defaults are the exported `EPSILON` (`1e-10`) and `RELATIVE_TOLERANCE` (`1e-12`). A pair with an infinity or `NaN` compares exactly.
- `epsEquals(a, b, eps?)` from `curvy/number` applies the absolute tolerance alone.

`round`, `roundDown`, and `roundUp` moved to `curvy/number` and still default to 8 decimal places. Call them where you want short numbers, such as display text or snapshot tests. `PRECISION` is removed, so pass the decimal places to `round` explicitly when you need a different count.

`solveSystem` on `Matrix2x2`, `Matrix3x3`, and `Matrix4x4` throws only when the determinant is exactly zero. 1.x rounded the entries and the determinant first, so it also threw for nearly singular matrices. 2.0 solves them and returns very large components:

```ts
Matrix2x2.solveSystem(Matrix2x2.make(1, 1, 1, 1 + 1e-10), Vector2.make(0, 1))
// 1.0.9: throws 'cannot solve system when coefficient matrix determinant is zero'
// 2.0: Vector2(-9999999172.59636, 9999999172.59636)
```

To refuse such systems, test `Math.abs(Matrix2x2.determinant(m))` against a threshold that suits your data before you call `solveSystem`.

[PRECISION.md](https://github.com/tkofh/curvy/blob/main/PRECISION.md) is the full numerical contract: what is exact, what takes a tolerance, and which tolerance.

## Solver results

These functions return a `Solution` from `curvy/solution`:

- `roots`, `solveInverse`, and `toInverseSolver` on `QuadraticPolynomial` and `CubicPolynomial`, and `CubicPolynomial.extrema`. They returned readonly arrays in 1.x.
- `root`, `solveInverse`, and `toInverseSolver` on `LinearPolynomial`. They returned `number | null` in 1.x.
- `domain` on all three polynomials. It returned `Interval | null` in 1.x, or `Interval` for `CubicPolynomial`.

`toInverseSolver` returns a function, and that function returns the `Solution`. `QuadraticPolynomial.extreme` still returns `Vector2 | null`.

A `Solution` is a tagged value (`None`, `One`, `Two`, or `Three`) that holds zero to three results. It has `.length` and is iterable, so destructuring (`const [a, b] = roots`), spread, `for..of`, and `Math.min(...roots)` work as they did on the 1.x arrays. It is not an array: index access reads `undefined`, array methods are missing, `Array.isArray` returns `false`, and `JSON.stringify` writes an object. An empty result is `Solution.none`, never `null`.

```ts
// 1.0.9
const t = LinearPolynomial.solveInverse(line, 5)
if (t !== null) use(t)
const first = QuadraticPolynomial.roots(p)[0]

// 2.0
const t = LinearPolynomial.solveInverse(line, 5)
if (Solution.isSome(t)) use(t.value)
const first = Solution.valueOrUndefined(QuadraticPolynomial.roots(p))
```

| 1.0.9                          | 2.0                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `t !== null`                   | `Solution.isSome(t)`, which narrows `t` so that `t.value` is the first result       |
| `t ?? fallback`                | `Solution.valueOrUndefined(t) ?? fallback`                                          |
| `roots[0]`                     | `Solution.valueOrUndefined(roots)`, or `roots.value` after `Solution.isSome(roots)` |
| `roots[roots.length - 1]`      | `Solution.last(roots)`                                                              |
| `roots.length === 0`           | Unchanged, or `Solution.isNone(roots)`                                              |
| `roots.map(f)`                 | `Solution.map(roots, f)`                                                            |
| `roots.filter(f)`              | `Solution.filter(roots, f)`                                                         |
| `Interval.filter(i, roots)`    | `Solution.clip(roots, i)`                                                           |
| `Math.min(...roots)`           | Unchanged, or `Solution.min(roots)`                                                 |
| A result you know is non-empty | `Solution.unsafeValue(roots)`, which throws when it is empty                        |
| Any other array use            | `[...roots]` copies the results into an array                                       |

Annotate results with `Solution.Solution<number>` or the narrower `Solution.AtMostOne<number>`, `Solution.AtMostTwo<number>`, and `Solution.AtMostThree<number>`.

## Monotonicity and intervals

### Monotonicity

`monotonicity` on `LinearPolynomial`, `QuadraticPolynomial`, and `CubicPolynomial` returns a number from the new `curvy/monotonicity` module, where 1.x returned a string:

- `'constant'` becomes `Monotonicity.Constant` (`0`)
- `'increasing'` becomes `Monotonicity.Increasing` (`1`)
- `'decreasing'` becomes `Monotonicity.Decreasing` (`2`)
- `'none'` becomes `Monotonicity.None` (`3`)

```ts
import { Monotonicity } from 'curvy/monotonicity'

// 1.0.9: CubicPolynomial.monotonicity(p, Interval.unit) === 'increasing'
CubicPolynomial.monotonicity(p, Interval.unit) === Monotonicity.Increasing
```

`Monotonicity.isStrict(m)` replaces `m === 'increasing' || m === 'decreasing'`. The `Monotonicity` and `GuaranteedMonotonicity` types are importable from `curvy/monotonicity`, and `LinearPolynomial.monotonicity` returns the second, which excludes `None`.

Two results change:

- The classification reads the derivative's values over the interval, so a derivative that touches zero without changing sign no longer breaks monotonicity. `t^3` on `[-1, 1]` was `'none'` in 1.x and is `Monotonicity.Increasing` in 2.0.
- `QuadraticPolynomial.monotonicity` and `CubicPolynomial.monotonicity` throw on a zero-width interval such as `Interval.make(0.5)`. 1.x returned `'constant'`.

### Intervals

An `Interval` carries its endpoint inclusivity in a `kind` field: `Interval.Closed` `[a, b]`, `Interval.OpenStart` `(a, b]`, `Interval.OpenEnd` `[a, b)`, or `Interval.Open` `(a, b)`. `Interval.contains` and `Interval.filter` read the kind and no longer take the `{ includeStart, includeEnd }` options:

| 1.0.9                                                                 | 2.0                                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Interval.contains(i, x, { includeStart: false })`                    | `Interval.contains(Interval.toStartOpen(i), x)`                                                   |
| `Interval.contains(i, x, { includeEnd: false })`                      | `Interval.contains(Interval.toEndOpen(i), x)`                                                     |
| `Interval.contains(i, x, { includeStart: false, includeEnd: false })` | `Interval.contains(Interval.toOpen(i), x)`                                                        |
| `Interval.contains(x, options)(i)`                                    | `Interval.contains(x)(Interval.toOpen(i))`, or `toStartOpen` or `toEndOpen`                       |
| `Interval.filter(i, values, options)`                                 | `Interval.filter(Interval.toOpen(i), values)`, or `toStartOpen` or `toEndOpen`                    |
| An interval always checked with the same options                      | Build it with that kind: `Interval.makeOpen(a, b)`, `makeOpenStart(a, b)`, or `makeOpenEnd(a, b)` |

Other changes:

- `make`, `fromSize`, `fromMinMax`, and `fromValues` return `Interval.Closed`. `make` still throws when `end < start`.
- `Interval.fromMinMax` takes exactly two numbers and throws for any other count. Pass more to `Interval.fromValues` as an array.
- `Interval.clamp(i, NaN)` returns `NaN`. 1.x returned `i.end`.
- `contains` and `filter` need an interval from a constructor, because they read `kind`. For a plain `{ start, end }` object, `contains` returns `undefined` and `filter` returns `[]`. `size`, `lerp`, `toLerpFn`, `normalize`, `toNormalizeFn`, `remap`, `toRemapFn`, `scaleShift`, and `clamp` read only the endpoints and accept plain objects.
- `start` and `end` hold exact doubles. `Interval.equals(a, b)` compares them with a tolerance and also requires the same kind, and `Interval.aligned(a, b)` compares the endpoints alone.

## Vectors

`Vector2.fromPolar` and `Vector3.fromSpherical` take their angles first. Every argument is a `number`, so TypeScript accepts a 1.x call, which then returns a different vector. Swap the arguments at each call site:

```ts
// 1.0.9: fromPolar(r, theta) and fromSpherical(r, theta, phi)
Vector2.fromPolar(2, Math.PI / 2) // 1.0.9: (0, 2). 2.0: Vector2(-0.6536819222555675, 1.428321058021832)

// 2.0: fromPolar(theta, r) and fromSpherical(theta, phi, r)
Vector2.fromPolar(Math.PI / 2, 2) // Vector2(1.2246467991473532e-16, 2)
Vector3.fromSpherical(Math.PI / 2, 0, 2) // Vector3(2, 0, 1.2246467991473532e-16)
```

The angles keep their 1.x meanings: `theta` is measured from +z, and `phi` is the azimuth in the xy-plane.

- The all-ones constant `unit` is `one` on `Vector2`, `Vector3`, and `Vector4`.
- `Vector3.setTheta` and `Vector3.setPhi` return correct vectors. In 1.x, `setTheta` read `v.y` as the azimuth and so changed `phi` too, and `setPhi` moved the vector off its sphere. Each now changes one angle and keeps the radius and the other angle, so code that called either in 1.x gets different results.
- Vectors are iterable, so `const [x, y] = v`, spread, and `for..of` work.

## Splines

### Characteristic matrices

The characteristic matrices moved from the spline namespaces to `Characteristic` in `curvy/characteristic`:

- `Bezier2d.characteristic` is `Characteristic.cubicBezier`.
- `Hermite2d.characteristic` is `Characteristic.cubicHermite`.
- `Basis2d.characteristic` is `Characteristic.cubicBasisSpline`.
- `Cardinal2d.characteristic(scale)` is `Characteristic.cubicCardinal(tension)`, where `tension` is the same parameter as `scale`.
- `Cardinal2d.catRomCharacteristic` is `Characteristic.cubicCatmullRom`.

The entries are exact. 1.x rounded them to 8 decimal places and stored each 1/6 in the B-spline matrix as `0.16666667` or `0.16666666`.

`Bezier2d.fromSpline(points, matrix, stride)` keeps its 1.x signature and takes these matrices or one of your own.

### Cardinal splines

A `Cardinal2d` stores its `tension` and a new `alpha`, so `toPath` and `toBezier` take only the spline. `tension` is the 1.x `scale` under a new name, with the same meaning and the same default of `0.5`. `alpha` sets how the distance between neighboring control points spaces the curve's parameter. `0` is uniform, the only option in 1.x. `0.5` is centripetal, which avoids the cusps and self-intersections a uniform curve forms around clustered points. `1` is chordal.

The default `alpha` is `0.5`, so the same control points draw a different curve in 2.0. Pass `{ alpha: 0 }` to reproduce the 1.x shape:

```ts
// 1.0.9
const c = Cardinal2d.make(p0, p1, p2, p3, p4)
const path = Cardinal2d.toPath(c, 0.7)

// 2.0, the same curve
const c = Cardinal2d.fromArray([p0, p1, p2, p3, p4], { tension: 0.7, alpha: 0 })
const path = Cardinal2d.toPath(c)
```

| 1.0.9                                                         | 2.0, the same curve                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `Cardinal2d.make(p0, p1, p2, p3)`                             | `Cardinal2d.fromArray([p0, p1, p2, p3], { alpha: 0 })`                          |
| `Cardinal2d.fromArray(points)`                                | `Cardinal2d.fromArray(points, { alpha: 0 })`                                    |
| `Cardinal2d.toPath(c)`                                        | `Cardinal2d.toPath(c)`, with `c` built with `{ alpha: 0 }`                      |
| `Cardinal2d.toPath(c, 0.7)`, `c.pipe(Cardinal2d.toPath(0.7))` | `c.pipe(Cardinal2d.withOptions({ tension: 0.7, alpha: 0 }), Cardinal2d.toPath)` |
| `Cardinal2d.toBezier(c, 0.7)`                                 | `Cardinal2d.toBezier(Cardinal2d.withOptions(c, { tension: 0.7, alpha: 0 }))`    |
| `Cardinal2d.append(c, p4, p5)`                                | `Cardinal2d.append(c, [p4, p5])`                                                |

`withTension` and `withAlpha` set one option, and `withOptions` sets either or both. `append`, `prepend`, `withDuplicatedEndpoints`, and `withReflectedEndpoints` keep the spline's options.

## SVG output

The `@curvy/svg` package is discontinued. It imports 1.x subpaths, so it cannot run against curvy 2.0. Remove the dependency, and serialize a path with `toPathData`:

```ts
// 1.0.9 with @curvy/svg
import * as Path from '@curvy/svg/path'

const d = bezier.pipe(Path.fromBezier2d, Path.render)

// 2.0
import { CubicPath2d } from 'curvy/path'
import { Bezier2d } from 'curvy/splines'

const d = bezier.pipe(Bezier2d.toPath, CubicPath2d.toPathData)
```

- `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` each have `toPathData`, which writes `L`, `Q`, and `C` commands. A gap between adjacent curves starts a new `M`. `RationalCubicPath2d` has no `toPathData`.
- `@curvy/svg` serialized only `Bezier2d`. `Hermite2d`, `Cardinal2d`, and `Basis2d` reach a path through their own `toPath`.
- The command format matches `render`, but the digits can differ. `render` printed the stored control points, which 1.x had rounded. `toPathData` recovers the control points from each curve's polynomial coefficients, so fractional coordinates pick up rounding noise:

```text
1.0.9  M 0.1,0.7 C 1.3,2.9 3.7,2.1 4.3,0.3
2.0    M 0.1,0.7 C 1.3000000000000003,2.8999999999999995 3.7000000000000006,2.1 4.3,0.30000000000000004
```

`toPathData` has no precision option. Round the numbers in the string when you need short output or stable snapshots:

```ts
const short = d.replace(/-?[\d.]+(?:e[-+]?\d+)?/g, (n) => String(Number(Number(n).toFixed(6))))
```

## Everything else

### Values

- Values print as themselves. `String(v)` and template literals give `Vector2(1, 2)`, and Node's `console.log` prints the same text. 1.x gave `[object Vector2(1, 2)]` for vectors and `[object Object]` for polynomials.
- A value's type marker sits on its prototype, so an object spread copy loses it: `Vector2.isVector2({ ...v })` is `false`, where 1.x returned `true`.
- The `is*` guards on curves, paths, `Bezier2d`, `Hermite2d`, and `Basis2d` recognize values created by a second installed copy of curvy, which 1.x did not.
- Polynomial, curve, and path types gain type parameters with defaults, such as `CubicPolynomial<Traits = unknown>`, so 1.x annotations like `CubicPolynomial` and `CubicPath2d` still compile.

### Fixes to 1.x behavior

Code that worked around these 1.x bugs can drop the workaround:

- `solve` on `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` returns the nearer endpoint for a parameter within `EPSILON` (`1e-10`) outside `[0, 1]`, and throws `Error('path parameter must be within [0, 1]')` beyond that. 1.x threw a `TypeError` for any parameter outside `[0, 1]`, `1 + 1e-12` included.
- `LinearPolynomial.range` returns the range of a decreasing polynomial, and so does `QuadraticPolynomial.range` when `c2` is zero. 1.x threw.
- `QuadraticPolynomial.roots` and `solveInverse` with `c2` zero solve the linear equation. 1.x returned `[NaN, -Infinity]`.
- `CubicPolynomial.solveInverse` with `c3` zero solves for the given value. 1.x solved for zero and ignored its argument.
- `toPath` on a very long spline returns a path. 1.x threw a `RangeError`.

### Calls that need only the new import

The 1.x functions in this table keep their call shape. After the import changes in [Imports](#imports), they need nothing else, apart from the exact-double results described in [Precision](#precision).

| Namespace                                        | Unchanged calls                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Vector2`                                        | `isVector2`, `make`, `magnitude`, `normalize`, `dot`, `cross`, `components`, `softmax`, `zero`, `add`, `subtract`, `hadamard`, `scale`, `getX`, `setX`, `getY`, `setY`, `getR`, `setR`, `getTheta`, `setTheta`                                                    |
| `Vector3`                                        | `isVector3`, `make`, `magnitude`, `length`, `normalize`, `dot`, `cross`, `components`, `softmax`, `zero`, `unitX`, `unitY`, `unitZ`, `add`, `subtract`, `hadamard`, `scale`, `getX`, `setX`, `getY`, `setY`, `getZ`, `setZ`, `getR`, `setR`, `getTheta`, `getPhi` |
| `Vector4`                                        | `isVector4`, `make`, `magnitude`, `normalize`, `dot`, `components`, `softmax`, `zero`, `add`, `subtract`, `hadamard`, `scale`                                                                                                                                     |
| `Matrix2x2`                                      | `isMatrix2x2`, `make`, `fromRows`, `fromColumns`, `setRow`, `setColumn`, `determinant`, `vectorProductLeft`, `vectorProductRight`, `toRows`, `toColumns`, `rowVector`, `columnVector`, `transpose`, `reverseRows`, `reverseColumns`                               |
| `Matrix3x3`                                      | `isMatrix3x3`, `fromRows`, `fromColumns`, `setRow`, `setColumn`, `determinant`, `minor`, `vectorProductLeft`, `vectorProductRight`, `toRows`, `toColumns`, `rowVector`, `columnVector`, `transpose`, `reverseRows`, `reverseColumns`                              |
| `Matrix4x4`                                      | `isMatrix4x4`, `make`, `fromRows`, `fromColumns`, `setRow`, `setColumn`, `determinant`, `minor`, `vectorProductLeft`, `vectorProductRight`, `toRows`, `toColumns`, `rowVector`, `columnVector`, `transpose`, `reverseRows`, `reverseColumns`                      |
| `Interval`                                       | `isInterval`, `make`, `fromSize`, `size`, `unit`, `biunit`, `lerp`, `toLerpFn`, `normalize`, `toNormalizeFn`, `remap`, `toRemapFn`, `scaleShift`                                                                                                                  |
| `LinearPolynomial`                               | `isLinearPolynomial`, `make`, `fromVector`, `fromPointSlope`, `fromPoints`, `solve`, `toSolver`, `derivative`, `antiderivative`, `range`, `length`                                                                                                                |
| `QuadraticPolynomial`                            | `isQuadraticPolynomial`, `make`, `fromVector`, `solve`, `toSolver`, `derivative`, `extreme`, `antiderivative`, `range`, `length`, `curvature`                                                                                                                     |
| `CubicPolynomial`                                | `isCubicPolynomial`, `make`, `fromVector`, `solve`, `toSolver`, `derivative`, `range`, `length`, `curvature`                                                                                                                                                      |
| `LinearCurve2d`                                  | `fromPolynomials`, `isLinearCurve2d`, `derivative`, `solve`, `length`                                                                                                                                                                                             |
| `QuadraticCurve2d`                               | `fromPolynomials`, `isQuadraticCurve2d`, `solve`, `length`, `derivative`, `curvature`                                                                                                                                                                             |
| `CubicCurve2d`                                   | `fromPolynomials`, `isCubicCurve2d`, `solve`, `length`, `curvature`                                                                                                                                                                                               |
| `LinearPath2d`, `QuadraticPath2d`, `CubicPath2d` | `isLinearPath2d` (and the quadratic and cubic guards), `append`, `length`, `solve`                                                                                                                                                                                |
| `Bezier2d`                                       | `make`, `fromArray`, `fromSpline`, `isCubicBezier2d`, `append`, `appendTangentAligned`, `appendVelocityAligned`, `appendAccelerationAligned`, `toPath`                                                                                                            |
| `Hermite2d`                                      | `isHermite2d`, `make`, `fromArray`, `append`, `prepend`, `toPath`, `toBezier`                                                                                                                                                                                     |
| `Basis2d`                                        | `isBasis2d`, `make`, `fromArray`, `withTriplicatedEndpoints`, `toPath`, `toBezier`                                                                                                                                                                                |
| `Cardinal2d`                                     | `isCardinal2d`, `withDuplicatedEndpoints`, `withReflectedEndpoints`. The curves they lead to change shape ([Cardinal splines](#cardinal-splines)).                                                                                                                |
| `curvy/number`                                   | `lerp`, `normalize`, `remap`, `clamp`, `clip`, `minMax`, `mod`, `round`, `roundDown`, `roundUp`                                                                                                                                                                   |
| `curvy/utils`                                    | `pipe`, `dual`, `Pipeable`, `invariant`                                                                                                                                                                                                                           |

Every 1.x export missing from this table appears in an earlier section.

For what is new in 2.0, read the 2.0.0 entry in the [CHANGELOG](https://github.com/tkofh/curvy/blob/main/packages/core/CHANGELOG.md).
