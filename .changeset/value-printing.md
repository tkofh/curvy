---
'curvy': minor
---

**Every curvy value now prints as itself.** `console.log` in Node, Bun, and Deno shows `Vector2(3, 4)` or `Bezier2d(Vector2(0, 0), Vector2(1, 2), ...)` instead of a field dump. Template literals and `String(value)` give the same text, and `Object.prototype.toString` gives the type name (`[object Bezier2d]`). Before, only some types had a rendering, and Node never used it: the inspect hook was a string where Node expects a function.

```ts
const p = Vector2.make(3, 4)

console.log(p) // Vector2(3, 4)
String(p) // 'Vector2(3, 4)'
```

Type ids are now `~curvy/<Name>` strings on each type's prototype, instead of symbols set on every instance. Instances hold only their own fields, so object spread and `Object.getOwnPropertySymbols` no longer surface an id, and each value is one field smaller. The `is*` guards also match across two installed copies of curvy, which several types previously failed because their ids were unregistered symbols. `Interval` and `Solution` values carry an id for the first time, so a plain object no longer type-checks as one.

**`Value` is new in `curvy/utils`**, so a library built on curvy can define value types that behave the same way. `class Point extends Value('~geometry/Point')` gets `pipe`, the type id on its prototype, `[object Point]` from `Object.prototype.toString`, and console printing through its `toString`. Leaving `toString` out is a compile error. The id must name its package (`~<package>/<Name>`), which keeps two libraries' same-named types apart. The `Value.Instance` type accepts any value built this way, curvy's included. Every curvy value type is now a `Value.Instance` rather than a bare `Pipeable`, so its public type includes `toString`.
