---
'curvy': major
---

The cubic polynomial's `domain` now returns `Solution.AtMostOne<Interval>`, matching its linear and quadratic siblings. A range whose endpoint values the polynomial never attains (reachable only when the coefficients collapse the degree) returns `Solution.none` instead of throwing an incidental interval-construction error.
