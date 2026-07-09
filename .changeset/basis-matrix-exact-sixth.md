---
'curvy': patch
---

**The uniform B-spline characteristic matrix uses the exact `1/6`.**

One entry of `Characteristic.cubicBasisSpline`'s first row was `roundDown(1/6)` — a relic of the v1 precision model, where every value was snapped to 8 decimals on construction and the truncation compensated for it. Under the v2 exact-IEEE model it did the opposite: the c₀ row's partition-of-unity error was `6.7e-9` instead of one ulp (`1.1e-16`), shifting every basis-spline segment's constant term by up to `6.7e-9` × the third control point's magnitude. The row is now `1/6, 4/6, 1/6, 0` exactly as computed, and coincident control points reproduce their point to within an ulp.
