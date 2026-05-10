import type { Interval } from './interval'
import type { Pipeable } from './pipe'
import * as internal from './solution.internal'

/**
 * A `Solution<T>` represents the result of an operation that may produce
 * between zero and three values of `T`. It generalizes the zoo of "0 or 1",
 * "0 to 2", "0 to 3" return shapes used throughout curvy under one type, and
 * provides a small namespace of operations (`value`, `last`, `min`, `max`,
 * `filter`, `map`, `match`, …) for working with the result.
 *
 * Each variant carries a `_tag` discriminator and a `length` field, is
 * iterable via `Symbol.iterator` (so existing `for..of` and spread patterns
 * keep working), and is `Pipeable` (so a `Solution` value can be the head of
 * a `pipe` chain).
 *
 * Variant-specific accessors:
 * - `One<T>`, `Two<T>`, and `Three<T>` all expose `.value: T` (the first /
 *   primary value).
 * - `Two<T>` and `Three<T>` additionally expose `.values: readonly [T, ...]`
 *   for explicit positional access.
 *
 * Operations that return narrower cardinalities (e.g. inverse-solving a
 * monotonic polynomial) use the `AtMost{One,Two,Three}` aliases to express
 * "this could be empty, but it'll have at most N values."
 *
 * @since 2.0.0
 */
export type Solution<T> = None | One<T> | Two<T> | Three<T>

/**
 * The empty solution.
 *
 * @since 2.0.0
 */
export interface None extends Pipeable, Iterable<never> {
  readonly _tag: 'none'
  readonly length: 0
}

/** @since 2.0.0 */
export interface One<T> extends Pipeable, Iterable<T> {
  readonly _tag: 'one'
  readonly length: 1
  readonly value: T
}

/** @since 2.0.0 */
export interface Two<T> extends Pipeable, Iterable<T> {
  readonly _tag: 'two'
  readonly length: 2
  readonly value: T
  readonly values: readonly [T, T]
}

/** @since 2.0.0 */
export interface Three<T> extends Pipeable, Iterable<T> {
  readonly _tag: 'three'
  readonly length: 3
  readonly value: T
  readonly values: readonly [T, T, T]
}

/**
 * Any non-empty solution. All `Some<T>` values expose `.value: T` directly —
 * no narrowing required to read the primary value.
 *
 * @since 2.0.0
 */
export type Some<T> = One<T> | Two<T> | Three<T>

/**
 * `None | One<T>` — return type of operations that produce at most one value
 * (e.g. inverse-solving a strictly monotonic polynomial).
 *
 * @since 2.0.0
 */
export type AtMostOne<T> = None | One<T>

/**
 * `None | One<T> | Two<T>` — return type of operations that produce at most
 * two values (e.g. inverse-solving an unrestricted quadratic polynomial).
 *
 * @since 2.0.0
 */
export type AtMostTwo<T> = None | One<T> | Two<T>

/**
 * `None | One<T> | Two<T> | Three<T>` — equivalent to `Solution<T>`.
 *
 * @since 2.0.0
 */
export type AtMostThree<T> = Solution<T>

/**
 * The empty solution. Reused across calls — never reallocated.
 *
 * @since 2.0.0
 */
export const none: None = internal.none

/**
 * Constructs a single-value solution.
 *
 * @since 2.0.0
 */
export const one: <T>(value: T) => One<T> = internal.one

/**
 * Constructs a two-value solution.
 *
 * @since 2.0.0
 */
export const two: <T>(a: T, b: T) => Two<T> = internal.two

/**
 * Constructs a three-value solution.
 *
 * @since 2.0.0
 */
export const three: <T>(a: T, b: T, c: T) => Three<T> = internal.three

/**
 * Constructs a `Solution<T>` from a runtime array. Throws if the array has
 * more than three elements.
 *
 * @since 2.0.0
 */
export const fromArray: <T>(arr: ReadonlyArray<T>) => Solution<T> = internal.fromArray

/**
 * Type-narrowing predicate: refines `Solution<T>` to `None`.
 *
 * @since 2.0.0
 */
export const isNone: <T>(s: Solution<T>) => s is None = internal.isNone

/**
 * Type-narrowing predicate: refines `Solution<T>` to `Some<T>` (non-empty).
 * After narrowing, `.value` is directly accessible without further checks.
 *
 * @since 2.0.0
 */
export const isSome: <T>(s: Solution<T>) => s is Some<T> = internal.isSome

/**
 * Returns the primary (first) value if the solution is non-empty, or
 * `undefined` if empty. Pair with `.value` access on `Some<T>`-narrowed
 * inputs to avoid the `undefined` possibility.
 *
 * @since 2.0.0
 */
export const valueOrUndefined: <T>(s: Solution<T>) => T | undefined = internal.valueOrUndefined

/**
 * Returns the last value in the solution, or `undefined` if empty. When
 * called on a `Some<T>`, the result is guaranteed to be `T`.
 *
 * @since 2.0.0
 */
export const last: {
  <T>(s: Some<T>): T
  <T>(s: Solution<T>): T | undefined
} = internal.last

/**
 * Returns the smallest numeric value in the solution, or `undefined` if empty.
 * When called on a `Some<number>`, the result is guaranteed to be `number`.
 *
 * @since 2.0.0
 */
export const min: {
  (s: Some<number>): number
  (s: Solution<number>): number | undefined
} = internal.min

/**
 * Returns the largest numeric value in the solution, or `undefined` if empty.
 * When called on a `Some<number>`, the result is guaranteed to be `number`.
 *
 * @since 2.0.0
 */
export const max: {
  (s: Some<number>): number
  (s: Solution<number>): number | undefined
} = internal.max

/**
 * Returns the last value in the solution. Throws if empty.
 *
 * @since 2.0.0
 */
export const unsafeLast: <T>(s: Solution<T>) => T = internal.unsafeLast

/**
 * Returns the smallest numeric value in the solution. Throws on empty.
 *
 * @since 2.0.0
 */
export const unsafeMin: (s: Solution<number>) => number = internal.unsafeMin

/**
 * Returns the largest numeric value in the solution. Throws on empty.
 *
 * @since 2.0.0
 */
export const unsafeMax: (s: Solution<number>) => number = internal.unsafeMax

/**
 * Filters the solution by a predicate. Result cardinality is at most that of
 * the input.
 *
 * @since 2.0.0
 */
export const filter: <T>(s: Solution<T>, predicate: (v: T) => boolean) => Solution<T> =
  internal.filter

/**
 * Filters the solution to values contained within an interval. Endpoint
 * inclusivity follows the interval's `kind` — pass an open variant (e.g.
 * `Interval.makeOpen(0, 1)` or `Interval.toOpen(closed)`) for strict
 * containment.
 *
 * @param s - The solution to filter.
 * @param i - The interval to retain values within.
 * @since 2.0.0
 */
export const filterInterval: (s: Solution<number>, i: Interval) => Solution<number> =
  internal.filterInterval

/**
 * Maps every value in the solution to a new value. Result cardinality matches
 * the input.
 *
 * @since 2.0.0
 */
export const map: <A, B>(s: Solution<A>, f: (v: A) => B) => Solution<B> = internal.map

// Drops `None` from the union of the input solution type — used by `match` to
// give `onSome` a tighter parameter type. Distributive: a `Solution.AtMostOne<T>`
// becomes `One<T>`; a full `Solution<T>` keeps `Some<T>`.
type SomeOf<S> = S extends None ? never : S

/**
 * Pattern matches on a solution, calling `onNone` for the empty case and
 * `onSome` for any non-empty case. The `onSome` parameter is typed against
 * the input's narrowed shape — for an `AtMostOne<T>` input, `onSome` receives
 * `One<T>` and can read `.value` directly.
 *
 * @example
 * ```ts
 * const result = polynomial.pipe(
 *   LinearPolynomial.solveInverse(0),
 *   Solution.match({
 *     onNone: () => null,
 *     onSome: ({ value }) => Math.abs(value),
 *   }),
 * )
 * ```
 *
 * @since 2.0.0
 */
export const match: {
  <S extends Solution<unknown>, A, B>(
    self: S,
    matcher: { readonly onNone: () => A; readonly onSome: (s: SomeOf<S>) => B },
  ): A | B
  <S extends Solution<unknown>, A, B>(matcher: {
    readonly onNone: () => A
    readonly onSome: (s: SomeOf<S>) => B
  }): (self: S) => A | B
} = internal.match as never
