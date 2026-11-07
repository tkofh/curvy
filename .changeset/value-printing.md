---
'curvy': minor
---

**Values and utilities.** Every curvy value prints as itself. `console.log` in Node, Bun, and Deno shows `Vector2(3, 4)` or `Bezier2d(Vector2(0, 0), Vector2(1, 2), ...)` where 1.x showed a field dump, and `String(value)` and template literals give the same text. `Object.prototype.toString` gives the bare type name.

```ts
const p = Vector2.make(3, 4)

String(p) // 'Vector2(3, 4)' (1.x: '[object Vector2(3, 4)]')
Object.prototype.toString.call(p) // '[object Vector2]' (1.x: '[object Vector2(3, 4)]')
```

Each type's id is a `~curvy/<Name>` string on its prototype, where 1.x set a symbol on every instance. Instances hold only their own fields, so object spread and `Object.getOwnPropertySymbols` no longer pick up an id, and a spread copy fails the `is*` guards: `Vector2.isVector2({ ...p })` is `false`. Build copies with the module's constructors instead.

`curvy/utils` exports `Value`, the base every curvy value type is built on, so a library can define types that behave the same way. `class Point extends Value('~geometry/Point')` gets `pipe`, the id on its prototype, `[object Point]`, and console printing through its `toString`, which TypeScript requires it to implement. The id names its package, which keeps two libraries' same-named types apart. `Value.Instance` types any such value, curvy's included.

`flow` sits beside `pipe` in `curvy/utils`. `flow(f, g)` composes up to nine functions left to right into a new one, `x => g(f(x))`, where `pipe(x, f, g)` applies them to a value at once. Curvy's data-last overloads are the steps it composes:

```ts
const nudge = flow(Vector2.scale(2), Vector2.add(Vector2.make(1, 0)))

nudge(Vector2.make(3, 4)) // Vector2(7, 8)
const moved = [Vector2.make(0, 0), Vector2.make(1, 1)].map(nudge) // [Vector2(1, 0), Vector2(3, 2)]
```
