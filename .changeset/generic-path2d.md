---
'curvy': minor
---

**Generic `Path2d<C>`.** The three polynomial path kinds (`LinearPath2d`, `QuadraticPath2d`, `CubicPath2d`) used to be near-duplicate implementations — each ~300-line internal module re-deriving the same `make`, `length`, `solve`, `toPathData`, continuity refiner, monotonicity refiners, and `solveAtX`/`solveAtY`. They now all derive their operation surface from one generic implementation parameterized by a `Curve2dOps<C>` bundle:

```ts
// path/path2d.ts (new)
export interface Path2d<C, Trait = unknown> extends Pipeable, Iterable<C> {
  readonly [PathTraits]: Trait
}

export const makeMethods = <C>(typeId: symbol, ops: Curve2dOps<C>) => ({
  make,
  fromArray,
  append,
  length,
  solve,
  toPathData,
  isContinuous,
  isIncreasingX,
  isDecreasingX,
  isMonotonicX,
  isIncreasingY,
  isDecreasingY,
  isMonotonicY,
  solveAtX,
  solveAtY,
  boundingBox,
})

// path/linear2d.internal.ts (after — ~130 lines, down from ~310)
const methods = Path2d.makeMethods(LinearPath2dTypeId, LinearCurve2d.Ops)
export const make = methods.make as (...curves) => LinearPath2d
export const length = methods.length as (p: LinearPath2d) => number
// …
```

What's new:

- **`Curve2dOps<C>` interface** in `curve/curve2d.ts` — the minimal operation bundle a curve module must provide (solve, startPoint/endPoint, length, boundingBox, solveAtX/Y, toPathDataSegment, per-axis monotonicity).
- **`Ops` export** on `LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d` — instances of `Curve2dOps` ready to pass into `Path2d.makeMethods`.
- **Per-axis monotonicity predicates** on polynomial curves: `isMonotonicX`/`Y`, `isIncreasingX`/`Y`, `isDecreasingX`/`Y` — brand-aware predicates that refine only one axis, mirroring what `RationalCubicCurve2d` already had.
- **`Path2d<C, Trait>` + `Path2d.makeMethods`** in `path/path2d.ts` — the generic interface and operation factory.

Behavior is preserved: every existing public API on `LinearPath2d` / `QuadraticPath2d` / `CubicPath2d` works as before (same signatures, same per-kind `TypeId`-based runtime identity, same error messages). `RationalCubicPath2d` is unchanged — its tolerance-threaded bounding box and unique projection semantics keep it outside the generic for now.
