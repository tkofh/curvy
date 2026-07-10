# curvy

A 2D curve and spline math library for TypeScript (npm: `curvy`),
Effect-style: data-first/data-last dual signatures, branded types,
immutable values. The public surface is `packages/core/src` minus
`*.internal.ts`; implementations live in the internal modules and the
public files are type-annotated re-exports where the JSDoc lives.
`PRECISION.md` at the repo root is the library's numerical contract.

## Documentation

Doc comments calibrate to this section. The general rules live in the
comment-doctor skill (user-level); the content here stands on its own.

### Declared reader

Public doc comments address a developer using the library from npm:

- Fluent in TypeScript — branded types, conditional types, dual
  signatures. Never gloss TS.
- A practitioner with curves: knows Bézier curves, control points, and
  splines by feel. Gloss parameterization theory (centripetal/alpha, arc
  length vs. uniform parameter) in a clause at point of use.
- Not assumed fluent in floating-point numerics: state tolerance behavior
  plainly and point to `PRECISION.md` rather than re-teaching mechanics.

Contributor topics — module architecture, numerical design rationale,
representation trade-offs — go in module-level docs, `*.internal.ts`
comments, or repo docs like `PRECISION.md`, linked from consumer docs and
never inlined into them.

### Conventions

- Dual signatures: the data-first overload comes first and carries the
  full contract. The data-last overload keeps a one-line summary, its
  tags, and its own `@since`; its `@returns` may use the formula "A
  function that takes ... and returns ...".
- `@param`/`@returns` on every function doc block (convention; nothing
  lint-enforces it). Obvious parameters may keep brief conventional text;
  non-obvious parameters must carry the real content — geometric meaning,
  units, range, default. Placeholder text is banned.
- `@since` on every public doc block, per overload, no gaps.
- Exemplars of the standard: `coincident` and `RELATIVE_TOLERANCE` in
  `packages/core/src/number.ts`; `solve` and `boundingBox` in
  `packages/core/src/path/rationalCubic2d.ts`; `transform` in
  `packages/core/src/splines/cardinal2d.ts`.
