---
'curvy': minor
---

Added three new `Matrix4x4` primitives:

- **`Matrix4x4.identity`** — the 4x4 identity matrix as a constant.
- **`Matrix4x4.multiply(a, b)`** — matrix-matrix multiplication, in both data-first and data-last forms.
- **`Matrix4x4.inverse(m)`** — matrix inverse via the adjugate / determinant formula. Throws on singular input (determinant zero).

These are useful both as general-purpose 4x4 transform primitives and as the foundation for the new spline-conversion caching that ships in this release.
