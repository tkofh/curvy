---
'curvy': minor
---

Rename `Bezier2d.appendCurvatureMirrored` to `Bezier2d.appendCurvatureAligned` for consistency with the rest of the `*Aligned` family (`appendTangentAligned`, `appendVelocityAligned`, `appendAccelerationAligned`). The internal binding was already named `appendCurvatureAligned`; this aligns the public surface.
