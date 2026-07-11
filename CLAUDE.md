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

- Dual signatures: the data-first overload carries the full contract,
  wherever it sits — several existing exports declare data-last first,
  and reordering overloads is a code change (it can affect overload
  resolution), not a docs change. The data-last overload keeps a one-line
  summary, its tags, and its own `@since`; its `@returns` may use the
  formula "A function that takes ... and returns ...". The formula is
  sanctioned ceremony, exempt from template-text checks.
- `@param`/`@returns` on every function doc block (convention; nothing
  lint-enforces it). Obvious parameters may keep brief conventional text;
  non-obvious parameters must carry the real content — geometric meaning,
  units, range, default. Placeholder text is banned.
- `@throws` on every function with a verified consumer-reachable throw,
  in the form ``@throws `Error` when …``. The documented condition
  matches the real guard, not the intended one.
- `@since` on every public doc block, using the behavior clock: the
  earliest release in which a consumer could obtain the behavior from the
  public API, under any name. Renames don't reset it. Code that predates
  its module's public export dates from the export. An overload added
  later carries its own later tag.
- Arity-ladder overload sets (`pipe`, `Pipeable.pipe`) take one full doc
  block on the first overload — plus the class doc, for methods — and
  nothing on the remaining arities. The per-overload rule is for dual
  signatures, not ladders.
- Cross-references are backticked prose names, not `{@link}`: qualified
  with the consumer's namespace for cross-module targets
  (`RationalCubicCurve2d.boundingBox`, the existing house form), bare for
  same-module ones (`solveByDistance`). Editors resolve `{@link}` only
  against in-scope symbols, oxlint rejects imports that exist only for a
  doc link, and the package publishes without declaration maps, so a
  link at best jumps a consumer into a `.d.ts`. Convert old links when
  touching their block; never add an import to feed a link; when you
  touch a cross-reference, verify the claim around it. In a dedicated
  pass every block counts as touched, and a link-only conversion doesn't
  demote a block from "no change needed".
- Examples: `@example` with a fenced `ts` code block, call sites written
  in the consumer's namespaced vocabulary, no import boilerplate. Add one
  where the signature alone would let a first-time caller hold the API
  wrong (dual/curried call shapes, compositions) or where a concrete
  input beats a paragraph; skip it where the first guess is right. An
  example ships only verified — run it, or check every name against the
  real API.
- Comments stay in the keyboard character set: formulas written as code
  (`t^2`, `k0`, `w*x`, `<=`, `sqrt(x^2 + y^2)`, `sum(w_i * P_i)`,
  `t in [0, 1]`, `pi`), never math glyphs — no sub/superscripts, Greek
  letters, `·`, `∈`, `≤`, `√`, `Σ`. Em dashes and accented proper names
  (Bézier, Holmér) stay.
- Exemplars of the standard: `coincident` and `RELATIVE_TOLERANCE` in
  `packages/core/src/number.ts`; `solve` and `boundingBox` in
  `packages/core/src/path/rationalCubic2d.ts`; `transform` in
  `packages/core/src/splines/cardinal2d.ts`.
