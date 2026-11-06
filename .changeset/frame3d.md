---
'curvy': minor
---

**Frames for yaw, pitch, and roll.** `curvy/transform` gains `Frame3d`, which names the directions an object or a space calls up, forward, and right. `Frame3d.make({ up, forward })` takes the first two and derives `right` as `cross(forward, up)`, the right-hand side of someone standing along `up` and facing `forward`.

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
