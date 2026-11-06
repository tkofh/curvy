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
`(x, y)` maps as the column `(x, y, 1)`.

## Composition

`andThen(a, b)` applies `a` first and `b` second, for `Affine2d` and
`Rotation3d` alike. On column vectors that is the product `b * a`, and
`a.pipe(andThen(b))` reads in the order the transforms apply.

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
its two vectors.

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
