---
'curvy': patch
---

Revert the namespace + type re-export pattern at group index files (originally added in alpha.4) and the associated dts-emission pipeline change (alpha.5). The pattern crashed TypeScript in some downstream consumer setups.

Type access reverts to the namespace-nested form:

```ts
import * as Vector2 from 'curvy/vector'

const v: Vector2.Vector2 = Vector2.make(1, 2)
```

Each group's `index.ts` is back to plain `export * as Foo from './foo'` re-exports. Build pipeline returns to tsdown-only (no separate tsc pass, no post-build script).

No other API changes.
