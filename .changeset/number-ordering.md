---
'curvy': minor
---

Add the ordering predicates to `curvy/number`: `before`, `atMost`, `within`,
`inside`, `overlaps`, and `touches`. Each decides the order of two values, or
whether two ranges meet, with the `coincident` band, so rounding noise never
flips the answer. `before` and `inside` hold only beyond the band; `atMost`,
`within`, and `touches` hold within it; `overlaps` asks for more than a point
in common. A non-finite pair compares exactly, so every finite value comes
before `Infinity`.
