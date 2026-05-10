---
'curvy': patch
---

TypeScript declarations are now published as `.d.mts` rather than `.d.ts`, matching the ESM-only `.mjs` artifact convention. The `package.json` `exports` field has been updated accordingly, so consumers using modern TypeScript (5+) with `moduleResolution: "node16"`, `"nodenext"`, or `"bundler"` see no change — types resolve through `exports` like before.

Two scenarios where this is observable:

- **Deep imports past `exports`** (e.g. `import 'curvy/dist/vector/vector2.d.ts'`) will break — those file paths no longer exist. This was already unsupported, but worth flagging.
- **Older TypeScript or non-`exports`-aware tooling** that fell back to `.d.ts` lookup by extension may need updating to a version that honors `exports`.

This change ships alongside the build-tool migration from `unbuild` to `tsdown`. Sourcemaps for declarations are also now emitted (`.d.mts.map`), which `unbuild` did not produce.
