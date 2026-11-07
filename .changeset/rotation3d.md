---
'curvy': minor
---

**3D rotations and frames.** `curvy/transform` adds `Rotation3d`, a rotation about an axis through the origin stored as a unit quaternion, and `Frame3d` for yaw, pitch, and roll. The new `curvy/quaternion` module holds the algebra underneath, with a `Unit` brand for the quaternions that represent rotations. Every `Rotation3d` operation that reads a rotation also accepts a `Quaternion<Unit>`.

`Rotation3d` builds rotations from an axis and angle (`fromAxisAngle`, `aboutX`, `aboutY`, `aboutZ`), from one direction to another (`between`), from Euler angles (`fromEuler`, with three.js-style `EulerOrder` strings), from a quaternion, or from a `Matrix3x3` (`fromMatrix3x3`, which returns `none` for a matrix that scales, shears, or reflects). It applies with `apply` and its curried `applyTo`, composes with `andThen(a, b)` (first `a`, then `b`), and inverts with `inverse`. `toMatrix3x3`, `toAxisAngle`, and `toEuler` convert out. `slerp` and `nlerp` interpolate along the shorter path. `angleBetween` and `equals` compare as rotations, so `q` and `-q` are equal. `swingTwist(r, axis)` splits a rotation into a twist about an axis and a swing that moves the axis.

`Quaternion` covers `make`, `identity`, `multiply`, `conjugate`, `inverse`, `dot`, `magnitude`, `equals`, `normalize`, and the `isUnit`/`asUnit` refiners.

`Frame3d.make({ up, forward })` names an object's up and forward directions, which must be perpendicular, and derives `right` as `cross(forward, up)`. `fromYawPitchRoll` and `toYawPitchRoll` convert between a `Rotation3d` and aircraft-style angles: positive yaw turns `forward` toward `right`, positive pitch turns it toward `up`, and positive roll turns `up` toward `right`. `lookRotation(frame, direction, up?)` faces a direction without rolling.

```ts
const body = Frame3d.make({ up: Vector3.unitY, forward: Vector3.unitZ })
body.right // Vector3(-1, 0, 0)

const turned = Frame3d.fromYawPitchRoll(body, { yaw: Math.PI / 2 })
Rotation3d.apply(turned, body.forward) // Vector3(-1, 0, 0), up to rounding
```

[CONVENTIONS.md](https://github.com/tkofh/curvy/blob/main/CONVENTIONS.md) records composition order, the right-hand rule, Euler orders, and frames.
