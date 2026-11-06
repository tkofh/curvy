---
'curvy': minor
---

**Vectors are iterable.** `Vector2`, `Vector3`, and `Vector4` yield their components in order, so they destructure like tuples, spread, and work with `for..of` and `Array.from`.

```ts
const [x, y] = Vector2.make(3, 4)
const [r, g, b, a] = Vector4.make(1, 0.5, 0, 1)
```

Spreading gives a `number[]`. `components` still returns the typed tuple (`[number, number]` for `Vector2`).
