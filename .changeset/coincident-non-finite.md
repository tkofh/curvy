---
'curvy': patch
---

`coincident` compares a non-finite pair exactly. An infinity now equals the
infinity of the same sign and no finite value. Before, the tolerance band
against an infinity was infinite, so `coincident(5, Infinity)` held, and
`coincident(Infinity, Infinity)` did not. Every `equals` built on
`coincident` (vectors, matrices, polynomials, intervals) follows.
