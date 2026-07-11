---
'curvy': patch
---

Fixed `Vector3.setTheta` and `Vector3.setPhi`, which weren't holding their documented invariants.

- `setTheta(v, theta)` was using `v.y` directly in place of the azimuthal angle, so it didn't actually preserve `phi` and produced garbage for any vector with `v.y` not coincidentally equal to its azimuthal angle in radians.
- `setPhi(v, phi)` was rotating around the origin using `magnitude(v)` as the xy-projection length, so the result didn't lie on the original sphere — magnitude wasn't preserved.

Both now correctly hold "change one spherical component, preserve the other two" — `setTheta` keeps `r` and `phi`, `setPhi` keeps `r` and `theta`. The fix also corrects the internal parameter names (`setTheta`'s arg was named `phi` and vice versa). Public TypeScript types are unchanged.

`mapTheta` / `mapPhi` (added in the same release) are unaffected — they compose on top of these setters and now produce correct results automatically.
