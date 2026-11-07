# Change Log

## 2.0.0-alpha.21

### Major Changes

- efdc221: **No rest parameters.** A public function now takes either fixed arguments or one array. Spreading a long array into a rest parameter throws a `RangeError` at the call site, above roughly a hundred thousand elements depending on the engine, and the library can't catch it there. Every collection now goes through an array, so any length works. This replaces the v2 constructor rule that made `make` the variadic constructor: `make` now takes fixed components only, and `fromArray` takes a collection.

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

### Patch Changes

- efdc221: **Faster matrices, arc lengths, easing lookups, and bounding boxes, and a bounded Cardinal cache.**
  - `Matrix3x3` and `Matrix4x4` compute `determinant`, `inverse`, and `inverseUnsafe` from the entries directly instead of building every minor as a matrix. `Matrix3x3.inverse` went from about 1.6 µs to 70 ns and `Matrix4x4.inverse` from 11 µs to 120 ns. Everything built on the 3x3 inverse speeds up with them: `Affine3d.inverse`, `Affine3d.applyNormal`, and `Plane3d.transform` each went from about 1.7 µs to 120–150 ns.
  - `CubicCurve2d.length` and `QuadraticCurve2d.length` sample the derivative's polynomials directly instead of building a vector at each of the 32 quadrature points, so they run about 3 times faster. `CubicPath2d.solveByDistance`, which measures length on every Newton step, runs about 3 times faster with them.
  - `CubicCurve2d.solveAtX` and `solveAtY`, the lookup behind cubic easing, run about 1.5 times faster, from about 185 ns to 125 ns. `CubicPolynomial.solveInverse` no longer collects its roots through a `Set` and two arrays. The quadratic and rational cubic curves' `solveAtX` and `solveAtY` drop the same intermediate closures.
  - `CubicPolynomial.range` and `unitRange` fold the values at the ends and extrema into a min and max directly, so `CubicCurve2d.boundingBox` runs about 1.75 times faster.
  - `Piecewise.solve` finds its piece by binary search instead of scanning from the first piece. On 64 pieces it runs about 3.7 times faster. An easing refit by `Piecewise.fromPath` typically has 8 to 22 pieces. Pieces that overlap within tolerance, which `fromArray` admits, keep the scan.
  - `Characteristic.cubicCardinal` keeps the 16 most recently used tensions instead of every tension it has seen, so a tension that changes on every call no longer grows memory without bound. Tension `0.5` always returns `cubicCatmullRom` itself. Other tensions return the same instance while they stay recent, and an equal new matrix after that.

  No results change: the new code rounds exactly as the old did.

## 2.0.0-alpha.20

### Minor Changes

- 0e1291d: **`Affine2d` constructors take vectors and an optional origin.** `translate` and `scale` accept their per-axis values as one `Vector2` as well as separate numbers. Every constructor with a fixed point takes it as an optional last `origin`, defaulting to `Vector2.zero`. That folds three functions into the ones they specialized:
  - `translate(v)` replaces `translateBy(v)`
  - `scale(sx, sy, origin)` replaces `scaleAround(sx, sy, origin)`
  - `rotate(theta, origin)` replaces `rotateAround(theta, origin)`

  The same rule adds two forms that didn't exist: a uniform scale about a point, `scale(2, center)`, and a shear about a point, `shear(kx, ky, origin)`.

  **`reflectAcrossLine` now takes `(direction, origin?)`, reversing its arguments.** Both are `Vector2`s, so an old `reflectAcrossLine(origin, direction)` call still compiles and silently reflects across a different line. Swap the arguments at each call site, or drop `origin` for a line through the zero vector.

  ```ts
  Affine2d.translate(Vector2.make(10, 0)) // was translateBy(Vector2.make(10, 0))
  Affine2d.rotate(Math.PI / 2, center) // was rotateAround(Math.PI / 2, center)
  Affine2d.scale(Vector2.make(2, 3), center) // was scaleAround(2, 3, center)
  Affine2d.reflectAcrossLine(direction, point) // was reflectAcrossLine(point, direction)
  ```

- 0e1291d: **3D affine transforms.** `curvy/transform` gains `Affine3d`, the 3D counterpart of `Affine2d`: a 4x4 homogeneous matrix whose fourth row is `[0, 0, 0, 1]`, refined by the same `Invertible` brand. It mirrors `Affine2d`'s surface with `identity`, `fromMatrix`, `translate`, `scale`, `rotate`, `shear`, `andThen`, `inverse`, `inverseUnsafe`, `isInvertible`, `asInvertible`, `apply`, `applyTo`, `linear`, `translation`, `linearPart`, and `equals`. `translate` and `scale` take their per-axis values either as separate numbers or as one `Vector3`. `scale`, `rotate`, and `shear` take an optional last `origin`, the point that stays fixed, which defaults to the zero vector. `rotate(r, origin?)` takes a `Rotation3d` or a `Quaternion<Unit>`.

  `compose` and `decompose` move between a transform and its parts. `compose({ translation?, rotation?, scale?, shear? })` applies scale, then shear, then rotation, then translation. `decompose` splits any invertible transform back into those parts, so the two round-trip. Shear is part of the split because a child rotated inside a non-uniformly scaled parent carries shear that no rotation-and-scale pair can express. A transform that mirrors space gets a negative `x` scale. A singular transform returns `none`, and an `Invertible`-branded one returns `Solution.One`.

  Both affine types now map directions and normals as well as points. `applyDirection` ignores translation, for tangents and edge vectors. `applyNormal` maps by the inverse transpose of the linear part and normalizes. Under a non-uniform scale or a shear that is the only map that keeps a normal perpendicular to its surface, and it keeps an outward normal outward under a reflection.

  Both also gain `isMirror(a)`, which is `true` when the transform is invertible and reverses handedness (a negative determinant in its linear part). That is the case where a polygon's winding flips, so it tells you when to `reverse` faces after transforming them.

  ```ts
  import { Affine3d, Rotation3d } from 'curvy/transform'
  import { Vector3 } from 'curvy/vector'

  const joint = Affine3d.compose({
    translation: Vector3.make(0, 2, 0),
    rotation: Rotation3d.aboutX(0.3),
    scale: Vector3.make(1, 0.5, 1),
  })

  Affine3d.applyNormal(joint, Vector3.unitY) // stays perpendicular to the squashed surface
  Affine3d.decompose(joint) // Solution.one({ translation, rotation, scale, shear })
  ```

- 4a693e3: **Ellipses from conjugate semi-diameters.** `Arc.fromConjugateDiameters(center, a, b)` builds the full ellipse traced by `center + a * cos(t) + b * sin(t)`, which is how a circle comes out of any linear map, such as a parallel projection. The arc starts at `center + a`, runs toward `center + b`, and keeps that parametrization, so a point at parametric extent `t` from the start is `center + a * cos(t) + b * sin(t)`. It finds `radiusX`, `radiusY`, and `rotation` for you.

  ```ts
  import { Arc } from 'curvy/arc'
  import { Vector2 } from 'curvy/vector'

  const e = Arc.fromConjugateDiameters(Vector2.zero, Vector2.make(2, 0), Vector2.make(1, 1))

  Arc.solve(e, 0.25) // Vector2(1, 1), up to rounding
  ```

- f8a2c57: **Cameras.** A new `curvy/camera` module adds `Camera`, which projects 3D points onto a 2D viewport in SVG coordinates. Like `Arc`, it is a union with two kinds. `Camera.perspective({ eye, target, up?, fovY, near, far?, viewport })` builds one where distant things look smaller. `Camera.orthographic({ eye, target, up?, height, far?, viewport })` builds one where size doesn't change with distance. The viewport is any `Bounds2d`, so an `Interval2d` works, and the view's up lands toward the top of it even though SVG's y axis points down.

  `project(camera, point)` returns the viewport position and a `depth`, the point's distance in front of the eye in world units. Depth is linear, so sorting faces by it paints back to front. A perspective camera returns `none` for points closer than its near plane, and either kind returns `none` for points beyond its far plane, which defaults to infinity. A point on either plane to within rounding still projects, so geometry clipped against the planes projects whole. `projectTo(camera)` is the curried form for mapping arrays of points, and it computes the screen mapping once.

  Each camera exposes its `eye` and its directions as a `Frame3d`, and `Camera.view` gives the rigid `Affine3d` from world coordinates to OpenGL-style eye space. Projected faces combine with `Polygon2d.winding` for back-face culling: a face whose normal points toward the camera projects `'counterclockwise'`, and one that turns away flips.

  `Camera.clippingPlanes` returns the near and far planes as `Plane3d` values facing into the view, and `Camera.clip(camera, face)` cuts a convex `Polygon3d` against them. Every vertex of the result projects, so a face that crosses the near plane draws correctly instead of losing the vertices behind the eye.

  `Camera.projectCircle(camera, center, normal, radius)` and `Camera.projectSphere(camera, center, radius)` return the outline of a 3D circle or a sphere as an `Arc.Elliptical` in the viewport, ready for `Arc.toPathData` or an SVG `<ellipse>`. Both are exact under either kind of camera, including the off-center ellipse a perspective camera makes of a circle and the stretched outline it gives a sphere off to the side. A circle facing the camera comes back with a negative `sweep`, matching the face rule. Each returns `none` unless the whole shape lies between the near and far planes.

  ```ts
  import { Camera } from 'curvy/camera'
  import { Interval2d } from 'curvy/interval'
  import { Vector2, Vector3 } from 'curvy/vector'

  const camera = Camera.perspective({
    eye: Vector3.make(0, 0, 10),
    target: Vector3.zero,
    fovY: Math.PI / 4,
    near: 0.1,
    viewport: Interval2d.fromCorners(Vector2.zero, Vector2.make(800, 600)),
  })

  Camera.project(camera, Vector3.zero) // Solution.one({ point: Vector2(400, 300), depth: 10 })
  ```

- 0e1291d: **Frames for yaw, pitch, and roll.** `curvy/transform` gains `Frame3d`, which names the directions an object or a space calls up, forward, and right. `Frame3d.make({ up, forward })` takes the first two and derives `right` as `cross(forward, up)`, the right-hand side of someone standing along `up` and facing `forward`.

  Each angle turns one frame direction toward another, the aircraft conventions:
  - a positive yaw turns `forward` toward `right`, about `up`
  - a positive pitch turns `forward` toward `up`, about the yawed `right`
  - a positive roll turns `up` toward `right`, about the final `forward`

  `fromYawPitchRoll(frame, { yaw?, pitch?, roll? })` builds the `Rotation3d`, and `toYawPitchRoll(frame, r)` reads the angles back, putting the whole turn in the yaw at gimbal lock. `lookRotation(frame, direction, up?)` turns `forward` onto a direction and keeps `up` as close to a hint as it can, so looking around never rolls.

  ```ts
  import { Frame3d, Rotation3d } from 'curvy/transform'
  import { Vector3 } from 'curvy/vector'

  const body = Frame3d.make({ up: Vector3.unitY, forward: Vector3.unitZ })
  body.right // Vector3(-1, 0, 0): its own right, as it faces the viewer

  const turned = Frame3d.fromYawPitchRoll(body, { yaw: Math.PI / 2 })
  Rotation3d.apply(turned, body.forward) // Vector3(-1, 0, 0), up to rounding
  ```

- 4bbe4ca: **Planes.** A new `curvy/plane` module adds `Plane3d`, the points `p` with `dot(normal, p) = offset`. The normal is stored as a unit vector, and it picks a front side: `signedDistance` is positive there, and clipping keeps it.
  - Build one with `make(normal, offset)`, which normalizes the normal and scales the offset with it, `fromPointNormal(point, normal)`, or `through(a, b, c)`. `through` returns `none` for collinear points, and its normal is `cross(b - a, c - a)`.
  - `signedDistance`, `closestPoint`, `flip`, and `shift` (move along the normal) cover the everyday questions.
  - `transform(plane, affine)` maps a plane through an `Affine3d`. The front side stays the front, under a mirror too, so a solid's outward face planes stay outward.
  - `intersection(a, b, c)` finds the point where three planes meet, which is how a solid's corners follow from its face planes. It returns `none` when the planes don't meet in a single point.
  - `intersectRay(plane, origin, direction)` finds where a ray meets the plane, or `none` when it points away or runs parallel.

  ```ts
  import { Plane3d } from 'curvy/plane'
  import { Vector3 } from 'curvy/vector'

  Plane3d.intersection(
    Plane3d.make(Vector3.unitX, 1),
    Plane3d.make(Vector3.unitY, 2),
    Plane3d.make(Vector3.unitZ, 3),
  ) // Solution.one(Vector3(1, 2, 3))
  ```

- ce84b2a: **Polygons.** A new `curvy/polygon` module adds `Polygon2d`, a closed cycle of three or more vertices with an implicit closing edge. Build one with `make`, `fromArray`, or `fromTuples`. It iterates over its vertices, and `transform` applies an `Affine2d` to every vertex.

  Measures read the polygon as a region:
  - `signedArea` follows the shoelace formula. It is positive when the vertices rotate `+x` toward `+y`, which is `'clockwise'` on screen in the coordinates module's `Winding` convention.
  - `winding` returns a `Winding`, or `none` for a polygon with no area at working precision. Back-face culling reads it off a projected face.
  - `centroid` gives the area centroid, or `none` for a degenerate polygon. `area`, `perimeter`, and `boundingBox` round out the measures.

  A `Convex` brand, set by `isConvex` and `asConvex`, gates the operations that need convexity. Convex means positive area, every corner turning the same way, and an outline that goes around once. Collinear and repeated vertices pass, and a pentagram fails. `convexHull` builds a branded hull from any point set by Andrew's monotone chain. It returns `none` when the points are collinear.

  The branded operations each return results that stay convex:
  - `clip(polygon, origin, normal)` keeps the side of a line the normal points toward, by the Sutherland–Hodgman step. Vertices on the line stay exact, and a polygon the line misses comes back as the same instance.
  - `split` returns `{ front, back }`, each a `Solution.AtMostOne`. The two pieces share their crossing vertices.
  - `inset(polygon, distance)` moves every edge inward. An edge that shrinks to nothing drops out, and an inset past the inradius returns `none`.

  Rounded corners follow the arc module's pair of outputs. `rounded` builds a `RationalCubicPath2d` with exact circular fillets, and `roundedPathData` emits SVG `A` commands. Each takes one radius or one per vertex. A radius too large for its corner shrinks so that neighboring fillets meet at the edge midpoints. `toPathData` emits the plain outline, closed with `Z`, and `toPath` gives it as a `LinearPath2d`.

  ```ts
  import { Polygon2d } from 'curvy/polygon'

  const face = Polygon2d.asConvex(
    Polygon2d.fromTuples([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ]),
  )

  Polygon2d.winding(face) // Solution.one('clockwise')
  Polygon2d.inset(face, 1) // Solution.one(Polygon2d((1, 1), (9, 1), (9, 9), (1, 9)))
  Polygon2d.roundedPathData(face, 2)
  // 'M 0,2 A 2 2 0 0 1 2,0 L 8,0 A 2 2 0 0 1 10,2 L 10,8 A 2 2 0 0 1 8,10 L 2,10 A 2 2 0 0 1 0,8 Z'
  ```

- 4bbe4ca: **3D polygons.** `curvy/polygon` adds `Polygon3d`, a closed cycle of 3D vertices such as a face of a solid. It has the same constructors as `Polygon2d` (`make`, `fromArray`, `fromTuples`), and `transform` applies an `Affine3d`.
  - `normal` gives the unit normal by Newell's method, which follows the right-hand rule and averages out small departures from a plane. `area`, `perimeter`, and `centroid` (the area centroid) round out the measures. `normal` and `centroid` return `none` for a polygon with no area.
  - `isPlanar` and `asPlanar` establish the `Planar` brand: the polygon has area and every vertex lies on one plane. `plane` takes a `Polygon3d<Planar>` and returns its `Plane3d`.
  - `isConvex` and `asConvex` establish the `Convex` brand. A convex 3D polygon is also planar, so they grant `Planar` too, as do `clip` and `split` on their results.
  - `clip(face, plane)` keeps the part on the plane's front side, by Sutherland–Hodgman, and `split(face, plane)` returns both pieces. A face lying in the plane counts as on both sides.
  - `inset(face, distance)` shrinks a convex face within its plane by moving every edge inward, like `Polygon2d.inset`.

  ```ts
  import { Plane3d } from 'curvy/plane'
  import { Polygon3d } from 'curvy/polygon'
  import { Vector3 } from 'curvy/vector'

  const face = Polygon3d.asConvex(
    Polygon3d.fromTuples([
      [0, 0, 0],
      [4, 0, 0],
      [4, 4, 0],
      [0, 4, 0],
    ]),
  )

  Polygon3d.normal(face) // Solution.one(Vector3(0, 0, 1))
  Polygon3d.clip(face, Plane3d.make(Vector3.make(-1, 0, 0), -1))
  // Solution.one(Polygon3d((0, 0, 0), (1, 0, 0), (1, 4, 0), (0, 4, 0)))
  ```

- 16d3bdb: **Convex solids from planes.** A new `curvy/polyhedron` module adds `ConvexPolyhedron`, a bounded convex solid stored as indexed geometry: shared `vertices`, and `faces` that index into them. Each face also keeps the `Plane3d` it lies in and a label.
  - `fromHalfSpaces(planes)` builds the solid inside every half-space, each given as a plane facing out of the solid. Pass `{ plane, label }` objects to label the faces, or bare planes to label each face with its plane's index. Faces run counterclockwise seen from outside. A plane that only touches the solid, misses it, or repeats an earlier face makes no face. The result is `none` when the half-spaces enclose no bounded solid with volume.
  - Every corner is the meeting point of three input planes, solved directly rather than built up by repeated clipping.
  - `contains(solid, point)` tests a point, boundary included. `polygons(solid)` returns the faces as `Polygon3d<Convex & Planar>`, ready for `Camera.clip`.
  - `transform(solid, affine)` moves vertices and planes together. Under a mirror it reverses each face so faces stay wound outward.

  ```ts
  import { Plane3d } from 'curvy/plane'
  import { ConvexPolyhedron } from 'curvy/polyhedron'
  import { Vector3 } from 'curvy/vector'

  const wedge = ConvexPolyhedron.fromHalfSpaces([
    { plane: Plane3d.make(Vector3.make(0, 0, -1), 0), label: 'floor' },
    { plane: Plane3d.make(Vector3.make(-1, 0, 0), 0), label: 'back' },
    { plane: Plane3d.make(Vector3.make(0, -1, 0), 0), label: 'left' },
    { plane: Plane3d.make(Vector3.make(0, 1, 0), 1), label: 'right' },
    { plane: Plane3d.make(Vector3.make(1, 0, 1), 1), label: 'roof' },
  ])
  // Solution.one(ConvexPolyhedron(6 vertices, 5 faces)), faces labeled
  // 'floor', 'back', 'left', 'right', 'roof'
  ```

- 9e0a4bd: **3D rotations.** `curvy/transform` gains `Rotation3d`, a rotation about an axis through the origin, stored as a unit quaternion. A new `curvy/quaternion` module holds the quaternion algebra underneath it, with a `Unit` brand for the quaternions that represent rotations. Every `Rotation3d` operation that reads a rotation also accepts a `Quaternion<Unit>`, so code that already holds quaternions never has to wrap them.

  `Rotation3d` builds rotations several ways:
  - `fromAxisAngle`, plus `aboutX`, `aboutY`, and `aboutZ` for the coordinate axes
  - `between(from, to)`, the shortest rotation turning one direction into another, with a deterministic half turn for opposite directions
  - `fromEuler(angles, order?)`, where each component of `angles` is the angle about its own axis and the `EulerOrder` string names the matrix product left to right, as three.js does (`'YXZ'` is `Ry * Rx * Rz`)
  - `fromMatrix3x3`, which returns `none` for a matrix that scales, shears, or reflects
  - `fromQuaternion`, which wraps a unit quaternion

  The operations cover use and conversion. `apply` rotates a vector, and `applyTo` is its curried form for `Array.prototype.map`. `andThen(a, b)` applies `a`, then `b`, matching `Affine2d.andThen`. `inverse` undoes a rotation. `toMatrix3x3`, `toAxisAngle`, and `toEuler` convert out, and `toEuler` reports gimbal lock by putting the whole turn in the first angle. `slerp` and `nlerp` interpolate along the shorter path. `angleBetween` measures the angle between two rotations, and `equals` compares as rotations, so `q` and `-q` are equal. `swingTwist(r, axis)` splits a rotation into a twist about an axis followed by a swing that moves the axis, which separates an eye spinning about its view direction from the eye turning to look somewhere else.

  `Quaternion` provides `make`, `identity`, `multiply` (Hamilton's convention, keeping `Unit` when both factors have it), `conjugate`, `inverse`, `dot`, `magnitude`, `equals`, `normalize` (`none` for zero), and the `isUnit`/`asUnit` refiners. A quaternion is unit when its squared length is within `EPSILON` of `1`.

  The conventions behind all of this, from composition order to the right-hand rule to Euler orders, are written down in a new `CONVENTIONS.md` at the repo root.

  ```ts
  import { Rotation3d } from 'curvy/transform'
  import { Vector3 } from 'curvy/vector'

  const r = Rotation3d.andThen(Rotation3d.aboutZ(Math.PI / 2), Rotation3d.aboutX(Math.PI / 2))
  Rotation3d.apply(r, Vector3.unitX) // Vector3(0, 0, 1), up to rounding

  const { swing, twist } = Rotation3d.swingTwist(r, Vector3.unitZ)
  Rotation3d.equals(twist, Rotation3d.aboutZ(Math.PI / 2)) // true
  ```

- d6233a5: **Linear interpolation for vectors.** `Vector2.lerp(a, b, t)` and `Vector3.lerp(a, b, t)` return `(1 - t) * a + t * b`, landing exactly on `a` at `t = 0` and on `b` at `t = 1`. `t` isn't clamped, so values outside `[0, 1]` extrapolate. The data-last form `lerp(b, t)` takes the start piped in.

### Patch Changes

- 0e1291d: **`Affine2d` invertibility ignores translation.** `isInvertible`, `asInvertible`, `inverse`, and `inverseUnsafe` judged singularity on the whole 3x3 homogeneous matrix, so a translation counted toward the scale of the test and a well-conditioned transform far from the origin read as singular: a `1e-3` scale translated by `1000` had no inverse. The test now runs on the 2x2 linear part alone, and the inverse is built as `[L^-1 | -L^-1 * t]`.
- d6233a5: **Faster matrix-vector products.** `vectorProductLeft` and `vectorProductRight` on `Matrix2x2`, `Matrix3x3`, and `Matrix4x4` read the matrix entries directly instead of building row or column vectors first, so each call allocates only its result. They run 3.5 to 6 times faster: `Matrix3x3.vectorProductLeft` went from about 62 ns to 14 ns per call, and moving 184 vertices with `Vector3.add(Matrix3x3.vectorProductLeft(m, v), t)` from 13.8 µs to 6.0 µs. `Affine3d.apply` does the same job in 3.8 µs. No results change.

## 2.0.0-alpha.19

### Minor Changes

- 9d5afca: **Elliptical arcs.** `curvy/arc` gains `Arc.Elliptical` alongside `Arc.Circular`, and a new `Arc` union type covers both. `Arc.elliptical({ center?, radiusX, radiusY, rotation?, startAngle?, sweep? })` describes a piece of a possibly rotated ellipse in SVG's own parametrization: the point at angle `a` is `center + R(rotation) * (radiusX * cos(a), radiusY * sin(a))`. Only the radii are required. The defaults give a full, unrotated ellipse around the origin.

  Every arc operation now accepts either kind:
  - `solve`, `startPoint`, and `endPoint` evaluate at the parametric angle. That angle is not the direction from the center, and unlike a circle's it is not an arc-length parameter.
  - `length` evaluates the incomplete elliptic integral through Carlson's symmetric forms. It runs in a fixed number of steps with relative error near `1e-15`.
  - `boundingBox` stays exact in closed form, rotation included.
  - `toPath` lowers exactly to rational cubics by carrying the circular construction through the ellipse's stretch and rotation.
  - `toPathData` emits native `A rx ry rotation` commands. A flat ellipse (one radius `0`) emits `L` commands through its turning points, since SVG would draw a zero-radius `A` as a single straight line.
  - `reverse` keeps the kind, and `equals` compares across the union, so arcs of different kinds are never equal.

  ```ts
  import { Arc } from 'curvy/arc'

  const oval = Arc.elliptical({
    center: Vector2.make(100, 50),
    radiusX: 100,
    radiusY: 50,
  })
  Arc.toPathData(oval) // 'M 200,50 A 100 50 0 0 1 0,50.00000000000001 A 100 50 0 0 1 200,50'
  Arc.length(Arc.elliptical({ radiusX: 2, radiusY: 1 })) // 9.688448220547677
  ```

  **`CoordinateSystem.image` accepts rational paths.** The certified polar image now takes a `RationalCubicPath2d` as well as a `CubicPath2d`, so a chart-space ellipse can be drawn in a polar system without an intermediate approximation spending part of the tolerance budget:

  ```ts
  const system = CoordinateSystem.polar({ theta: Dimension.turns })
  const node = Arc.elliptical({
    center: Vector2.make(0.125, 100),
    radiusX: 0.125,
    radiusY: 20,
  })
  CubicPath2d.toPathData(CoordinateSystem.image(system, Arc.toPath(node), 0.25))
  ```

  A rational path's Bernstein weights must be positive, which every lowered arc satisfies, and `image` throws otherwise. On a cartesian system a rational path is approximated with `RationalCubicPath2d.approximateAsCubicPath`, while a polynomial path still comes back unchanged.

- 9d5afca: **Square-root, power, and logarithmic radii.** `curvy/coordinates` gains two number-line `Dimension` kinds alongside `Linear`, and polar systems accept either as their radial axis:
  - `Dimension.power(exponent, scale?, offset?)` maps `x` to `scale * sign(x) * abs(x)^exponent + offset`. `Dimension.sqrt(scale?, offset?)` is the exponent-`0.5` shorthand. With offset `0`, a square-root radius makes every sector's on-screen area proportional to its chart-space area, so outer rings stop looking bigger than their data.
  - `Dimension.logarithmic(scale?, offset?, base?)` maps `x` to `scale * log(x) + offset`, base `10` by default, for data spanning orders of magnitude. Bases `10`, `2`, and `Math.E` use the dedicated `Math` functions, so exact powers of the base map to exact integers.

  ```ts
  import { CoordinateSystem, Dimension } from 'curvy/coordinates'

  const areaTrue = CoordinateSystem.polar({
    theta: Dimension.degrees,
    radius: Dimension.sqrt(10),
  })
  CoordinateSystem.mapRadius(areaTrue, 100) // 100

  // Decades 40px apart, with chart value 1 at radius 20:
  const decades = CoordinateSystem.polar({
    radius: Dimension.logarithmic(40, 20),
  })
  CoordinateSystem.mapRadius(decades, 1000) // 140
  ```

  Every coordinate-system operation supports the new radii. `arc`, `sector`, and `ray` stay exact, since a fixed chart radius still maps to one circle and a fixed angle to one straight line. `fromCartesian` inverts the map, and `image` certifies its usual Hausdorff bound through the non-linear map. The power map is signed, so it is total and keeps the existing reflection convention for negative mapped radii. A logarithmic radius has no image at or below zero, so operations that map such a chart radius throw, and `image` throws when a path reaches one. `PRECISION.md`'s "Polar conventions" section records the reasoning.

  `polar` now rejects only a `Cyclical` radius. The `Dimension` operations (`delta`, `lerp`, `contains`, and the rest) treat both new kinds like `Linear`, reading chart values directly. Code that switches exhaustively on `Dimension['kind']` needs cases for `'power'` and `'logarithmic'`.

- 155d9b1: **Every curvy value now prints as itself.** `console.log` in Node, Bun, and Deno shows `Vector2(3, 4)` or `Bezier2d(Vector2(0, 0), Vector2(1, 2), ...)` instead of a field dump. Template literals and `String(value)` give the same text, and `Object.prototype.toString` gives the type name (`[object Bezier2d]`). Before, only some types had a rendering, and Node never used it: the inspect hook was a string where Node expects a function.

  ```ts
  const p = Vector2.make(3, 4)

  console.log(p) // Vector2(3, 4)
  String(p) // 'Vector2(3, 4)'
  ```

  Type ids are now `~curvy/<Name>` strings on each type's prototype, instead of symbols set on every instance. Instances hold only their own fields, so object spread and `Object.getOwnPropertySymbols` no longer surface an id, and each value is one field smaller. The `is*` guards also match across two installed copies of curvy, which several types previously failed because their ids were unregistered symbols. `Interval` and `Solution` values carry an id for the first time, so a plain object no longer type-checks as one.

  **`Value` is new in `curvy/utils`**, so a library built on curvy can define value types that behave the same way. `class Point extends Value('~geometry/Point')` gets `pipe`, the type id on its prototype, `[object Point]` from `Object.prototype.toString`, and console printing through its `toString`. Leaving `toString` out is a compile error. The id must name its package (`~<package>/<Name>`), which keeps two libraries' same-named types apart. The `Value.Instance` type accepts any value built this way, curvy's included. Every curvy value type is now a `Value.Instance` rather than a bare `Pipeable`, so its public type includes `toString`.

- c97b21c: **Vectors are iterable.** `Vector2`, `Vector3`, and `Vector4` yield their components in order, so they destructure like tuples, spread, and work with `for..of` and `Array.from`.

  ```ts
  const [x, y] = Vector2.make(3, 4)
  const [r, g, b, a] = Vector4.make(1, 0.5, 0, 1)
  ```

  Spreading gives a `number[]`. `components` still returns the typed tuple (`[number, number]` for `Vector2`).

### Patch Changes

- 155d9b1: Fix the published declarations for `curvy/curve` under `skipLibCheck: false`. `RationalCubicCurve2d`'s trait key was stripped from the declaration build while the public module still re-exported it, so type-checking `rationalCubic2d.d.ts` failed.

## 2.0.0-alpha.18

### Major Changes

- d2e4835: The polar and spherical vector constructors now take their angles first: `Vector2.fromPolar(theta, r)` instead of `fromPolar(r, theta)`, and `Vector3.fromSpherical(theta, phi, r)` instead of `fromSpherical(r, theta, phi)`. The new `curvy/coordinates` module reads chart points as `(theta, r)` and takes angular spans before radial ones everywhere, so the vector constructors follow the same angular-first rule rather than being the lone exceptions.

  ```ts
  // before
  Vector2.fromPolar(2, Math.PI / 2)
  Vector3.fromSpherical(2, Math.PI / 2, 0)
  // after
  Vector2.fromPolar(Math.PI / 2, 2)
  Vector3.fromSpherical(Math.PI / 2, 0, 2)
  ```

### Minor Changes

- d436420: **First-class circular arcs.** A new `curvy/arc` module makes arcs values rather than constructions: `Arc.circular({ center?, radius, startAngle?, sweep? })` describes a circular arc directly — no coordinate system required — and everything downstream reads from that description. Angles are radians from `+x`, positive rotating `+x` toward `+y`; direction and multiplicity live in the sweep's sign and magnitude, so a negative sweep runs the other way and a sweep past `2 * pi` keeps orbiting. Only `radius` is required — the defaults give a full circle around the origin.

  The description keeps the closed-form answers that lowering destroys. `length` is `radius * abs(sweep)`, exact. `solve(arc, t)` is one `cos`/`sin` — and because a circle is traced at constant speed, the uniform parameter is also the arc-length parameter, a property no polynomial path has. `boundingBox` is exact with no tolerance parameter, since extremes only occur at endpoints or crossed axis directions. `startPoint`, `endPoint`, `reverse`, and a tolerance-aware `equals` round out the queries.

  ```ts
  import { Arc } from 'curvy/arc'

  const tick = Arc.circular({
    center: Vector2.make(200, 200),
    radius: 120,
    startAngle: -Math.PI / 2,
    sweep: Math.PI / 6,
  })

  Arc.length(tick) // 20 * pi, in closed form
  Arc.toPathData(tick) // 'M 200,80 A 120 120 0 0 1 ...'
  ```

  Lowering is exact and shared with the coordinates module — `CoordinateSystem.arc` and `Arc.toPath` now run the same machinery. `Arc.toPath` builds a `RationalCubicPath2d` of at-most-quarter-turn rational segments, exact up to IEEE 754 rounding, with multi-turn sweeps tracing the circle more than once; transform the lowered path with `RationalCubicPath2d.transform`, since circles are not closed under affine maps but rational cubics are. `Arc.toPathData` emits SVG `A` commands computed from the description, with the same degenerate contracts as `CoordinateSystem.arcPathData`: zero sweep or zero radius emit a bare `M`, full turns close on the exact starting coordinates, and sweeps past one turn clamp to a single circle, which is all path data can express.

  `Arc.Circular` is the module's only member today. The kind-named type leaves room for an elliptical sibling and an `Arc` union later without renames, mirroring how `CoordinateSystem` holds `Cartesian` and `Polar`.

- d2e4835: **Coordinate systems and axis dimensions.** A new `curvy/coordinates` module maps chart-space geometry onto the cartesian plane, built for layout engines that position rectangles in polar coordinates and render them as SVG.

  **`Dimension`** describes the structure of a single chart axis: `linear(scale?, offset?)` for ordinary number lines and unit conversions, `cyclical(period)` for axes that wrap — angles, hue. The unit constants `radians`, `degrees`, and `turns` are just periods. Cyclical axes get the operations that make splining through angles work:

  ```ts
  import { Dimension } from 'curvy/coordinates'

  Dimension.delta(Dimension.degrees, 350, 10) // 20 — the short way across the seam
  Dimension.unwrap(Dimension.degrees, [350, 5, 20]) // [350, 365, 380] — lift, spline, then wrap samples
  Dimension.lerp(Dimension.degrees, 350, 10, 0.5) // 0
  Dimension.congruent(Dimension.radians, 2 * Math.PI - 1e-16, 0) // true
  ```

  `congruent` judges the shortest wrapped difference against a band of `EPSILON * period` — the normalized-domain regime generalized to a domain of size `period` (see `PRECISION.md`).

  **`CoordinateSystem`** is a kind-discriminated union of `cartesian` (the identity) and `polar(config?)` — center, angular axis, winding, radial map, and a `thetaOrigin` that anchors chart zero on screen independent of winding (`thetaOrigin: -90` on a degrees axis starts a gauge at 12 o'clock either way it sweeps). Chart points pack as `(theta, r)` into `Vector2` `x`/`y`, angular-first like the rest of the surface. `toCartesian` / `fromCartesian` convert points exactly.

  Because the polar map is nonlinear, it does not commute with control-point mapping — converting a curve's control points pointwise produces the wrong curve. Shapes therefore have their own constructors, and they are exact: `arc(s, theta, r)` builds a circular arc as quarter-turn rational cubic segments (the rational-quadratic circle representation, degree-elevated in homogeneous space), and `sector(s, theta, r)` builds the image of an axis-aligned chart rect — an annular sector — as one closed `RationalCubicPath2d`.

  ```ts
  import { CoordinateSystem, Dimension } from 'curvy/coordinates'

  const system = CoordinateSystem.polar({ theta: Dimension.degrees })

  // Exact geometry for hit-testing and bounds:
  const ring = CoordinateSystem.sector(system, { start: 30, end: 90 }, { start: 80, end: 120 })

  // Exact SVG, straight into <path d={...}>:
  CoordinateSystem.sectorPathData(system, { start: 30, end: 90 }, { start: 80, end: 120 })
  ```

  `arcPathData` / `sectorPathData` emit SVG `A` commands computed from the chart description rather than recovered from curve coefficients, so circles stay circles all the way into the DOM. Degenerate inputs stay constructible (zero sweep, zero radial width, pie slices at inner radius 0), full-turn sectors emit a two-subpath annulus that fills correctly under both `nonzero` and `evenodd`, and sweeps past one period clamp.

  **Approximate images of arbitrary chart paths.** The exact constructors cover axis-aligned chart shapes; everything else — a rounded rect in chart space, a diagonal line — has a transcendental polar image (Archimedean spirals) that no cubic can represent exactly. `CoordinateSystem.image(s, path, tolerance)` maps any chart-space `CubicPath2d` through the system and returns a `CubicPath2d` certified to a symmetric Hausdorff bound: every point of the true image lies within `tolerance` of the output and every point of the output within `tolerance` of the true image, verified by subdivision enclosures rather than point samples (see `PRECISION.md`, "Certified approximations"). Segment endpoints land exactly on the true image, negative mapped radii reflect through the center like `toCartesian`, and on `cartesian` the path comes back unchanged. The output is SVG's native kind — feed it straight to `CubicPath2d.toPathData`.

  **Hit-testing.** `CoordinateSystem.containsPoint(s, theta, r, point)` answers whether a cartesian point lies inside a sector's chart rect, with edge verdicts that hold at any data magnitude. It builds on `Dimension.contains` / `containsApprox`, whose cyclical spans are directed sweeps with the same semantics as `arc` — seam crossings and all.

- 6d2391a: **Exact degree elevation to cubic.** `CubicCurve2d.fromLinear` and `CubicCurve2d.fromQuadratic`, with path-level siblings `CubicPath2d.fromLinear` and `CubicPath2d.fromQuadratic`, re-express lower-degree curves and paths as cubics. Elevation in monomial form is zero-padding — a linear polynomial is a cubic whose `t^2` and `t^3` coefficients are zero — so the elevated curve evaluates bitwise-identically at every parameter, endpoints included, and trait brands (`Continuous`, the per-axis monotonicity brands) carry through the conversion at the type level.

  The motivating consumer is `CoordinateSystem.image`, which takes only `CubicPath2d`: a straight chart-space segment now has a sanctioned route into the polar plane, where its image is an Archimedean spiral.

  ```ts
  import { CoordinateSystem, Dimension } from 'curvy/coordinates'
  import { LinearCurve2d } from 'curvy/curve'
  import { CubicPath2d, LinearPath2d } from 'curvy/path'
  import { Vector2 } from 'curvy/vector'

  const chartPath = LinearPath2d.make(
    LinearCurve2d.fromEndpoints(Vector2.make(0, 40), Vector2.make(90, 120)),
  )
  const spiral = CoordinateSystem.image(
    CoordinateSystem.polar({ theta: Dimension.degrees }),
    CubicPath2d.fromLinear(chartPath),
    0.25,
  )
  ```

- d92734a: Add the ordering predicates to `curvy/number`: `before`, `atMost`, `within`,
  `inside`, `overlaps`, and `touches`. Each decides the order of two values, or
  whether two ranges meet, with the `coincident` band, so rounding noise never
  flips the answer. `before` and `inside` hold only beyond the band; `atMost`,
  `within`, and `touches` hold within it; `overlaps` asks for more than a point
  in common. A non-finite pair compares exactly, so every finite value comes
  before `Infinity`.
- 6d2391a: **`Polar.radius` is typed as the `Dimension` union.** The field and its `PolarConfig` counterpart widen from `Linear` to `Dimension`, so future radial-map kinds can arrive without breaking code that holds a `Polar`. Construction still pins the radial axis to a linear map — `polar` throws on a `Cyclical` radius, whose wrapping would tear `sector` and `image` at period seams — so the widening changes what readers may assume, not what systems exist. Apply the map with the new `mapRadius` instead of reading `scale` and `offset` off the field; direct field reads are what this change deprecates in spirit.
- 6d2391a: **Rays and the polar scalar maps.** `CoordinateSystem.ray` constructs the exact cartesian image of the chart-space segment that holds `theta` fixed and runs `r` across a radial span — the radial counterpart of `arc`. On a polar system the image is a single straight rational segment; on a cartesian system it is the vertical segment at `x = theta`. `rayPathData` emits the same segment as SVG `M`/`L` commands, with a bare `M` for a zero-length span.

  Unlike `arc` and `sector`, `ray` accepts negative mapped radii: a negative mapped radius reflects through the center — the same convention `toCartesian` and `image` already apply — and a span whose mapped radii change sign stays one straight segment passing through the center. The split is deliberate: point maps are total under the reflection convention, while a reflected _shape_ renders at the antipodal angle, which in layout code is the signature of a broken radial map. The new "Polar conventions" section of `PRECISION.md` records the rationale, alongside a "Working with certificates" section on why certified tolerances only compose in output space.

  `mapAngle` and `mapRadius` expose the two scalar halves of `toCartesian`: chart angle to on-screen radians (unwrapped, so differences are sweeps), and chart radius to signed on-screen distance. Both narrow their system parameter to `Polar` — the module's first kind-narrowed exports. The module doc now states the principle: operations stay total over the union wherever both kinds have an honest reading, and narrow their parameter where only one does.

  ```ts
  import { CoordinateSystem, Dimension } from 'curvy/coordinates'

  const system = CoordinateSystem.polar({
    theta: Dimension.degrees,
    thetaOrigin: -90,
  })

  // A radial gridline at 12 o'clock, from the hole to the rim:
  CoordinateSystem.rayPathData(system, 0, { start: 80, end: 120 })

  // Rotate a tick label to face its angle (SVG rotate() wants degrees):
  const rotate = (180 / Math.PI) * CoordinateSystem.mapAngle(system, 45)
  ```

### Patch Changes

- a373aad: `coincident` compares a non-finite pair exactly. An infinity now equals the
  infinity of the same sign and no finite value. Before, the tolerance band
  against an infinity was infinite, so `coincident(5, Infinity)` held, and
  `coincident(Infinity, Infinity)` did not. Every `equals` built on
  `coincident` (vectors, matrices, polynomials, intervals) follows.

## 2.0.0-alpha.17

### Minor Changes

- dda8999: **New `curvy/piecewise` module: `Piecewise`, an explicit piecewise-polynomial function `y = f(x)`.**

  `Piecewise<P, Trait>` is the explicit counterpart to the parametric path types. A `CubicPath2d` maps `t -> (x, y)` with two polynomials per segment; a `Piecewise` maps `x -> y` with one polynomial per piece — the "pp-form" of the spline literature (MATLAB `mkpp`/`ppval`, SciPy `PPoly`). It is generic over the piece polynomial `P` (`LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial`), and carries no `2d` suffix because it is a function of one variable rather than a planar curve.

  Each piece is a `[Closed, P]` pair — a closed x-`Interval` and the polynomial governing it, evaluated in the piece-local normalized coordinate `u = (x - start) / (end - start)`, so every piece's polynomial lives over `[0, 1]` regardless of where its x-domain sits.

  ```ts
  import { Piecewise } from 'curvy/piecewise'
  import { Interval } from 'curvy/interval'

  const pp = Piecewise.make(
    [Interval.make(320, 768), lowerPoly],
    [Interval.make(768, 1280), upperPoly],
  )

  Piecewise.solve(pp, 900) // y at x = 900, or Solution.none outside every piece
  Piecewise.domain(pp) // [320, 1280]
  Piecewise.boundingBox(pp) // the y-image, interior extrema included
  Piecewise.derivative(pp) // f'(x), as a Piecewise one degree lower
  ```

  **Calculus — `Piecewise.derivative`.** Differentiates the function with respect to x, lowering each piece's degree by one (cubics to quadratics, quadratics to linears, linears to piecewise constants). Because each piece is read in its local coordinate `u = (x - start) / size(domain)`, the result carries the per-piece chain-rule factor, so it evaluates to `df/dx` directly rather than `df/du`. The intervals are untouched, so a `Contiguous` result stays gapless — differentiating can still break `Continuous` and `Monotonic`, so those brands drop.

  **Construction from a path — `Piecewise.fromPath`.** Refits a monotonic-x path into a piecewise function of x at the source path's polynomial degree — `LinearPath2d` to linear, `QuadraticPath2d` to quadratic, `CubicPath2d` to cubic. A segment whose x is affine in its parameter is transcribed exactly (a linear path is entirely this case, so linear input is exact and `tolerance` is ignored). A segment with genuine curvature in x has a non-polynomial `y(x)` — inverting a nonlinear `x(t)` leaves an algebraic function — so it is subdivided in x and fitted per cell, bisecting until the fit tracks the curve within `tolerance` (a fraction of the path's y-range, default `1e-4`). The cubic fit matches value and slope at both cell endpoints; the quadratic fit matches both endpoint values and the left-endpoint slope. The path may run either direction in x — a decreasing-x path is reversed to ascending first — so the pieces always tile x left to right.

  ```ts
  const fn = Piecewise.fromPath(path, { tolerance: 1e-4 })
  ```

  **Traits.** The base value is a _partial_ function: its pieces are ordered and non-overlapping in x but may leave gaps. Refiners narrow that — `isContiguous` (no gaps), `isContinuous` (no gaps and no value jumps across the joins), `isMonotonic` (y monotonic across the whole domain) — each with an `as*` asserting variant. `Continuous` implies `Contiguous`.

  **Builders.** `append` adds a piece and drops trait brands. `appendContiguous` and `appendContinuous` preserve the corresponding brand by checking only the new join — the input brand already vouches for the rest — and drop any other brands, since an append can still break them. `mapPolynomials` transforms each piece's polynomial over the same intervals.

  **`appendContinuous` on the path family too.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` gain `appendContinuous(p, c)`: append a curve to a `Continuous` path, preserving the brand, provided the curve's start point connects to the path's current end point (G^0, within `coincident` tolerance). As with the `Piecewise` variants, only the new join is checked and other brands are dropped — reassert them with the relevant refiner if the property still holds.

  **Reversal across the stack — `reverse` and `reflectDomain`.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` gain `reverse`, returning the path traced end-to-start: the segment order is reversed and each segment's parameter direction flipped, over the same geometric image. `LinearCurve2d`, `QuadraticCurve2d`, and `CubicCurve2d` gain the matching curve-level `reverse`, and each polynomial module gains `reflectDomain(p)` — the reflection `q(u) = p(1 - u)` about the domain midpoint, the coefficient transform reversal is built on.

  Because reflection's effect on monotonicity is fixed (unlike an affine transform's, which depends on the matrix), it is tracked in the types: `reflectDomain` and the curve-level `reverse` flip the direction brands precisely — `Increasing` becomes `Decreasing` and vice versa per axis (`Reflected`), while a bare `Monotonic` is preserved. Path `reverse` drops its brands, since a path's direction and continuity live in one intersected `Trait`; reassert them with the refiners. This is what lets `Piecewise.fromPath` accept a decreasing-x path.

## 2.0.0-alpha.16

### Major Changes

- 8ab3d1e: The cubic polynomial's `domain` now returns `Solution.AtMostOne<Interval>`, matching its linear and quadratic siblings. A range whose endpoint values the polynomial never attains (reachable only when the coefficients collapse the degree) returns `Solution.none` instead of throwing an incidental interval-construction error.
- 8ab3d1e: Rename `Vector2.unit`, `Vector3.unit`, and `Vector4.unit` to `one`. These are the all-ones constants (magnitude `sqrt(2)`/`sqrt(3)`/`2`), not unit-length vectors, and the old name promised normalization it never had. `Vector3.unitX`/`unitY`/`unitZ` keep their names: those are genuine unit vectors.

### Minor Changes

- 8ab3d1e: **`flow` — left-to-right function composition, the point-free companion to `pipe`.** Exported from `curvy/utils`.

  Where `pipe(x, f, g)` threads a starting value through functions immediately (`g(f(x))`), `flow(f, g)` composes the functions into a new one and waits for the value (`x => g(f(x))`). That lets you name a reusable pipeline and apply it later — or hand it straight to `.map`. It carries the same 1-through-9 overload ladder as `pipe`, fully typed so each step's input is checked against the previous step's output.

  It fits curvy's data-last overloads, whose partially-applied forms are exactly the unary functions `flow` composes:

  ```ts
  import { flow } from 'curvy/utils'
  import { Vector2 } from 'curvy/vector'

  // Build the transform once, apply it many times.
  const nudge = flow(Vector2.scale(2), Vector2.add(Vector2.make(1, 0)))

  nudge(Vector2.make(3, 4)) // Vector2 { x: 7, y: 8 }
  points.map(nudge) // reuse across a collection
  ```

  curvy does not use `flow` internally; it ships alongside `pipe` for consumers assembling their own operation pipelines.

- 8ab3d1e: Path `solve` (all path types) now has a defined out-of-range contract: parameters within `EPSILON` outside `[0, 1]` snap to the boundary, forgiving accumulated float error, and anything beyond throws an invariant with a clear message. Previously an out-of-range parameter indexed a nonexistent segment and failed with an incidental `TypeError`.

## 2.0.0-alpha.15

### Minor Changes

- e1a0f36: **New `curvy/transform` module: `Affine2d`, plus `transform` on every curve, path, and spline.**

  `Affine2d` is an immutable 2D affine transform backed by a homogeneous `Matrix3x3`. Constructors cover the standard family:

  ```ts
  import { Affine2d } from 'curvy/transform'
  import { Vector2 } from 'curvy/vector'

  Affine2d.identity
  Affine2d.translate(10, 0) // or translateBy(Vector2.make(10, 0))
  Affine2d.rotate(Math.PI / 4) // or rotateAround(theta, origin)
  Affine2d.scale(2) // or scale(sx, sy), scaleAround(sx, sy, origin)
  Affine2d.shear(kx, ky)
  Affine2d.reflectX // constants; or reflectAcrossLine(origin, direction)
  Affine2d.fromMatrix(m) // validates the bottom row is affine
  ```

  `andThen` composes transforms; `apply` / `applyTo` send a `Vector2` through one. Accessors `translation`, `linear`, and `linearPart` decompose a transform into its translation vector and linear part. `equals` compares component-wise. `inverse` / `inverseUnsafe` and the `Invertible` trait integration are described in the matrix `Invertible` changeset — an invertible `Affine2d` is one whose underlying matrix is invertible.

  **`transform(x, t: Affine2d)` is available on every geometric carrier** — `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`, `RationalCubicCurve2d`, the four path types, and all six spline types — in both data-first and data-last forms. Each returns a new instance of the same kind with the transform applied to its geometry; `Cardinal2d.transform` preserves `tension` and `alpha`, and `RationalBezier2d.transform` preserves control-point weights.

  Transforming **drops trait brands** — the result is unbranded even when the input carried `Monotonic*` or `Continuous`. An affine map can break axis monotonicity outright (rotate an x-increasing curve by 90°), so the brands can't travel through in general; re-refine with the `is*` / `as*` refiners after transforming when the property still matters.

  ```ts
  import { Affine2d } from 'curvy/transform'
  import { CubicPath2d } from 'curvy/path'

  const flipped = path.pipe(CubicPath2d.transform(Affine2d.reflectY))
  ```

  **`Matrix3x3` gains `identity` and `multiply`** (matching `Matrix4x4`'s existing primitives), used by the transform composition but useful standalone.

- e1a0f36: **Scale-aware tolerance policy across the library; `coincident`, `RELATIVE_TOLERANCE`, `Monotonicity.fromDerivativeRange`, and `Solution.clipApprox` added.**

  v2's exact-IEEE value model gets its other half: constructions stay exact, and every predicate that asks "are these the same value?" or "is this sign real?" now widens its tolerance with the magnitude of its inputs, so classification is invariant under uniform scaling of the data. The full model — which checks are exact, which are tolerant, and how to choose tolerances — is documented in `PRECISION.md` at the repo root.
  - **`coincident(a, b, absolute?, relative?)` in `curvy/number`** is the policy answer to point/value identity: true when `|a - b| <= absolute + relative * max(|a|, |b|)`, defaulting to `absolute = EPSILON` (`1e-10`) and `relative = RELATIVE_TOLERANCE` (`1e-12`, newly exported). The tolerance parameters are positional, mirroring `epsEquals(a, b, eps)`. The relative term covers rounding noise, which grows with magnitude (ulps near `1e9` are ~`1.2e-7`, far outside any fixed band); the absolute term covers the neighborhood of zero, where relative comparison degenerates. Migrated call sites: `Path2d` continuity and knot checks, `toPathData` move-insertion, `solveAtX`/`solveAtY` snapping and bracketing, `equals` on every vector/matrix/polynomial/interval type, `Affine2d.fromMatrix`'s bottom-row test, and `solveByDistance`'s Newton convergence (now relative to segment length — results are invariant under uniform scaling of the path, and long segments no longer burn all 16 iterations). `coincident` is deliberately not transitive; pairwise semantics are intentional. `epsEquals` is unchanged and remains the raw absolute tool.

  - **Monotonicity classifies by derivative values, not root locations.** Root locations are ill-conditioned exactly where classification matters — a root computed from rounded coefficients lands an ulp to either side of the interval boundary. `QuadraticPolynomial.monotonicity` and `CubicPolynomial.monotonicity` now feed the derivative's exact range into the new `Monotonicity.fromDerivativeRange(min, max, tolerance?)`: a sign only counts when it exceeds `RELATIVE_TOLERANCE` scaled by the larger bound. Pinned-endpoint Cardinal paths no longer fail `asMonotonicX` on float-ulp parity; `t³` on `[-1, 1]` correctly classifies `Increasing` (previously `None`); genuine reversals are unaffected. The `Monotonic`/`Increasing`/`Decreasing` brands accordingly carry an honest numerical contract.

  - **Matrix singularity is scale-relative.** `isInvertible` / `asInvertible` / `inverse` on `Matrix3x3`, `Matrix4x4`, and `Affine2d` compare the determinant against `RELATIVE_TOLERANCE` × Hadamard's bound (the product of row norms) instead of an absolute epsilon. `diag(1e-8, 1e-8, 1)` is correctly non-singular; a large matrix with nearly dependent rows is correctly singular.

  - **Quadratic root finding is cancellation-stable.** `QuadraticPolynomial.solveInverse` computes the larger-magnitude root with matching signs and recovers the other from the root product (Vieta) — for `t² + 1e8·t + 1` the small root's error drops from 25% to one ulp. Quadratic and cubic discriminant sign tests move from absolute to relative clamps, so root-count dispatch is scale-invariant and `solveInverse((t-1)², -Number.EPSILON)` reports the double root.

  - **Cubic roots are Newton-refined; `Solution.clipApprox` added.** `CubicPolynomial.solveInverse` follows its closed-form step with up to four Newton iterations, recovering the ~3 digits the trig branch loses when roots cluster. The remaining ulp-level boundary overshoot is handled by `Solution.clipApprox(s, interval)` — like `Solution.clip` but treating values within `EPSILON` of a boundary as in-range, intended for post-processing solver output. The quadratic, cubic, and rational `solveAtX` / `solveAtY` implementations use it internally (the linear inverse is a single division with no drift to absorb, so it keeps the strict clip); this fixes rational cubics whose `t = 1` root drifted past the strict clip.

  - **The uniform B-spline characteristic matrix uses the exact `1/6`.** One entry was `roundDown(1/6)`, a relic of the v1 rounding model; under exact-IEEE values it pushed the c₀ row's partition-of-unity error to `6.7e-9`. Coincident control points now reproduce their point to within an ulp.

- e1a0f36: **Easing constructors on `RationalCubicCurve2d`.** Two ways to build a `y(x)` easing curve directly, without assembling control points by hand.

  **`fromSlopesAndCurvatures(m0, m1, k0, k1)`** takes endpoint slopes _and_ signed curvatures, interpolates `(0, 0)` and `(1, 1)`, and pins `x(t) = t` exactly — so `solveAtX` is exact rather than approximate for these curves.

  ```ts
  import { RationalCubicCurve2d } from 'curvy/curve'

  // Smoothstep — y'(0) = y'(1) = 0, y''(0) = 6, y''(1) = -6.
  const smoothstep = RationalCubicCurve2d.fromSlopesAndCurvatures(0, 0, 6, -6)

  // Linear — y(t) = t. Special-cased from the degenerate constraint system.
  const linear = RationalCubicCurve2d.fromSlopesAndCurvatures(1, 1, 0, 0)

  // Asymmetric ease with a flat start.
  const ease = RationalCubicCurve2d.fromSlopesAndCurvatures(0, 2, 2, 0.18)
  ```

  Curvature inputs are the signed differential-geometric curvatures `κ = y''(x) / (1 + y'(x)²)^(3/2)` — the parameterization-invariant "bend" of the easing graph, positive for concave-up. Because `x(t) = t` is pinned, parametric and Cartesian second derivatives agree at the endpoints, so the conversion is simply `y''(0) = κ₀ · (1 + m₀²)^(3/2)` (and likewise at 1). Under the hood the denominator polynomial is quadratic, giving six free parameters for six endpoint constraints; solving for its Bernstein control values is a closed-form 2×2 linear system. Construction throws on non-finite inputs, a singular constraint system (other than the canonical linear case), or a denominator that vanishes on `[0, 1]`.

  Monotonicity is not enforced at construction. Callers who need the `Increasing` brand — for `solveAtX`'s narrowed `Solution.AtMostOne` return — follow construction with `asIncreasing` / `asMonotonic`, which run a rigorous Bernstein sign-convexity check:

  ```ts
  const ease = RationalCubicCurve2d.asIncreasing(
    RationalCubicCurve2d.fromSlopesAndCurvatures(0.5, 1.5, 1, -1),
  )
  RationalCubicCurve2d.solveAtX(ease, 0.7) // → Solution.AtMostOne<number>
  ```

  **`fromBezierPoints(p1, p2)` — a 2-arg easing overload.** Pins the endpoints at `(0, 0)` and `(1, 1)` with unit weights, leaving the two interior handles as the only inputs — the rational analog of CSS's `cubic-bezier(x1, y1, x2, y2)`, with weights available for true rational control. Unit weights recover the polynomial Bézier. The four-arg form is unchanged; the runtime dispatches on `arguments.length`.

  ```ts
  import { Vector2 } from 'curvy/vector'

  // CSS ease-in-out.
  const ease = RationalCubicCurve2d.fromBezierPoints(
    Vector2.makeWeighted(0.42, 0, 1),
    Vector2.makeWeighted(0.58, 1, 1),
  )
  ```

## 2.0.0-alpha.14

### Major Changes

- 6c472be: Add an `Invertible` trait to `Matrix3x3`, `Matrix4x4`, and `Affine2d`, paralleling the polynomial `Monotonic` family. The trait is exposed through `isInvertible` / `asInvertible` refiners and a phantom `Traits` parameter on each carrier's interface.

  `inverse` now returns a `Solution.AtMostOne` by default, tightening to `Solution.One` when the carrier is `Invertible`-branded. Today's throwing-on-singular behavior is preserved under the new name `inverseUnsafe`.

  Invertibility is checked with `epsEquals(det, 0)` (rather than the previous exact `det !== 0`), matching the absolute-tolerance convention used elsewhere in the package.

  ```ts
  import * as Matrix3x3 from 'curvy/matrix3x3'
  import { Solution } from 'curvy/solution'

  // Solution.AtMostOne<Matrix3x3>
  const a = Matrix3x3.inverse(m)
  if (Solution.isSome(a)) {
    use(a.value)
  }

  // Solution.One<Matrix3x3<Invertible>> — .value directly accessible
  const b = Matrix3x3.inverse(Matrix3x3.asInvertible(m))
  use(b.value)

  // Throws on singular — equivalent to the pre-2.0 `inverse`
  const c = Matrix3x3.inverseUnsafe(m)
  ```

  `Affine2d` shares the same `Invertible` brand: an invertible `Affine2d` is one whose underlying matrix is invertible.

  **Migration:**
  - `Matrix3x3.inverse(m)`, `Matrix4x4.inverse(m)`, and `Affine2d.inverse(a)` now return a `Solution.AtMostOne` instead of a bare value. Replace with `inverseUnsafe` for the simplest behavior-preserving change, or pattern-match the `Solution` for the safer path.
  - The singular check now uses `epsEquals` rather than exact `=== 0`. Matrices that were marginally non-singular under the old check (determinants smaller than the default tolerance) will now be treated as singular.

### Minor Changes

- 9492548: **`coincident` added to `curvy/number`; every identity comparison now widens with magnitude.**

  `coincident(a, b, absolute?, relative?)` is the library's policy answer to "are these the same value?": true when `|a - b| <= absolute + relative * max(|a|, |b|)`, defaulting to `absolute = EPSILON` (1e-10, the modeling floor for order-~1 coordinates) and `relative = RELATIVE_TOLERANCE` (1e-12). The tolerance parameters are positional, mirroring `epsEquals(a, b, eps)` — the common override is `absolute` alone, for a domain with a known resolution. The relative term covers rounding noise, which grows with magnitude — ulps near 1e9 are ~1.2e-7, far outside any fixed absolute band — while the absolute term covers the neighborhood of zero, where relative comparison degenerates. The band is at least as wide as the previous absolute check, so nothing formerly coincident becomes distinct; behavior only extends to large-coordinate data that was previously misjudged. `epsEquals` is unchanged and remains the raw absolute tool for normalized domains (curve parameter space) and caller-chosen bands.

  Migrated to `coincident`:
  - **Point coincidence** — `Path2d` continuity (`isContinuous`), `toPathData`'s move-command insertion, the per-axis knot-ordering bands behind `isIncreasingX`/`isDecreasingX`/`isIncreasingY`/`isDecreasingY`, and `solveAtX`/`solveAtY` knot snapping and segment bracketing. A Cardinal path with non-dyadic coordinates offset to 1e9 accumulates ~1.2e-7 of knot drift from storage rounding alone; it now correctly brands `Continuous`, while a genuine gap at the same magnitude is still rejected.
  - **Value equality** — `equals` on `Vector2`/`Vector3`/`Vector4` (including `weightedEquals`), `Matrix2x2`/`Matrix3x3`/`Matrix4x4`, `LinearPolynomial`/`QuadraticPolynomial`/`CubicPolynomial`, `Interval.equals`/`aligned`, and `RationalBezier2d`'s uniform-weight test.
  - **Structural checks** — `Affine2d.fromMatrix`'s bottom-row test scales its zero band with the magnitude of the matrix's other entries, so a transform with 1e8-scale terms tolerates proportional rounding residue in the projective slots while genuinely projective rows are rejected at any scale.

  Also fixed under the same policy: `CubicPath2d.solveByDistance`'s Newton iteration now converges when the remaining arc-length error is small **relative to the segment length**. The previous absolute criterion (1e-10 in arc-length units) demanded unreachable precision on long segments — burning all 16 iterations every call — and exited a step early on very short ones; `solveByDistance` results are now invariant under uniform scaling of the path.

  `coincident` is deliberately not transitive — chains of pairwise-coincident values can drift beyond the band. Pairwise semantics are intentional: path continuity checks each junction locally.

- dadacd7: **Curve endpoint primitives.** Each `Curve2d` module gains closed-form geometry primitives that lift the per-degree formulas previously inlined in path code onto the curve modules themselves:
  - `startPoint(c)` and `endPoint(c)` — exact-at-`t=0` and exact-at-`t=1` evaluations. Added to `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`, and `RationalCubicCurve2d`. For the rational case the projection is `(sum(x_i) / sum(w_i), sum(y_i) / sum(w_i))`; for the polynomial cases it's just `c.x.c0` and a sum of coefficients.
  - `xRange(c)` and `yRange(c)` — the tight `[min, max]` of each axis over the unit interval, derived from the polynomial-level `unitRange`. Added to `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`. The rational case is intentionally deferred because a tight rational projection requires a tolerance.
  - `toPathDataSegment(c)` — emits a single SVG path-data drawing command (`L ...`, `Q ...`, `C ...`) for one segment, without a leading `M`. Added to `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`. Path-level `toPathData` continues to handle move-insertion based on continuity.

  These are pure additions — no existing API changed.

- aba86fb: **Generic `Path2d<C>`.** The three polynomial path kinds (`LinearPath2d`, `QuadraticPath2d`, `CubicPath2d`) used to be near-duplicate implementations — each ~300-line internal module re-deriving the same `make`, `length`, `solve`, `toPathData`, continuity refiner, monotonicity refiners, and `solveAtX`/`solveAtY`. They now all derive their operation surface from one generic implementation parameterized by a `Curve2dOps<C>` bundle:

  ```ts
  // path/path2d.ts (new)
  export interface Path2d<C, Trait = unknown> extends Pipeable, Iterable<C> {
    readonly [PathTraits]: Trait
  }

  export const makeMethods = <C>(typeId: symbol, ops: Curve2dOps<C>) => ({
    make,
    fromArray,
    append,
    length,
    solve,
    toPathData,
    isContinuous,
    isIncreasingX,
    isDecreasingX,
    isMonotonicX,
    isIncreasingY,
    isDecreasingY,
    isMonotonicY,
    solveAtX,
    solveAtY,
    boundingBox,
  })

  // path/linear2d.internal.ts (after — ~130 lines, down from ~310)
  const methods = Path2d.makeMethods(LinearPath2dTypeId, LinearCurve2d.Ops)
  export const make = methods.make as (...curves) => LinearPath2d
  export const length = methods.length as (p: LinearPath2d) => number
  // ...
  ```

  What's new:
  - **`Curve2dOps<C>` interface** in `curve/curve2d.ts` — the minimal operation bundle a curve module must provide (solve, startPoint/endPoint, length, boundingBox, solveAtX/Y, toPathDataSegment, per-axis monotonicity).
  - **`Ops` export** on `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d` — instances of `Curve2dOps` ready to pass into `Path2d.makeMethods`.
  - **Per-axis monotonicity predicates** on polynomial curves: `isMonotonicX`/`Y`, `isIncreasingX`/`Y`, `isDecreasingX`/`Y` — brand-aware predicates that refine only one axis, mirroring what `RationalCubicCurve2d` already had.
  - **`Path2d<C, Trait>` + `Path2d.makeMethods`** in `path/path2d.ts` — the generic interface and operation factory.

  Behavior is preserved: every existing public API on `LinearPath2d` / `QuadraticPath2d` / `CubicPath2d` works as before (same signatures, same per-kind `TypeId`-based runtime identity, same error messages). `RationalCubicPath2d` is unchanged — its tolerance-threaded bounding box and unique projection semantics keep it outside the generic for now.

- 736ef05: **`RationalCubicCurve2d.fromBezierPoints` 2-arg easing overload.** A new overload pins the endpoints at `(0, 0)` and `(1, 1)` with unit weights, leaving the two interior handles as the only inputs — the rational analog of CSS's `cubic-bezier(x1, y1, x2, y2)`.

  ```ts
  import { RationalCubicCurve2d } from 'curvy/curve'
  import { Vector2 } from 'curvy/vector'

  // CSS ease-in-out, with weights for true rational control. Unit weights here
  // recover the polynomial Bézier.
  const ease = RationalCubicCurve2d.fromBezierPoints(
    Vector2.makeWeighted(0.42, 0, 1),
    Vector2.makeWeighted(0.58, 1, 1),
  )

  RationalCubicCurve2d.solve(ease, 0) // -> (0, 0)
  RationalCubicCurve2d.solve(ease, 1) // -> (1, 1)
  ```

  The four-arg form is unchanged; the runtime dispatches on `arguments.length`.

- efbba37: **`RationalCubicCurve2d.fromSlopesAndCurvatures` replaces `makeMonotonicEasing`.** The easing constructor now takes endpoint slopes _and_ signed curvatures, giving full control over the start and end shape of the curve rather than the previous slope-only Gregory-Delbourgo heuristic.

  ```ts
  import { RationalCubicCurve2d } from 'curvy/curve'

  // Smoothstep — y'(0) = y'(1) = 0, y''(0) = 6, y''(1) = -6.
  const smoothstep = RationalCubicCurve2d.fromSlopesAndCurvatures(0, 0, 6, -6)

  // Linear — y(t) = t. Special-cased from the degenerate constraint system.
  const linear = RationalCubicCurve2d.fromSlopesAndCurvatures(1, 1, 0, 0)

  // Asymmetric ease with a flat start.
  const ease = RationalCubicCurve2d.fromSlopesAndCurvatures(0, 2, 2, 0.18)
  ```

  Curvature inputs are the signed differential-geometric curvatures `k = y''(x) / (1 + y'(x)^2)^(3/2)` — the parameterization-invariant "bend" of the easing graph. Positive k is concave-up. Because `x(t) = t` is pinned, parametric and Cartesian second derivatives agree, so the conversion at endpoints is simply `y''(0) = k0 * (1 + m0^2)^(3/2)` and `y''(1) = k1 * (1 + m1^2)^(3/2)`.

  Under the hood the denominator polynomial is now quadratic (was linear under Gregory-Delbourgo), giving the six free parameters needed to exactly match six endpoint constraints. Solving for the denominator's Bernstein control values is a closed-form 2x2 linear system — no iteration or root finding.

  **Monotonicity is no longer enforced at construction.** The previous `makeMonotonicEasing` returned `RationalCubicCurve2d<Increasing, Increasing>` so that `solveAtX` would narrow to `Solution.AtMostOne<number>`. `fromSlopesAndCurvatures` returns the unbranded `RationalCubicCurve2d` — callers who need the brand for narrowed inverse-solve returns should follow construction with `asIncreasing` / `asDecreasing` / `asMonotonic`, which run a rigorous Bernstein sign convexity check:

  ```ts
  const ease = RationalCubicCurve2d.asIncreasing(
    RationalCubicCurve2d.fromSlopesAndCurvatures(0.5, 1.5, 1, -1),
  )
  RationalCubicCurve2d.solveAtX(ease, 0.7) // -> Solution.AtMostOne<number>
  ```

  Construction throws when inputs are non-finite, when the constraint system is singular (other than the canonical linear-easing case), or when the resulting denominator vanishes on `[0, 1]`.

- 736ef05: **Spline `mapPoints` / `flatMap` + `Vector2.liftWithWeight`.** Every spline type — `Linear2d`, `Bezier2d`, `Basis2d`, `Cardinal2d`, `Hermite2d`, `RationalBezier2d` — now exposes a `mapPoints` (per-point transform) and a `flatMap` (bulk transform with builder access). Both go through the existing constructors, so point-count and arity invariants stay enforced.

  ```ts
  import { Bezier2d } from 'curvy/splines'
  import { Vector2 } from 'curvy/vector'

  const translated = bezier.pipe(Bezier2d.mapPoints((p) => Vector2.make(p.x + 10, p.y)))

  const decimated = bezier.pipe(
    Bezier2d.flatMap((points) => Bezier2d.fromArray(points.filter((_, i) => i % 2 === 0))),
  )
  ```

  `RationalBezier2d.mapPoints` takes a `Vector2.Weighted -> Vector2.Weighted` mapper, matching its storage form. Two related conveniences:
  - `Vector2.liftWithWeight(fn)` bridges a position-only `Vector2 -> Vector2` function up to a weighted mapper, **preserving the input weight by default** — translating, rotating, or scaling a conic arc no longer risks silently collapsing its geometry-defining weights to 1.
  - `Vector2.liftWithWeight(fn, weight)` overrides the weight when you want to reset it explicitly.
  - Dual: `Vector2.liftWithWeight(weighted, fn)` and `Vector2.liftWithWeight(weighted, fn, weight)` apply directly to a single point.

  ```ts
  import { RationalBezier2d } from 'curvy/splines'
  import { Vector2 } from 'curvy/vector'

  // Weight passes through unchanged — circle stays a circle.
  const moved = arc.pipe(
    RationalBezier2d.mapPoints(Vector2.liftWithWeight((p) => Vector2.make(p.x + 10, p.y))),
  )
  ```

  `Cardinal2d.mapPoints` preserves the spline's `tension` and `alpha`; `Cardinal2d.flatMap` uses whatever options the mapper picks on the new spline. `Hermite2d.mapPoints` applies the transform uniformly to both position and velocity slots — affine transforms behave correctly across both; for position-only translation, use `flatMap` to split the array yourself.

### Patch Changes

- 6571593: **The uniform B-spline characteristic matrix uses the exact `1/6`.**

  One entry of `Characteristic.cubicBasisSpline`'s first row was `roundDown(1/6)` — a relic of the v1 precision model, where every value was snapped to 8 decimals on construction and the truncation compensated for it. Under the v2 exact-IEEE model it did the opposite: the c0 row's partition-of-unity error was `6.7e-9` instead of one ulp (`1.1e-16`), shifting every basis-spline segment's constant term by up to `6.7e-9` times the third control point's magnitude. The row is now `1/6, 4/6, 1/6, 0` exactly as computed, and coincident control points reproduce their point to within an ulp.

- efbba37: **Cubic root finder is now Newton-refined; `Solution.clipApprox` added for tolerant solver-output clipping.**

  `CubicPolynomial.solveInverse` now follows its closed-form (Cardano/trig) step with up to four Newton iterations on each root. The closed-form path can lose ~3 digits of precision when two roots cluster (the trig branch's `acos` argument approaches `+/-1`, where its derivative is unbounded); Newton converges quadratically away from multiple roots, so a few-ULP-off seed reaches machine epsilon in 2-3 steps. The iteration bails on a float fixed point or on a vanishing slope (true multiple-root case where Newton degrades to linear convergence and further steps don't help).

  This fixes a class of `solveAtX` / `solveAtY` failures on rational cubics with small denominator weights — previously, a cubic of the form `(t - 1)*W(t)` with `W` having a root near `1` would have its `t = 1` root drift far enough that the strict `[0, 1]` clip dropped it. With Newton refinement that root lands at `1 + O(ULP)` instead of, say, `1 + 0.03`.

  The remaining ULP-level overshoot is now handled by a second change:

  ```ts
  import { Solution } from 'curvy/solution'

  // Strict (existing): respects Interval.kind exactly.
  Solution.clip(s, Interval.unit)

  // Tolerant (new): treats values within EPSILON of either boundary as in-range.
  // Intended for post-processing numerical solver output.
  Solution.clipApprox(s, Interval.unit)
  ```

  `Solution.clipApprox` mirrors `Interval.containsApprox` semantics — at the EPSILON scale the open/closed distinction loses meaning, and the use case is "this came out of a numerical solver, an ULP-level overshoot at the boundary should still count." All four `solveAtX` / `solveAtY` implementations across `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`, and `RationalCubicCurve2d` now use `clipApprox` internally. The strict `Solution.clip` is unchanged for callers who need bit-exact open/closed boundary handling.

- 6571593: **Matrix singularity checks are now relative to the matrix's own scale.**

  `Matrix3x3` and `Matrix4x4` `isInvertible` / `asInvertible` / `inverse` / `inverseUnsafe` (and `Affine2d`'s, which delegate) previously compared the determinant against the absolute `EPSILON`. Determinants scale with the matrix — a 3x3 scaled uniformly by `s` has its determinant scaled by `s^3` — so an absolute threshold misjudges in both directions: `diag(1e-8, 1e-8, 1)` was called singular despite being perfectly conditioned (its inverse is exactly `diag(1e8, 1e8, 1)`), while a large matrix with nearly dependent rows could pass with a determinant that is pure rounding noise.

  The determinant is now compared against `RELATIVE_TOLERANCE` times Hadamard's bound (the product of the row norms, which the absolute determinant can never exceed). The ratio of determinant to Hadamard bound is a scale-free measure of row independence — 1 for orthogonal rows, 0 for parallel ones — so classification is invariant under uniform scaling of the matrix.

  Behavioral changes: uniformly scaled matrices of any magnitude now correctly classify as invertible; near-singular matrices with large entries now correctly classify as singular. `Matrix2x2.solveSystem`'s division guard is unchanged — it is a construction guard against exact division by zero, not a semantic predicate.

- 6e18275: **Monotonicity classification is now tolerant of rounding noise in the derivative; `Monotonicity.fromDerivativeRange` and `RELATIVE_TOLERANCE` added.**

  `CubicPolynomial.monotonicity` and `QuadraticPolynomial.monotonicity` previously classified by _root location_: any derivative root strictly inside the open interval meant `None`. Root locations are ill-conditioned exactly where this matters — a root computed from rounded coefficients can land an ulp to either side of an interval boundary. Cardinal paths built with `withInterpolatedEndpoints` hit this systematically: the pinned endpoint constructs a zero end-tangent, the Hermite->monomial collection cancels `x'(1)` to `0 +/- 2` ulps, and the derivative root lands at `1 -/+ ulp`. Whether `asMonotonicX` passed or threw was decided by the inputs' last bits.

  Both classifiers now judge the derivative's _values_, which are well-conditioned where its roots are not. The derivative's exact range over the interval (endpoint values, plus the vertex value for the cubic's quadratic derivative when the vertex lies inside) feeds `Monotonicity.fromDerivativeRange(min, max, tolerance?)`: each range bound sets its sign-coverage bit only when it exceeds the tolerance, which defaults to the new `RELATIVE_TOLERANCE` (`1e-12`, exported from `curvy/number`) scaled by the larger bound magnitude. Classification is therefore invariant under scaling of the input data, and values indistinguishable from accumulated rounding noise can no longer decide a sign question.

  Behavioral changes, all in the direction of the mathematically correct answer:
  - Strictly-x-monotonic pinned-endpoint Cardinal paths (e.g. `[[0,10],[1,0.02],[2,0.02]]` via `withInterpolatedEndpoints`) no longer fail `asMonotonicX` on float-ulp parity.
  - A derivative that touches zero at an interior double root without crossing — `t^3` on `[-1, 1]` — now correctly classifies `Increasing` (previously `None`).
  - A derivative excursion past zero at ulp scale classifies by the dominant sign instead of `None`.

  Genuine reversals are unaffected: a real crossing exceeds the tolerance band by many orders of magnitude (the band sits ~4,500x above per-operation IEEE rounding noise and far below any geometrically meaningful feature).

  The refined trait brands (`Monotonic`, `Increasing`, `Decreasing`) accordingly carry an honest numerical contract: the derivative takes no opposite-sign values exceeding `RELATIVE_TOLERANCE * max|derivative|` on the interval, so `solveInverse` is unique to within matching precision.

- 1aad61a: **Path code now delegates segment geometry to the curve modules.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` internal implementations (`toPathData`, `isContinuous`, monotonicity refiners, `solveAtX`/`solveAtY`) used to inline per-degree formulas like `c.x.c0 + c.x.c1 + c.x.c2 + c.x.c3` to recover segment endpoints and SVG control points. They now call `startPoint`/`endPoint`/`toPathDataSegment` on the curve module instead.

  Behavior is preserved exactly — the same min/max-of-endpoints bracketing semantics are used in `solveAtX`/`solveAtY`, not the curves' true `xRange`/`yRange`. Pure internal refactor with no public-API or behavior change. Sets up a follow-up extraction of a single generic `Path2d<C>` over a common `Curve2d` interface.

- 6571593: **Quadratic root finding is cancellation-stable; discriminant sign tests are now relative.**

  `QuadraticPolynomial.solveInverse` previously used the textbook formula `(-c1 +/- sqrt(disc)) / (2*c2)` for both roots. When `c1^2 >> |c2*c|`, one of the two numerators subtracts nearly equal quantities and cancels catastrophically — for `t^2 + 1e8*t + 1` the small root came out as `-7.45e-9` instead of `-1e-8`, a 25% error. The solver now computes the larger-magnitude root with matching signs (no cancellation) and recovers the other from the root product `c/c2` (Vieta), which only multiplies and divides. Residual on that example drops from `0.25` to one ulp.

  Both discriminant sign tests also move from absolute to relative thresholds. The quadratic discriminant `c1^2 - 4*c2*c` and the depressed cubic's `-(4p^3 + 27q^2)` are each a cancellation between two computed terms, so their sign near zero is noise; each is now clamped to zero within `RELATIVE_TOLERANCE` times the larger term's magnitude (the cubic previously used an absolute `1e-12` clamp). Root-count dispatch is therefore invariant under scaling of the coefficients, and a tangency query that under- or overshoots the touch point by an ulp reports the double root instead of no solution — `solveInverse((t-1)^2, -Number.EPSILON)` now returns `t = 1`.

## 2.0.0-alpha.13

### Major Changes

- 76a3c92: **Monotonicity detection on rational cubic curves.** Two new accessors on `RationalCubicCurve2d` classify each projected axis on the unit interval:

  ```ts
  import { RationalCubicCurve2d } from 'curvy/curve'
  import { Monotonicity } from 'curvy/monotonicity'

  RationalCubicCurve2d.xMonotonicity(c) // Monotonicity (Constant | Increasing | Decreasing | None)
  RationalCubicCurve2d.yMonotonicity(c)
  ```

  The classification is decided via **Bernstein sign convexity** on the derivative-numerator polynomial `q(t) = X'*W - X*W'`. Since `W^2 > 0` wherever the curve is well-defined, the sign of `dx/dt` equals the sign of `q`. Although `q` is a difference of degree-5 products, the leading terms cancel and `q` is in fact a quartic — its 5 Bernstein coefficients on `[0, 1]` are evaluated for uniform sign, with de Casteljau subdivision to resolve mixed-sign cases. The procedure is exact except at tangential zeros, where it conservatively reports `None`. No quintic solver involved.

  **Trait refiners and asserters, both combined and per-axis.** All twelve forms attach the `Monotonic` / `Increasing` / `Decreasing` brand from `curvy/polynomial`:

  ```ts
  // combined — both axes must satisfy
  RationalCubicCurve2d.isMonotonic(c) // c is RationalCubicCurve2d<XT & Monotonic, YT & Monotonic>
  RationalCubicCurve2d.isIncreasing(c)
  RationalCubicCurve2d.isDecreasing(c)
  RationalCubicCurve2d.asMonotonic(c) // throws if not

  // per-axis — narrows only the named axis
  RationalCubicCurve2d.isMonotonicX(c) // c is RationalCubicCurve2d<XT & Monotonic, YT>
  RationalCubicCurve2d.isIncreasingX(c)
  RationalCubicCurve2d.isDecreasingX(c)
  RationalCubicCurve2d.asMonotonicX(c)
  // (and the corresponding `...Y` variants)
  ```

  Per-axis matters because `solveAtX`'s `XT extends Monotonic` overload (returning `Solution.AtMostOne<number>`) only needs x monotonicity — not y. The combined refiners compose internally from `isXxx(c) && isYyy(c)`, with TypeScript's `&&` narrowing accumulating both brands.

  **Tight bounding box via subdivision.** `RationalCubicCurve2d.boundingBox` now takes a `tolerance` and returns a box tight to within `tolerance` per side, not the cheap loose hull AABB it used to return.

  ```ts
  RationalCubicCurve2d.boundingBox(c, 0.01) // Interval2d<Closed, Closed>
  ```

  Computing the exact box would require the extrema of `x(t)/w(t)` and `y(t)/w(t)`, each a degree-5 root problem. Instead the curve is subdivided at `t = 0.5` and the per-leaf hull AABBs are unioned. The per-leaf termination criterion compares the leaf hull against the leaf's endpoint AABB (which the curve provably visits), so the per-side slack is bounded. Polynomial cubics (uniform weights) hit a fast path that computes the exact box from per-axis cubic extrema with no subdivision.

  **Path-level bounding box.** `RationalCubicPath2d.boundingBox(p, tolerance)` unions the per-segment boxes. The slack guarantee carries through — each segment is within tolerance, so the union is too.

  ```ts
  import { RationalCubicPath2d } from 'curvy/path'
  RationalCubicPath2d.boundingBox(path, 0.01)
  ```

  **Breaking.** `RationalCubicCurve2d.boundingBox` previously took just the curve and returned a loose hull AABB; it now requires a `tolerance` argument. Callers wanting the old behavior have nothing to migrate _to_ — the loose box is no longer part of the public API. Internally the hull bound still exists as a leaf helper for subdivision-based geometric queries.

- 76a3c92: **`Monotonicity` is now a top-level subpath, encoded as a bitmask.** The type moved out of `curvy/polynomial`'s internals into its own first-class module at `curvy/monotonicity`, and the values switched from a string union to a 2-bit sign-coverage bitmask of the function's derivative.

  ```ts
  import { Monotonicity } from 'curvy/monotonicity'
  import { CubicPolynomial } from 'curvy/polynomial'

  const m: Monotonicity = CubicPolynomial.monotonicity(p, Interval.unit)
  if (m === Monotonicity.Increasing) {
    /* ... */
  }
  if (Monotonicity.isStrict(m)) {
    /* m is Increasing | Decreasing */
  }
  ```

  The new encoding:

  | value | name         | derivative on the interval    |
  | ----- | ------------ | ----------------------------- |
  | `0`   | `Constant`   | = 0 everywhere                |
  | `1`   | `Increasing` | >= 0, with at least one `> 0` |
  | `2`   | `Decreasing` | <= 0, with at least one `< 0` |
  | `3`   | `None`       | crosses zero                  |

  The numeric encoding is principled, not arbitrary: bit 0 is "derivative takes positive values", bit 1 is "derivative takes negative values". So the bitwise OR of two adjacent subintervals' classifications gives the classification of their union — `Increasing | Decreasing === None` is a literal algebraic identity, not a special case. That lets subdivision-based monotonicity checks combine sub-results with a single `|`, no custom merge logic.

  `Monotonicity.isStrict(m)` is the new type-narrowing predicate (`m is 1 | 2`) for "strict monotonicity" — the cases that admit a unique inverse. Replaces inline `m === 'increasing' || m === 'decreasing'` checks.

  `Monotonicity.fromComparison(s0, s1)` is the renamed `guaranteedMonotonicityFromComparison` — returns `GuaranteedMonotonicity` (the `Constant | Increasing | Decreasing` subset) based on the comparison of two endpoint values.

  **Breaking.** Any code comparing against the old string literals (`'increasing'`, `'decreasing'`, `'constant'`, `'none'`) needs to compare against the constants (`Monotonicity.Increasing`, etc.) instead. The migration is mechanical — replace each string with the corresponding constant from the new subpath.

## 2.0.0-alpha.12

### Minor Changes

- Added `Linear2d` to the splines family — a polyline (ordered list of points) that converts to a `LinearPath2d` by joining consecutive points with straight segments. Mirrors the surface of `Basis2d` / `Bezier2d` / `Cardinal2d` / `Hermite2d`: `make`, `fromArray`, `fromTuples`, `append`, `prepend`, `toPath`. Minimum of 2 points (1 segment).

  The motivating use case is "build a polyline from a list of (x, y) values, then realize it as a path" without writing the per-segment `LinearCurve2d.fromEndpoints` boilerplate by hand:

  ```ts
  // before
  const segments: Array<LinearCurve2d> = []
  for (let i = 1; i < xs.length; i++) {
    segments.push(
      LinearCurve2d.fromEndpoints(
        Vector2.make(xs[i - 1]!, ys[i - 1]!),
        Vector2.make(xs[i]!, ys[i]!),
      ),
    )
  }
  const path = LinearPath2d.fromArray(segments)

  // after
  const path = Linear2d.fromTuples(xs.map((x, i) => [x, ys[i]!])).pipe(Linear2d.toPath)
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
    CubicPolynomial.range(c.y, Interval.unit),
  )
  // after
  Interval2d.make(CubicPolynomial.unitRange(c.x), CubicPolynomial.unitRange(c.y))
  ```

  **`Interval.containsApprox(interval, value, eps?)`** — returns `true` when `value` is in the interval or within `eps` of either boundary. Defaults `eps` to `EPSILON` (`1e-10`). Endpoint inclusivity is ignored — at the EPSILON scale the open/closed distinction loses meaning, and the use case is float-tolerant containment checks. Use `contains` for kind-strict semantics.

  ```ts
  Interval.containsApprox(Interval.make(0, 1), 1.0000000001) // true
  Interval.containsApprox(Interval.make(0, 1), 1.5) // false
  Interval.containsApprox(Interval.make(0, 1), 1.5, 1) // true (explicit eps)
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
  const flipped = Vector2.mapY(v, (y) => -y)
  const doubled = v.pipe(Vector2.mapX((x) => x * 2))
  const rotated = v.pipe(Vector2.mapTheta((t) => t + Math.PI / 2))
  const scaled = v.pipe(Vector3.mapR((r) => r * 2))
  ```

  `Vector4` still doesn't get a polar/spherical surface — no canonical 4D analog.

### Patch Changes

- Fixed `Vector3.setTheta` and `Vector3.setPhi`, which weren't holding their documented invariants.
  - `setTheta(v, theta)` was using `v.y` directly in place of the azimuthal angle, so it didn't actually preserve `phi` and produced garbage for any vector with `v.y` not coincidentally equal to its azimuthal angle in radians.
  - `setPhi(v, phi)` was rotating around the origin using `magnitude(v)` as the xy-projection length, so the result didn't lie on the original sphere — magnitude wasn't preserved.

  Both now correctly hold "change one spherical component, preserve the other two" — `setTheta` keeps `r` and `phi`, `setPhi` keeps `r` and `theta`. The fix also corrects the internal parameter names (`setTheta`'s arg was named `phi` and vice versa). Public TypeScript types are unchanged.

  `mapTheta` / `mapPhi` (added in the same release) are unaffected — they compose on top of these setters and now produce correct results automatically.

## 2.0.0-alpha.7

### Minor Changes

- 1f81e51: Added per-axis monotonicity traits and `solveAt{X,Y}` to non-rational path modules (`LinearPath2d`, `QuadraticPath2d`, `CubicPath2d`).

  **New trait brands** (in `path/traits.ts`): `MonotonicX`, `IncreasingX extends MonotonicX`, `DecreasingX extends MonotonicX`, and the y-axis counterparts. A path is `IncreasingX` when every segment's x-polynomial is strictly increasing on `[0, 1]` _and_ adjacent segments' x-ranges don't overlap (modulo `EPSILON` for float drift at joins) — together those guarantee the path's `u -> x` mapping is monotonic across the whole parameter domain.

  **New refiners and assertions** on each non-rational path: `isMonotonicX`, `isIncreasingX`, `isDecreasingX`, `isMonotonicY`, `isIncreasingY`, `isDecreasingY`, plus the `as*` throwing variants. Following the existing pattern, `IncreasingX` and `DecreasingX` both narrow to `MonotonicX` via brand intersection — so a path refined by `isIncreasingX` is accepted anywhere `MonotonicX` is required, no extra `asMonotonicX` step needed.

  **New operations**: `solveAtX` and `solveAtY` on each non-rational path, gated by the corresponding `Monotonic{X,Y}` brand. Returns `Solution.AtMostOne<number>` — locates the segment whose axis range contains the query and delegates to the curve-level solver. The monotonicity guarantee at the path level means there's at most one match across all segments. Returns `Solution.none` when the query is outside the path's range.

  ```ts
  const path = CubicPath2d.make(easingCurve).pipe(CubicPath2d.asMonotonicX)
  const yAt = CubicPath2d.solveAtX(path, 0.3) // Solution.AtMostOne<number>
  ```

  A general (non-monotonic) `solveAtX` would have unbounded cardinality (segments times per-curve roots), so it's deferred until there's a use case.

- 1f81e51: Added `fromTuple` to each vector module: `Vector2.fromTuple([x, y])`, `Vector3.fromTuple([x, y, z])`, `Vector4.fromTuple([x, y, z, w])`. The inverse of `components`, useful when interop with array-shaped data (JSON, SVG path commands, libraries that hand back tuples) would otherwise force a spread into `make`.

  ```ts
  // before
  const v = Vector2.make(...t)
  // after
  const v = Vector2.fromTuple(t)
  ```

## 2.0.0-alpha.6

### Patch Changes

- Revert the namespace + type re-export pattern at group index files (originally added in alpha.4) and the associated dts-emission pipeline change (alpha.5). The pattern crashed TypeScript in some downstream consumer setups.

  Type access reverts to the namespace-nested form:

  ```ts
  import * as Vector2 from 'curvy/vector'

  const v: Vector2.Vector2 = Vector2.make(1, 2)
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
  import { Vector2 } from 'curvy/vector'

  const v: Vector2 = Vector2.make(1, 2) // type and namespace both named Vector2
  ```

  Previously the type was only reachable as `Vector2.Vector2`, which read awkwardly. The pattern violates Effect-style purity but the ergonomic win is real. Nested types (e.g. `Vector2.Weighted`, `Cardinal2d.Options`, `Interval.Closed`) still live in their namespaces.

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

  Bezier2d.fromTuples([
    [0, 0],
    [1, 2],
    [3, 2],
    [4, 0],
  ])
  Hermite2d.fromTuples([
    [0, 0],
    [1, 1],
    [1, 0],
    [1, -1],
  ]) // alternating point/velocity
  Cardinal2d.fromTuples(
    [
      [0, 0],
      [1, 1],
      [2, 0],
    ],
    { tension: 0.5 },
  )
  Basis2d.fromTuples([
    [0, 0],
    [1, 1],
    [2, 0],
  ])
  RationalBezier2d.fromTuples([
    [0, 0, 1],
    [1, 2, 5],
    [3, 2, 5],
    [4, 0, 1],
  ]) // (x, y, weight)
  ```

  **`coefficients(p)` on every polynomial.** Returns the monomial coefficients as a typed tuple — useful for downstream consumers who want destructuring or array-style access alongside the existing `.c0`/`.c1`/etc. properties:

  ```ts
  import { CubicPolynomial } from 'curvy/polynomial'

  const [c0, c1, c2, c3] = CubicPolynomial.coefficients(p)
  ```

  Tuple arity matches the polynomial's degree (`Linear` -> `[number, number]`, etc.).

## 2.0.0-alpha.3

### Minor Changes

- **Cardinal splines now carry `tension` and `alpha` as part of the spline itself.** Previously these were "evaluation parameters" passed to `toPath` / `toBezier`. They're not — they're identity parameters of the curve: the same control points with different tensions describe different curves. The type now reflects that.

  ```ts
  import { Cardinal2d } from 'curvy/splines'

  interface Cardinal2d {
    readonly points: ReadonlyArray<Vector2>
    readonly tension: number // default 0.5
    readonly alpha: number // default 0.5
    // ...
  }
  ```

  **Constructors** support two shapes, distinguishable at the first-arg level:

  ```ts
  // Default options (centripetal Catmull-Rom, tension 0.5).
  Cardinal2d.make(p0, p1, p2, p3)

  // Explicit options first, then control points.
  Cardinal2d.make({ tension: 0.7, alpha: 0.5 }, p0, p1, p2, p3)

  // Array form with optional options.
  Cardinal2d.fromArray([p0, p1, p2, p3])
  Cardinal2d.fromArray([p0, p1, p2, p3], { tension: 0.7 })
  ```

  **Pipeable setters** for mid-stream configuration. Control points are preserved across all of these; only the named field changes:

  ```ts
  const tightened = spline.pipe(Cardinal2d.withTension(0.7))
  const uniform = spline.pipe(Cardinal2d.withAlpha(0))
  const both = spline.pipe(Cardinal2d.withOptions({ tension: 0.2, alpha: 1 }))
  ```

  `Cardinal2d.withOptions` is a partial update — omitted fields are preserved from the input.

  **`toPath` and `toBezier` are nullary now** — they read tension/alpha off the spline:

  ```ts
  spline.pipe(Cardinal2d.toPath) // before: Cardinal2d.toPath(0.5)
  spline.pipe(Cardinal2d.toBezier)
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
  import { Interval, Interval2d } from 'curvy/interval'
  import { Vector2 } from 'curvy/vector'

  const allowed = Interval2d.make(Interval.make(0, 100), Interval.make(0, 1))
  Interval2d.containsVector(allowed, Vector2.make(50, 0.5)) // true
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
  Interval2d.union(closedA, closedB) // Interval2d<Closed, Closed>
  Interval2d.union(openA, openB) // Interval2d<Open, Open>
  Interval2d.union(closedA, openB) // Interval2d<Interval, Interval>
  ```

  The runtime is genuinely kind-correct: each endpoint of the result is the extremum of the inputs', and its inclusivity follows the input that contributed it. When endpoints tie, the result is closed at that point if either input includes it.

  **`Interval.union(a, b)` — the underlying primitive.** Exposed on the interval module because it's a self-contained operation worth using on its own.

  **`boundingBox` is available on every polynomial curve and path:**

  ```ts
  import { CubicCurve2d } from 'curvy/curve'
  import { CubicPath2d } from 'curvy/path'

  CubicCurve2d.boundingBox(curve) // Interval2d<Closed, Closed>
  CubicPath2d.boundingBox(path) // Interval2d<Closed, Closed>
  ```

  Curve-level implementations account for interior extrema (so the box is tight against the curve, not just its control polygon). Path-level implementations union per-segment boxes via `Interval2d.union`.

  Rational cubic curves don't get a `boundingBox` yet — computing the bbox of `(x(t)/w(t), y(t)/w(t))` requires finding roots of a degree-5 polynomial, which is a real implementation rather than a one-liner over existing primitives. Deferred. Workaround: `RationalCubicPath2d.approximateAsCubicPath(path, tolerance).pipe(CubicPath2d.boundingBox)` produces a slightly-padded but valid outer bound.

  **New `Interval.containsInterval(outer, inner)` helper.** Kind-aware interval-subset test, the primitive underneath `Interval2d.containsInterval2d`. Exposed on the interval module because it's a self-contained operation that's useful on its own.

  **Polynomial `range` return types tightened to `Closed`.** `LinearPolynomial.range`, `QuadraticPolynomial.range`, and `CubicPolynomial.range` previously declared `Interval` returns but always built `Closed` at runtime. The tightening lets `boundingBox` thread `Interval2d<Closed, Closed>` through without casts. Also fixes a latent bug in `LinearPolynomial.range` where decreasing polynomials would throw on `Interval.make`'s ordering check — now uses `fromMinMax`.

## 2.0.0-alpha.1

### Minor Changes

- **New `curvy/box` module + `boundingBox` on every curve and path.** A `Box2d` is the Cartesian product of two intervals — the smallest abstraction that lets you say "is this curve inside this region?" without dragging in a richer rectangle/transform abstraction.

  ```ts
  import { Box2d } from 'curvy/box'
  import { Interval } from 'curvy/interval'
  import { Vector2 } from 'curvy/vector'

  const allowed = Box2d.make(Interval.make(0, 100), Interval.make(0, 1))
  Box2d.containsVector(allowed, Vector2.make(50, 0.5)) // true
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
  import { CubicCurve2d } from 'curvy/curve'
  import { CubicPath2d } from 'curvy/path'

  CubicCurve2d.boundingBox(curve) // Box2d<Closed, Closed>
  CubicPath2d.boundingBox(path) // Box2d<Closed, Closed> — union over segments
  ```

  The curve-level implementations account for interior extrema (so the box is tight against the curve, not just its control polygon). The path-level implementations union per-segment boxes via `Box2d.union`.

  Rational cubic curves don't get a `boundingBox` yet — computing the bbox of `(x(t)/w(t), y(t)/w(t))` requires finding roots of a degree-5 polynomial, which is a real implementation rather than a one-liner over existing primitives. Deferred to a later pass.

  **New `Interval.containsInterval(outer, inner)` helper.** Kind-aware interval-subset test, the primitive underneath `Box2d.containsBox`. Exposed on the interval module because it's a self-contained operation that's useful on its own.

  **Polynomial `range` return types tightened to `Closed`.** `LinearPolynomial.range`, `QuadraticPolynomial.range`, and `CubicPolynomial.range` previously declared `Interval` returns but always built `Closed` at runtime. The tightening lets `boundingBox` thread `Box2d<Closed, Closed>` through the type system without casts. Also fixes a latent bug in `LinearPolynomial.range` where decreasing polynomials (where `solve(p, start) > solve(p, end)`) would throw on the `Interval.make` ordering check — now uses `fromMinMax`.

## 2.0.0-alpha.0

### Major Changes

- 39d3758: **New `curvy/characteristic` module.** The characteristic matrices that identify each cubic spline family now live in a shared module rather than being scattered across the spline modules.

  ```ts
  import { Characteristic } from 'curvy/characteristic'

  Characteristic.cubicBezier // Matrix4x4 — was Bezier2d.characteristic
  Characteristic.cubicHermite // Matrix4x4 — was Hermite2d.characteristic
  Characteristic.cubicBasisSpline // Matrix4x4 — was Basis2d.characteristic
  Characteristic.cubicCardinal // (tension: number) => Matrix4x4 — was Cardinal2d.characteristic
  Characteristic.cubicCatmullRom // Matrix4x4 — was Cardinal2d.catRomCharacteristic
  ```

  **The per-spline `characteristic` exports are removed.** Update imports to pull from the new module. The runtime values are unchanged; only the import path moves. `Cardinal2d.catRomCharacteristic` similarly moves to `Characteristic.cubicCatmullRom`.

  **New `Characteristic.apply` helper.** Applies a characteristic matrix to N channels of control values, producing N cubic polynomials in monomial form. This is the operation Freya Holmér describes in _The Continuity of Splines_ — the matrix IS the spline, and `apply` is the canonical way to combine it with control points to produce a polynomial.

  ```ts
  import { Characteristic } from 'curvy/characteristic'
  import { Vector4 } from 'curvy/vector'

  // Polynomial 2D spline: two channels (x, y)
  const [x, y] = Characteristic.apply(
    Characteristic.cubicBezier,
    Vector4.make(p0.x, p1.x, p2.x, p3.x),
    Vector4.make(p0.y, p1.y, p2.y, p3.y),
  )

  // Rational 2D spline: same matrix, three channels (x, y, w)
  const [x, y, w] = Characteristic.apply(
    Characteristic.cubicBezier,
    Vector4.make(p0.x * p0.weight, p1.x * p1.weight, p2.x * p2.weight, p3.x * p3.weight),
    Vector4.make(p0.y * p0.weight, p1.y * p1.weight, p2.y * p2.weight, p3.y * p3.weight),
    Vector4.make(p0.weight, p1.weight, p2.weight, p3.weight),
  )
  ```

  The polynomial pipeline (`CubicCurve2d.fromBezierPoints`, `splines/util.ts -> toCurves`) and the rational pipeline (`RationalCubicCurve2d.fromBezierPoints`) both flow through `apply` now — the unified entry point makes the spline-family-as-matrix story visible at the type level.

  **Cardinal cache moved.** The per-tension memoization that used to live in `Cardinal2d` now lives inside `Characteristic.cubicCardinal`. Behavior unchanged.

- b99c3bf: Sweep the `from*` constructor surface for naming coherence. The library accumulated several inconsistencies organically; v2 lands one rule per verb: `make` is the primary variadic constructor, `fromArray` is its array form, `fromXxx` is for genuinely-from-X semantic constructors named for what their inputs represent.

  **Renames (curve modules):** `LinearCurve2d.fromPoints`, `QuadraticCurve2d.fromPoints`, `CubicCurve2d.fromPoints` -> `fromCoefficients`. The old name was a misnomer — the function takes `Vector2`s but stores them as polynomial coefficient bundles, not as points on the curve. The new name is honest about that.

  ```ts
  // before
  CubicCurve2d.fromPoints(c0, c1, c2, c3) // Vector2s = polynomial coefficients
  // after
  CubicCurve2d.fromCoefficients(c0, c1, c2, c3)
  ```

  **Renames (path modules):** `LinearPath2d`, `QuadraticPath2d`, `CubicPath2d` switch from `fromCurves` / `fromCurveArray` to `make` / `fromArray`, matching every spline module's `make` + `fromArray` convention.

  ```ts
  // before
  CubicPath2d.fromCurves(c0, c1)
  CubicPath2d.fromCurveArray([c0, c1])
  // after
  CubicPath2d.make(c0, c1)
  CubicPath2d.fromArray([c0, c1])
  ```

  **Removed (Bézier conversion primitive):** `Bezier2d.fromSpline` is now package-private. Its only callers were the other splines' own `toBezier` methods, and SVG path serialization (which now lives in core, not a separate package). End users should reach for `Cardinal2d.toBezier`, `Hermite2d.toBezier`, or `Basis2d.toBezier` rather than constructing a basis-conversion call by hand.

  **New (curve modules):** `LinearCurve2d.fromBezierPoints`, `QuadraticCurve2d.fromBezierPoints`, `CubicCurve2d.fromBezierPoints` — closed-form Bernstein-basis to monomial conversion. Constructs a single curve from real Bézier control points without the round-trip through `Bezier2d` + `toPath`. For cubics, `p0` and `p3` are the curve's endpoints and `p1`, `p2` are off-curve control handles; for quadratics, `p1` is the single control handle; for the linear case, `p0` and `p1` are the endpoints.

  ```ts
  const c = CubicCurve2d.fromBezierPoints(
    Vector2.make(0, 0),
    Vector2.make(1, 0),
    Vector2.make(1, 1),
    Vector2.make(0, 1),
  )
  ```

  **New (polynomial modules):** `QuadraticPolynomial.fromPoints` and `CubicPolynomial.fromPoints` — Lagrange interpolation through 3 and 4 `(x, y)` points, completing the symmetry with `LinearPolynomial.fromPoints` (which already existed). Implementation uses Newton's divided differences collected to monomial form. The input `x` values must be distinct.

  ```ts
  // y = x^2 + 2x + 3
  const p = QuadraticPolynomial.fromPoints(
    Vector2.make(-1, 2),
    Vector2.make(0, 3),
    Vector2.make(1, 6),
  )
  ```

  **Renamed (matrix module):** `Matrix3x3.matrix3x3` -> `Matrix3x3.make`. The `Matrix2x2` and `Matrix4x4` modules already used `make`; only `Matrix3x3` had the type-name-as-constructor variant, breaking symmetry across the matrix family.

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

  The four per-edge modifiers narrow the result type via overloads (e.g. `toStartOpen(Closed) -> OpenStart`, `toStartOpen(OpenEnd) -> Open`).

  **Predicates.** Four variant-narrowing (`isClosed`, `isOpen`, `isOpenStart`, `isOpenEnd`) plus four edge-narrowing (`isOpenAtStart`, `isOpenAtEnd`, `isClosedAtStart`, `isClosedAtEnd`).

  **Equality.** `equals` now compares both endpoints AND kind — `[0, 1]` and `[0, 1)` are no longer equal. New `aligned` provides the looser numeric-range comparison (`Bounds`-typed) for the previous behavior.

  **`unit` and `biunit`** are now typed as `Closed`, not the broader `Interval`. **New `unitOpen`**: the open unit interval `(0, 1)` — the symmetric open counterpart to `unit`, useful for strict-interior filtering (e.g. clipping polynomial roots that must lie strictly inside `[0, 1]`).

  ```ts
  // Before
  Interval.contains(i, x, { includeStart: false, includeEnd: false })

  // After
  Interval.contains(Interval.toOpen(i), x)
  // or construct directly:
  Interval.contains(Interval.makeOpen(0, 1), x)
  ```

  **`Solution.filterInterval` is renamed to `Solution.clip`** and loses its options arg. Pass an interval of the kind you want:

  ```ts
  // Before
  Solution.filterInterval(s, Interval.unit, {
    includeStart: false,
    includeEnd: false,
  })

  // After
  Solution.clip(s, Interval.toOpen(Interval.unit))
  // or use the new constant:
  Solution.clip(s, Interval.unitOpen)
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
  import * as Vector2 from 'curvy/vector2'
  import * as CubicCurve2d from 'curvy/curve/cubic2d'
  import * as RationalCubicPath2d from 'curvy/path/rationalCubic2d'
  import * as Bezier2d from 'curvy/splines/bezier2d'

  // after
  import { Vector2 } from 'curvy/vector'
  import { CubicCurve2d, RationalCubicCurve2d } from 'curvy/curve'
  import { RationalCubicPath2d } from 'curvy/path'
  import { Bezier2d } from 'curvy/splines'
  ```

  The internal namespace identity (`Vector2.make`, `CubicCurve2d.solve`, etc.) is unchanged — only the path you import from moves. Tree-shaking remains intact: importing one namespace from a group index does not pull in its siblings, given `"sideEffects": false`.

  **Solo namespaces (`Interval`, `Solution`, `Characteristic`) now exported through wrappers.** These were previously bare-module subpaths. Each now lives in a directory whose `index.ts` re-exports the implementation as a namespace, so the import shape matches the multi-namespace groups:

  ```ts
  // before
  import * as Interval from 'curvy/interval'
  import * as Solution from 'curvy/solution'
  import * as Characteristic from 'curvy/characteristic'

  // after
  import { Interval } from 'curvy/interval'
  import { Solution } from 'curvy/solution'
  import { Characteristic } from 'curvy/characteristic'
  ```

  **New `curvy/number` module.** The math utilities (`lerp`, `clamp`, `round`, `epsEquals`, etc.) move out of `curvy/utils` into a dedicated module. The grouping reflects what each is for: `curvy/utils` is now language plumbing every other module needs (`pipe`, `dual`, `Pipeable`, `invariant`); `curvy/number` is numeric utilities.

  ```ts
  // before
  import { lerp, clamp, epsEquals } from 'curvy/utils'

  // after
  import { lerp, clamp, epsEquals } from 'curvy/number'
  ```

  **`curvy/pipe` removed.** `pipe`, `dual`, and `Pipeable` move into `curvy/utils` alongside `invariant`. The `curvy/pipe` subpath is gone.

  ```ts
  // before
  import { dual, pipe, Pipeable } from 'curvy/pipe'
  import { invariant } from 'curvy/utils'

  // after
  import { dual, pipe, Pipeable, invariant } from 'curvy/utils'
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

  Performance: removing constructor-level rounding makes a realistic workflow (build a 4-segment Bezier path, sample 1000 points) about **2x faster**; `Matrix4x4.make` is **~17x faster**; `CubicCurve2d.length` is **~1.8x faster**.

- 6e3087e: Rename `Bezier2d.appendCurvatureMirrored` to `Bezier2d.appendCurvatureAligned` for consistency with the rest of the `*Aligned` family (`appendTangentAligned`, `appendVelocityAligned`, `appendAccelerationAligned`). The internal binding was already named `appendCurvatureAligned`; this aligns the public surface.
- eb48939: Replace the bare `ZeroOrOne<T>` / `ZeroToOne<T>` / `ZeroToTwo<T>` / `ZeroToThree<T>` return shapes with a single `Solution<T>` type and namespace, exposed at `curvy/solution`.

  Each variant is a small tagged object with named accessors. `One<T>` exposes `.value: T`; `Two<T>` and `Three<T>` expose `.values: readonly [T, T]` / `readonly [T, T, T]`. All variants have a `_tag` discriminator and a `length` field, are iterable via `Symbol.iterator`, and are `Pipeable` — so a `Solution` can sit at the head of a `pipe(...)` chain. Existing iteration patterns (`for..of`, spread, `result.length`) keep working without any adapter; what's new is the named-accessor ergonomics and a small operations API.

  **Type aliases:**

  ```ts
  import { Solution } from 'curvy/solution'

  Solution.None // { _tag: 'none', length: 0, ...iterable }
  Solution.One<T> // { _tag: 'one', length: 1, value: T, ...iterable }
  Solution.Two<T> // { _tag: 'two', length: 2, value: T, values: readonly [T, T], ...iterable }
  Solution.Three<T> // { _tag: 'three', length: 3, value: T, values: readonly [T, T, T], ...iterable }
  Solution.Some<T> // One | Two | Three — every Some<T> exposes `.value: T`
  Solution<T> // None | Some<T> — most permissive

  // At-most aliases for trait-narrowed return shapes
  Solution.AtMostOne<T> // None | One<T>
  Solution.AtMostTwo<T> // None | One<T> | Two<T>
  Solution.AtMostThree<T> // = Solution<T>
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
  const t = LinearPolynomial.solveInverse(p, 5)
  if (t === null) {
    /* constant polynomial */
  } else {
    use(t)
  }

  // after — direct narrowing
  const t = LinearPolynomial.solveInverse(p, 5)
  if (Solution.isSome(t)) {
    use(t.value) // .value is type-safe under Some<T>
  }

  // after — pattern match
  const result = LinearPolynomial.solveInverse(p, 5).pipe(
    Solution.match({
      onNone: () => 0,
      onSome: ({ value }) => value * 2,
    }),
  )
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
  import * as Path from '@curvy/svg/path'
  import * as Bezier2d from 'curvy/splines/bezier2d'

  const d = Bezier2d.make(p0, p1, p2, p3).pipe(Path.fromBezier2d, Path.render)

  // after
  import { CubicPath2d } from 'curvy/path'
  import { Bezier2d } from 'curvy/splines'

  const d = Bezier2d.make(p0, p1, p2, p3).pipe(Bezier2d.toPath, CubicPath2d.toPathData)
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

  For quadratic and cubic polynomials, all of the above accept an optional `Interval` argument (a quadratic with c2 != 0 isn't globally monotonic, but it can be on an interval that avoids its extremum).

  `solveInverse` is overloaded so that a `Monotonic`-branded polynomial returns a tighter shape:

  | Polynomial                       | Plain return                   | `Monotonic` return |
  | -------------------------------- | ------------------------------ | ------------------ |
  | `LinearPolynomial<Monotonic>`    | `ZeroOrOne` (`number \| null`) | `number`           |
  | `QuadraticPolynomial<Monotonic>` | `ZeroToTwo`                    | `ZeroToOne` (new)  |
  | `CubicPolynomial<Monotonic>`     | `ZeroToThree`                  | `ZeroToOne`        |

  ```ts
  const p = LinearPolynomial.make(0, 2) // LinearPolynomial<unknown>
  const inv = LinearPolynomial.solveInverse(p, 4) // ZeroOrOne
  if (LinearPolynomial.isMonotonic(p)) {
    // p is now LinearPolynomial<Monotonic>
    const tight = LinearPolynomial.solveInverse(p, 4) // number — null branch eliminated
  }
  ```

  **Curves.** `LinearCurve2d`, `QuadraticCurve2d`, and `CubicCurve2d` are now generic over per-axis trait sets: `LinearCurve2d<out XTraits = unknown, out YTraits = unknown>`. The two parameters track the trait sets of the curve's x and y polynomials independently — useful for asymmetric properties like "monotonic in x, anything in y" (an easing function / function-of-x curve).

  Per-axis refiners (`isMonotonicX`, `isMonotonicY`, `isIncreasingX`, `isIncreasingY`, `isDecreasingX`, `isDecreasingY`) and a combined `isMonotonic` that requires both axes monotonic. All check over the curve's natural parameter domain `[0, 1]`. Assertions follow the same `as*` naming.

  **Paths.** `LinearPath2d`, `QuadraticPath2d`, and `CubicPath2d` are now generic: `<out Trait = unknown>`. One brand is shipped:
  - `Continuous` — adjacent curves connect at their join points (G^0)

  Each path module exposes `isContinuous` and `asContinuous`. Splines emit continuous paths by construction, so `Bezier2d.toPath`, `Cardinal2d.toPath`, etc. all produce paths that pass `isContinuous`.

  **Variance.** All trait parameters are declared with the TS 4.7+ `out` covariance modifier. This means a `CubicPolynomial<Monotonic>` is assignable to a `CubicPolynomial<unknown>` (drop traits going up the lattice), and TypeScript will refuse a future change that introduces a contravariant use of the trait parameter.

  **Behavior change:** `monotonicity()` over a zero-width interval now throws (`monotonicity is undefined over a zero-width interval`) instead of returning `'constant'`. The previous return value conflated "polynomial is structurally constant" with "you queried at a single point" — only the former is a meaningful property of the polynomial. The runtime `Monotonicity` enum still has `'constant'` as a value for the structural case.

### Minor Changes

- 55714cf: Added **`CubicPath2d.solveByDistance(path, s): Vector2`** for sampling a path by normalized arc length (`s in [0, 1]`).

  Unlike `solve`, which is parameterized by curve `u`, `solveByDistance` returns points at constant speed along the path — `s = 0.5` is the actual arc-length midpoint regardless of how the underlying parameterization stretches. This is the primitive most motion-design and animation use cases actually want from a curve library.

  Available in both data-first and data-last forms. Internally caches cumulative segment lengths by path identity (paths are immutable), so repeated calls on the same path skip the length-table rebuild. Within each segment, the local parameter is found via Newton's method on the curve's analytic derivative, with bracket-clamped fallback to bisection for cusps and pathological convergence.

- 55714cf: Added **`Bezier2d.subdivide(b, u): [Bezier2d, Bezier2d]`** for splitting a multi-segment cubic Bezier at a global parameter `u in (0, 1)` via de Casteljau's algorithm. The two halves together trace the same curve as the input — the left covers `[0, u]`, the right covers `[u, 1]`.

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
    Vector2.make(1, 1),
  )

  if (CubicCurve2d.isMonotonic(easing)) {
    // both axes monotonic — solveAtX returns ZeroToOne
    const [y] = CubicCurve2d.solveAtX(easing, 0.5)
  }
  ```

  This is the "function-of-x" / easing-curve use case the trait system was designed around: when both axes are monotonic, the curve becomes invertible in either direction and the type system reflects that.

  **Bug fixes shipped alongside:** `QuadraticPolynomial.solveInverse` now correctly handles the `c2 = 0` case (degenerate quadratic — defers to linear) instead of dividing by zero. `CubicPolynomial.solveInverse` had a similar fallback that was forwarding `0` as the y-value instead of the actual argument; now forwards correctly. Both bugs were latent because `solveInverse` was rarely exercised on degenerate-degree polynomials before `solveAt{X,Y}` started routing through them.

- 55714cf: Added three new `Matrix4x4` primitives:
  - **`Matrix4x4.identity`** — the 4x4 identity matrix as a constant.
  - **`Matrix4x4.multiply(a, b)`** — matrix-matrix multiplication, in both data-first and data-last forms.
  - **`Matrix4x4.inverse(m)`** — matrix inverse via the adjugate / determinant formula. Throws on singular input (determinant zero).

  These are useful both as general-purpose 4x4 transform primitives and as the foundation for the new spline-conversion caching that ships in this release.

- **Approximate rational cubic curves as polynomial cubic paths.** Rational curves can't be converted exactly to polynomial Béziers — that's the entire reason rational forms exist (true circles, conic sections, etc.). But they _can_ be approximated to arbitrary tolerance via recursive subdivision, which is what PDF and SVG renderers do internally.

  Two new operations, both at the curve and path level:

  ```ts
  import { RationalCubicCurve2d } from 'curvy/curve'
  import { RationalCubicPath2d } from 'curvy/path'

  // Curve-level: returns ReadonlyArray<CubicCurve2d>
  RationalCubicCurve2d.approximateAsCubicCurves(rationalCurve, tolerance)

  // Path-level: returns CubicPath2d
  RationalCubicPath2d.approximateAsCubicPath(rationalPath, tolerance)
  ```

  For each segment a polynomial-cubic candidate is built by projecting the four homogeneous Bézier control points back to 2D; if the midpoint deviates from the true rational by more than `tolerance`, the segment is split at `t = 0.5` and the procedure recurses on each half. Endpoints and endpoint tangent directions are preserved exactly. For a uniform-weight curve the result is a single exact segment.

  **New `CubicPolynomial.subdivide(p, t)`.** General de Casteljau-equivalent subdivision in monomial form. Returns `[left, right]` where the left half's evaluation on `[0, 1]` matches the input's on `[0, t]`, and the right half matches on `[t, 1]`. Available data-first and data-last.

  ```ts
  import { CubicPolynomial } from 'curvy/polynomial'

  const [left, right] = CubicPolynomial.subdivide(p, 0.5)
  ```

  Used internally by the rational approximation but exposed as a primitive because it's the natural building block for any subdivision-based algorithm over cubic polynomials.

- **Rational cubic curves, paths, and splines.** A new `RationalCubicCurve2d` lives in `curvy/curve`, alongside the existing polynomial cubic. It stores the curve as three monomial polynomials `x(t)`, `y(t)`, `w(t)` and evaluates as `(x(t)/w(t), y(t)/w(t))` — the projection from homogeneous coordinates back to the plane. With uniform weights the curve degenerates to a polynomial cubic.

  ```ts
  import { RationalCubicCurve2d } from 'curvy/curve'
  import { Vector2 } from 'curvy/vector'

  // Four weighted Bézier control points; the matrix-based constructor
  // lifts them to homogeneous (w*x, w*y, w) and runs the same characteristic
  // matrix the polynomial pipeline uses, just on three channels.
  const c = RationalCubicCurve2d.fromBezierPoints(
    Vector2.makeWeighted(0, 0, 1),
    Vector2.makeWeighted(1, 2, 5),
    Vector2.makeWeighted(2, 2, 5),
    Vector2.makeWeighted(3, 0, 1),
  )
  RationalCubicCurve2d.solve(c, 0.5) // -> Vector2
  ```

  A matching path type (`RationalCubicPath2d` in `curvy/path`) and spline type (`RationalBezier2d` in `curvy/splines`) follow the same shape as their polynomial counterparts, with `solve`, `solveAtX`, `solveAtY`, and the standard pipeable API.

  **Per-axis monotonicity traits live on the curve, not the polynomials.** Unlike `CubicCurve2d` where the trait brand flows through to the underlying polynomial, rational traits are properties of the projected rational functions `x(t)/w(t)` and `y(t)/w(t)` — not of any individual polynomial. The brand therefore lives on the curve itself via a phantom property, and `RationalCubicCurve2d<XTraits, YTraits>` carries `Increasing` / `Decreasing` / `Monotonic` exactly like the polynomial curve does.

  **`makeMonotonicEasing(startSlope, endSlope)`.** A Gregory-Delbourgo style constructor for a guaranteed-monotone rational cubic easing curve. Interpolates `(0, 0)` and `(1, 1)` with the given endpoint slopes, pins `x(t) = t`, and returns a curve branded `<Increasing, Increasing>` so `solveAtX` narrows to `Solution.AtMostOne<number>` without runtime checking. Smoothstep falls out from `(0, 0)` and linear easing from `(1, 1)`.

  ```ts
  const ease = RationalCubicCurve2d.makeMonotonicEasing(0.5, 1.5)
  const result = RationalCubicCurve2d.solveAtX(ease, 0.5)
  // result: Solution.AtMostOne<number> — narrowed by the Increasing brand
  ```

  Monotonicity is verified rigorously at construction by computing the derivative numerator as a cubic in `t` and checking it doesn't change sign on `(0, 1)`. Construction throws when the slope pair can't be made monotonic under the default `alpha = m0 + 1`, `beta = m1 + 1` heuristic — useful operating range is roughly `m0, m1 in [0, 2]` with `m0 + m1` below about `3`.

### Patch Changes

- 55714cf: TypeScript declarations are now published as `.d.mts` rather than `.d.ts`, matching the ESM-only `.mjs` artifact convention. The `package.json` `exports` field has been updated accordingly, so consumers using modern TypeScript (5+) with `moduleResolution: "node16"`, `"nodenext"`, or `"bundler"` see no change — types resolve through `exports` like before.

  Two scenarios where this is observable:
  - **Deep imports past `exports`** (e.g. `import 'curvy/dist/vector/vector2.d.ts'`) will break — those file paths no longer exist. This was already unsupported, but worth flagging.
  - **Older TypeScript or non-`exports`-aware tooling** that fell back to `.d.ts` lookup by extension may need updating to a version that honors `exports`.

  This change ships alongside the build-tool migration from `unbuild` to `tsdown`. Sourcemaps for declarations are also now emitted (`.d.mts.map`), which `unbuild` did not produce.

- 55714cf: Internal: rewrote `dual()`'s per-arity hot paths to read `arguments.length` and `arguments[i]` directly from a regular `function` body, instead of unpacking `...args` rest-parameters into an array. V8 keeps `arguments` virtualized when only `length` and indexed access are used, so the hot path no longer allocates an array per call.

  No API change; `dual()`'s signatures and overload semantics are unchanged. Realistic-workflow benchmark (build a 4-segment Bezier path + 1000 samples) is **~43% faster**, and `CubicCurve2d.solve` is **~18% faster**, both because they go through `dual` repeatedly in their hot loops. Operations that don't use `dual` (like `Matrix4x4.make`) are unaffected, as expected.

- 55714cf: The Bézier basis-conversion routine that backs `Cardinal2d.toBezier`, `Hermite2d.toBezier`, and `Basis2d.toBezier` now caches the combined conversion matrix (`M_bezier^-1 * M_source`) per source-matrix instance via a `WeakMap`, replacing a per-call run of Cramer's rule with a single matrix-vector product per axis per quad. `Cardinal2d.characteristic(scale)` also memoizes its result by scale value, so repeated `Cardinal2d.toBezier(p, customScale)` calls hit the cache instead of constructing a fresh matrix each time.

  No API change. **`Cardinal2d.toBezier` is ~85x faster** (~9k -> ~800k ops/sec for both default and custom scales). The same caching applies to every other non-Bézier spline type's `toBezier` path.

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
