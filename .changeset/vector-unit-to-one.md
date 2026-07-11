---
'curvy': major
---

Rename `Vector2.unit`, `Vector3.unit`, and `Vector4.unit` to `one`. These are the all-ones constants (magnitude `sqrt(2)`/`sqrt(3)`/`2`), not unit-length vectors, and the old name promised normalization it never had. `Vector3.unitX`/`unitY`/`unitZ` keep their names: those are genuine unit vectors.
