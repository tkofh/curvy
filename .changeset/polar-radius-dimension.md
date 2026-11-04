---
'curvy': minor
---

**`Polar.radius` is typed as the `Dimension` union.** The field and its `PolarConfig` counterpart widen from `Linear` to `Dimension`, so future radial-map kinds can arrive without breaking code that holds a `Polar`. Construction still pins the radial axis to a linear map — `polar` throws on a `Cyclical` radius, whose wrapping would tear `sector` and `image` at period seams — so the widening changes what readers may assume, not what systems exist. Apply the map with the new `mapRadius` instead of reading `scale` and `offset` off the field; direct field reads are what this change deprecates in spirit.
