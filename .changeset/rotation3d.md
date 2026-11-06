---
'curvy': minor
---

**3D rotations.** `curvy/transform` gains `Rotation3d`, a rotation about an axis through the origin, stored as a unit quaternion. A new `curvy/quaternion` module holds the quaternion algebra underneath it, with a `Unit` brand for the quaternions that represent rotations. Every `Rotation3d` operation that reads a rotation also accepts a `Quaternion<Unit>`, so code that already holds quaternions never has to wrap them.

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
