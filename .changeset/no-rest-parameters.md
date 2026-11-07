---
'curvy': major
---

**No rest parameters.** A public function now takes either fixed arguments or one array. Spreading a long array into a rest parameter throws a `RangeError` at the call site, above roughly a hundred thousand elements depending on the engine, and the library can't catch it there. Every collection now goes through an array, so any length works. This replaces the v2 constructor rule that made `make` the variadic constructor: `make` now takes fixed components only, and `fromArray` takes a collection.

**Removed variadic constructors.** Each had a `fromArray` beside it, which stays:

- `LinearPath2d.make`, `QuadraticPath2d.make`, `CubicPath2d.make`, and `RationalCubicPath2d.make`
- `Piecewise.make`
- `Linear2d.make` and `Cardinal2d.make`. `Cardinal2d.fromArray` takes the options as its second argument.

```ts
// before
CubicPath2d.make(c0, c1)
Cardinal2d.make({ tension: 0.7 }, p0, p1, p2)
// after
CubicPath2d.fromArray([c0, c1])
Cardinal2d.fromArray([p0, p1, p2], { tension: 0.7 })
```

**Array parameters.**

- `Linear2d`, `Basis2d`, and `Cardinal2d` `append` and `prepend` take the new points as an array, in both call shapes.
- `Interval2d.fromVectors` takes an array of points. `Interval2d.fromCorners` still takes two.
- `Characteristic.apply` takes its channels as an array, and still returns one polynomial per channel with the tuple's length.
- `Interval.fromMinMax` takes exactly two endpoints, in either order. The new `Interval.fromValues` takes an array of any length and throws when it is empty.

```ts
// before
Basis2d.append(spline, p4, p5)
Interval.fromMinMax(a, b, c)
// after
Basis2d.append(spline, [p4, p5])
Interval.fromValues([a, b, c])
```

`toPath` on every spline spread its curves into `CubicPath2d.make`, so a spline with enough points threw. It builds an array now.
