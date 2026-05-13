---
'curvy': patch
---

Fix declaration emission so the alpha.4 namespace + type re-export pattern actually works for consumers.

In alpha.4 the index files were rewritten so that `import { Vector2 } from 'curvy/vector'` resolves as both a value (namespace) and a type (interface). The source-level change was correct, but tsdown's declaration bundler was dropping the value-side re-export from the emitted `.d.ts` — consumers got the type but not the namespace, so `Vector2.make(...)` typecheck-failed.

The build now uses tsc for declaration emission (per-file, not bundled), tsdown for runtime, and a post-build step that inlines brand-symbol references from internal modules and strips the `*.internal.d.ts` files from `dist/`. End result: the namespace+type pattern works at the consumer's typecheck, and the published tarball no longer ships any internal declarations.

No API changes.
