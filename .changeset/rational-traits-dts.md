---
'curvy': patch
---

Fix the published declarations for `curvy/curve` under `skipLibCheck: false`. `RationalCubicCurve2d`'s trait key was stripped from the declaration build while the public module still re-exported it, so type-checking `rationalCubic2d.d.ts` failed.
