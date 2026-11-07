---
'curvy': major
---

**The spline characteristic matrices move to the new `curvy/characteristic` module, and their entries are now exact.** The per-spline `characteristic` exports are removed:

| 1.0.9                              | 2.0                                     |
| ---------------------------------- | --------------------------------------- |
| `Bezier2d.characteristic`          | `Characteristic.cubicBezier`            |
| `Hermite2d.characteristic`         | `Characteristic.cubicHermite`           |
| `Basis2d.characteristic`           | `Characteristic.cubicBasisSpline`       |
| `Cardinal2d.characteristic(scale)` | `Characteristic.cubicCardinal(tension)` |
| `Cardinal2d.catRomCharacteristic`  | `Characteristic.cubicCatmullRom`        |

`tension` is the 1.x `scale` under its proper name. `Bezier2d.fromSpline(points, matrix, stride)` keeps its 1.x signature and takes these matrices or one of your own.

1.x rounded every matrix entry to 8 decimal places, so the B-spline matrix held `0.16666667` and `0.16666666` where 2.0 holds `1/6`. Any matrix with an entry that needs more digits, such as `cubicCardinal(1/3)`, differs from 1.x in its last digits. The Bézier, Hermite and Catmull-Rom matrices are unchanged. See [PRECISION.md](https://github.com/tkofh/curvy/blob/main/PRECISION.md) for the rounding removal across the library.

`Characteristic.apply(matrix, channels)` is new. It multiplies the matrix by each channel, a `Vector4` holding one axis's values at the four control points, and returns one monomial cubic per channel. `Vector4.transpose` packs point data into those channels (`Vector2.transpose` and `Vector3.transpose` do the same for 2 and 3 items):

```ts
const [xs, ys] = Vector4.transpose([p0, p1, p2, p3], (p) => [p.x, p.y])
const [x, y] = Characteristic.apply(Characteristic.cubicBezier, [xs, ys])
const curve = CubicCurve2d.fromPolynomials(x, y)
```

The channel array takes any length, so a rational spline passes three channels, `x * w`, `y * w` and `w`.

The full table of 1.x exports and their 2.0 forms is in [MIGRATION.md](https://github.com/tkofh/curvy/blob/main/MIGRATION.md).
