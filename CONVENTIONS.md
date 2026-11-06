# Conventions

The geometric conventions every curvy module follows: how vectors and
transforms compose, which way positive angles turn, and how 3D rotations are
stored. [PRECISION.md](./PRECISION.md) is the numerical contract, and this
document is the geometric one. If a behavior contradicts this document, one
of the two is a bug.

## Vectors and matrices

Points and directions are **column vectors**. A matrix acts on a vector by
`M * v`, which `Matrix3x3.vectorProductLeft` and `Matrix4x4.vectorProductLeft`
compute.

Matrices are constructed row by row. `Matrix3x3.make(m00, m01, m02, m10, ...)`
lists the first row first, and the field `m12` is row 1, column 2.

`Affine2d` stores a 3x3 matrix in homogeneous form. Its bottom row is
`[0, 0, 1]`, and its translation sits in the last column, so a point
`(x, y)` maps as the column `(x, y, 1)`. `Affine3d` does the same with a
4x4 matrix whose bottom row is `[0, 0, 0, 1]`.

Points, directions, and normals transform differently:

- `apply` maps a point, translation included.
- `applyDirection` maps a direction (a tangent, an edge, a difference of
  points) by the linear part alone.
- `applyNormal` maps a normal by the inverse transpose of the linear part,
  then normalizes it. Under a non-uniform scale or a shear this is the
  only map that keeps the normal perpendicular to the surface.

## Composition

`andThen(a, b)` applies `a` first and `b` second, for `Affine2d` and
`Rotation3d` alike. On column vectors that is the product `b * a`, and
`a.pipe(andThen(b))` reads in the order the transforms apply.

`Affine3d.compose` assembles a transform from parts in a fixed order:
scale, then shear, then rotation, then translation. Its linear part is
`rotation * shear * scale`. `Affine3d.decompose` splits a transform back
into those parts. It puts all of the shear in the coefficients `xy`, `xz`,
and `yz`. A transform that mirrors space gets a negative `x` scale, since a
rotation can't mirror.

The raw products keep the mathematical order. `Matrix3x3.multiply(a, b)` and
`Quaternion.multiply(a, b)` both compute `a * b`, which applies `b` first.

## Angles

Angles are in radians everywhere.

**In the plane**, a positive angle turns `+x` toward `+y`. `Affine2d.rotate`,
`Vector2.fromPolar`, and `Arc` sweeps all follow it. With the SVG y axis
pointing down, that turn looks clockwise on screen, and the coordinates
module's `Winding` calls it `'clockwise'`. On a plot with y pointing up, the
same turn looks counterclockwise. `Polygon2d.signedArea` is positive for
vertices that turn this way.

**In space**, a positive angle turns by the right-hand rule. With the right
thumb along the axis, the fingers curl the positive way:

- about `+x`, `+y` turns toward `+z`
- about `+y`, `+z` turns toward `+x`
- about `+z`, `+x` turns toward `+y`

A rotation about `+z` acts on the `x` and `y` components exactly as the
plane rotation does.

## Handedness

The formulas don't depend on handedness. `Vector3.cross(unitX, unitY)` is
`unitZ` by definition, and every rotation formula follows from the rules
above. Handedness describes how a drawing of the axes looks: a right-handed
picture with `+x` to the right and `+y` up puts `+z` toward the viewer.

curvy gives the axes no meaning such as up or forward. An operation that
needs a direction takes it as an argument, the way `Rotation3d.between` takes
its two vectors, or takes a `Frame3d` that names the directions.

## Frames

A `Frame3d` names three perpendicular unit directions: `up` and `forward`
as given, and `right = cross(forward, up)`. `right` is the right-hand side
of someone standing along `up` and facing `forward`. A camera looking down
`-z` with `+y` up has `right = +x`. A character facing `+z` with `+y` up
has `right = -x`, its own right as it faces the viewer.

Yaw, pitch, and roll are each defined as turning one frame direction toward
another, which needs no appeal to handedness:

- a positive yaw turns `forward` toward `right`, about `up`
- a positive pitch turns `forward` toward `up`, about `right`
- a positive roll turns `up` toward `right`, about `forward`

These are the aircraft conventions: nose right, nose up, right wing down.
`Frame3d.fromYawPitchRoll` applies them in that order, each about the axes
the previous turns left behind. `Frame3d.lookRotation` turns `forward` onto
a target direction and keeps `up` as close to a hint as it can, so looking
around never rolls.

## Planes and faces

A `Plane3d` is the set of points `p` with `dot(normal, p) = offset`, where
`normal` is a unit vector. The normal picks a side. The **front** is the
side it points toward, where `signedDistance` is positive. Clipping keeps
the front, in 2D and 3D alike: `Polygon2d.clip` keeps the side its normal
points toward, and `Polygon3d.clip` keeps a plane's front. Flip the plane
to keep the back.

A polygon's normal follows the right-hand rule. For a triangle
`(a, b, c)` it is `cross(b - a, c - a)`, normalized, and `Plane3d.through`
and `Polygon3d.normal` agree on it. A solid's faces listed
counterclockwise from outside, in the usual right-handed picture, have
outward normals, and their planes face out of the solid.

A `ConvexPolyhedron` is the region behind every one of its planes: each
half-space it is built from is the back side of a plane facing out of the
solid. Its faces run counterclockwise seen from outside.

Under a transform that mirrors space, a plane's front maps to the image's
front, so `Plane3d.transform` keeps outward planes outward. A polygon's
vertex order doesn't change under a mirror, so its normal turns inward.
`Polygon3d.reverse` turns it back, and `ConvexPolyhedron.transform`
reverses its faces itself.

## Quaternions

Quaternions follow Hamilton's convention, `i^2 = j^2 = k^2 = i*j*k = -1`, and
are stored as `(x, y, z, w)` with the scalar part `w` last.

- The rotation by `angle` about the unit axis `n` is the quaternion
  `(n * sin(angle / 2), cos(angle / 2))`.
- Rotating a vector `v` computes `q * v * conjugate(q)`, with `v` read as the
  quaternion `(v, 0)`.
- `q` and `-q` represent the same rotation. Operations never pick a sign for
  you. `Rotation3d.equals` compares up to sign, and `slerp`, `nlerp`, and
  `angleBetween` take the shorter of the two paths the signs allow.

`Rotation3d` is the concept type for rotations, and every operation that
reads a rotation also accepts a `Quaternion<Unit>`. What the `Unit` brand
promises is in [PRECISION.md](./PRECISION.md#what-the-brands-guarantee).

## Euler angles

`Rotation3d.fromEuler` and `toEuler` describe a rotation as three angles
about the coordinate axes. The component `angles.x` is always the angle about
X, whatever the order.

The `EulerOrder` string names the factors of a matrix product from left to
right. `'YXZ'` is `Ry * Rx * Rz`. Read with moving axes, it rotates about Y,
then about the rotated X, then about the twice-rotated Z. Read with fixed
axes, it applies Z first, then X, then Y. three.js uses the same convention,
and the default order is `'XYZ'` in both.

`toEuler` returns the middle angle in `[-pi/2, pi/2]` and the outer two in
`[-pi, pi]`. At the middle angle's extremes the first and third axes line up
(gimbal lock), and only their combined turn is determined. There `toEuler`
sets the third angle to `0` and puts the whole turn in the first.

## Cameras

A `Camera` maps world points to an SVG viewport, where y points down. The
camera's `frame` names its directions: `forward` points from the eye toward
the target, and `right = cross(forward, up)` as for any frame. The frame's
`up` lands toward the top of the viewport and its `right` toward the right,
so a scene modeled with `+y` up appears upright.

`Camera.view` maps world points to eye space, the OpenGL convention: the eye
at the origin, `right` along `+x`, `up` along `+y`, and the view down `-z`.
That keeps the view a rigid transform. A projected point's `depth` is its
distance in front of the eye along the view direction, the negative of its
eye-space z. Depth is linear in world units, not the nonlinear depth a GPU
stores, so it sorts faces directly.

A face whose normal points toward the camera projects with `Winding`
`'counterclockwise'`, so the projected winding is the back-face test.

A perspective camera projects only points between its near and far planes.
An orthographic camera projects every point up to its far plane, including
points behind the eye. A camera built without a far distance has its far
plane at infinity.
