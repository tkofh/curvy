---
'curvy': minor
---

Path `solve` (all path types) now has a defined out-of-range contract: parameters within `EPSILON` outside `[0, 1]` snap to the boundary, forgiving accumulated float error, and anything beyond throws an invariant with a clear message. Previously an out-of-range parameter indexed a nonexistent segment and failed with an incidental `TypeError`.
