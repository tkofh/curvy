import type { Interval } from '../interval/interval.ts'
import type { Pipeable } from '../utils.ts'
import * as internal from './solution.internal.ts'

/**
 * A `Solution<T>` represents the result of an operation that may produce
 * between zero and three values of `T`. It generalizes the zoo of "0 or 1",
 * "0 to 2", "0 to 3" return shapes used throughout curvy under one type, and
 * provides a small namespace of operations (`valueOrUndefined`, `last`,
 * `min`, `max`, `filter`, `map`, `match`, …) for working with the result.
 *
 * Each variant carries a `_tag` discriminator and a `length` field, is
 * iterable via `Symbol.iterator` (so existing `for..of` and spread patterns
 * keep working), and is `Pipeable` (so a `Solution` value can be the head of
 * a `pipe` chain).
 *
 * Every non-empty variant exposes `.value` for the first value. `Two` and
 * `Three` add `.values` for positional access.
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

/**
 * A solution holding exactly one value, readable directly as `.value`.
 *
 * @since 2.0.0
 */
export interface One<T> extends Pipeable, Iterable<T> {
  readonly _tag: 'one'
  readonly length: 1
  /**
   * The held value.
   */
  readonly value: T
}

/**
 * A solution holding exactly two values, in construction order.
 *
 * @since 2.0.0
 */
export interface Two<T> extends Pipeable, Iterable<T> {
  readonly _tag: 'two'
  readonly length: 2
  /**
   * The first of the two values.
   */
  readonly value: T
  /**
   * Both values, in construction order.
   */
  readonly values: readonly [T, T]
}

/**
 * A solution holding exactly three values, in construction order.
 *
 * @since 2.0.0
 */
export interface Three<T> extends Pipeable, Iterable<T> {
  readonly _tag: 'three'
  readonly length: 3
  /**
   * The first of the three values.
   */
  readonly value: T
  /**
   * All three values, in construction order.
   */
  readonly values: readonly [T, T, T]
}

/**
 * Any non-empty solution. All `Some<T>` values expose `.value: T`
 * directly; no narrowing is required to read the primary value.
 *
 * @since 2.0.0
 */
export type Some<T> = One<T> | Two<T> | Three<T>

/**
 * `None | One<T>`: return type of operations that produce at most one
 * value (e.g. inverse-solving a strictly monotonic polynomial).
 *
 * @since 2.0.0
 */
export type AtMostOne<T> = None | One<T>

/**
 * `None | One<T> | Two<T>`: return type of operations that produce at most
 * two values (e.g. inverse-solving an unrestricted quadratic polynomial).
 *
 * @since 2.0.0
 */
export type AtMostTwo<T> = None | One<T> | Two<T>

/**
 * `None | One<T> | Two<T> | Three<T>`: equivalent to `Solution<T>`.
 *
 * @since 2.0.0
 */
export type AtMostThree<T> = Solution<T>

/**
 * The empty solution. A single shared instance; never reallocated.
 *
 * @since 2.0.0
 */
export const none: None = internal.none

/**
 * Constructs a single-value solution.
 *
 * @param value - The value to hold.
 * @returns A `One<T>` holding `value`.
 * @since 2.0.0
 */
export const one: <T>(value: T) => One<T> = internal.one

/**
 * Constructs a two-value solution, preserving argument order.
 *
 * @param a - The first (primary) value.
 * @param b - The second value.
 * @returns A `Two<T>` with `values` equal to `[a, b]`.
 * @since 2.0.0
 */
export const two: <T>(a: T, b: T) => Two<T> = internal.two

/**
 * Constructs a three-value solution, preserving argument order.
 *
 * @param a - The first (primary) value.
 * @param b - The second value.
 * @param c - The third value.
 * @returns A `Three<T>` with `values` equal to `[a, b, c]`.
 * @since 2.0.0
 */
export const three: <T>(a: T, b: T, c: T) => Three<T> = internal.three

/**
 * Constructs a `Solution<T>` from a runtime array, preserving order.
 *
 * @param arr - Up to three values.
 * @returns The variant matching `arr.length`; `none` for an empty array.
 * @throws `Error` when the array has more than three elements.
 * @since 2.0.0
 */
export const fromArray: <T>(arr: ReadonlyArray<T>) => Solution<T> = internal.fromArray

/**
 * Checks if a solution is empty.
 *
 * @param s - The solution to test.
 * @returns `true` when `s` holds no values, narrowing to `None`.
 * @since 2.0.0
 */
export const isNone: <T>(s: Solution<T>) => s is None = internal.isNone

/**
 * Checks if a solution holds at least one value. After narrowing, `.value`
 * is directly accessible without further checks.
 *
 * @param s - The solution to test.
 * @returns `true` when `s` holds one to three values, narrowing to `Some<T>`.
 * @since 2.0.0
 */
export const isSome: <T>(s: Solution<T>) => s is Some<T> = internal.isSome

/**
 * Returns the primary (first) value if the solution is non-empty, or
 * `undefined` if empty. After an `isSome` narrowing, read `.value`
 * directly instead.
 *
 * @param s - The solution to read.
 * @returns The first value, or `undefined` when empty.
 * @since 2.0.0
 */
export const valueOrUndefined: <T>(s: Solution<T>) => T | undefined = internal.valueOrUndefined

/**
 * Returns the last value in the solution, or `undefined` if empty. When
 * called on a `Some<T>`, the result is guaranteed to be `T`.
 *
 * @param s - The solution to read.
 * @returns The final value in construction order, or `undefined` when empty.
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
 * @param s - The solution to reduce.
 * @returns The smallest held value, or `undefined` when empty.
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
 * @param s - The solution to reduce.
 * @returns The largest held value, or `undefined` when empty.
 * @since 2.0.0
 */
export const max: {
  (s: Some<number>): number
  (s: Solution<number>): number | undefined
} = internal.max

export const unsafeValue: {
  /**
   * Returns the primary value of the solution (`s.value`), throwing on
   * `None`.
   *
   * Useful when the type system can't prove non-emptiness but you have a
   * domain reason to assert it — e.g. inverting a polynomial you know to
   * be monotonic without going through the trait refiner first.
   *
   * @param s - The solution to read.
   * @param message - The error message when `s` is empty. Defaults to `'Solution.unsafeValue on empty Solution'`.
   * @returns The first value.
   * @throws `Error` when `s` is empty.
   * @since 2.0.0
   */
  <T>(s: Solution<T>, message?: string): T
  /**
   * Returns the primary value of a solution, throwing on `None`.
   *
   * @param message - The error message when the solution is empty.
   * @returns A function that takes a solution and returns its first value.
   * @throws `Error` when the solution is empty.
   * @example
   * ```ts
   * const x = CubicPolynomial.solveInverse(p, y).pipe(
   *   Solution.unsafeValue('expected a monotonic inverse'),
   * )
   * ```
   * @since 2.0.0
   */
  (message: string): <T>(s: Solution<T>) => T
} = ((...args: ReadonlyArray<unknown>) => {
  if (args.length >= 1 && typeof args[0] === 'object' && args[0] !== null) {
    return internal.unsafeValue(args[0] as Solution<unknown>, args[1] as string | undefined)
  }
  const message = args[0] as string
  return <T>(s: Solution<T>) => internal.unsafeValue(s, message)
}) as never

/**
 * Returns the last value in the solution, throwing if empty.
 *
 * @param s - The solution to read.
 * @returns The final value in construction order.
 * @throws `Error` when `s` is empty.
 * @since 2.0.0
 */
export const unsafeLast: <T>(s: Solution<T>) => T = internal.unsafeLast

/**
 * Returns the smallest numeric value in the solution, throwing if empty.
 *
 * @param s - The solution to reduce.
 * @returns The smallest held value.
 * @throws `Error` when `s` is empty.
 * @since 2.0.0
 */
export const unsafeMin: (s: Solution<number>) => number = internal.unsafeMin

/**
 * Returns the largest numeric value in the solution, throwing if empty.
 *
 * @param s - The solution to reduce.
 * @returns The largest held value.
 * @throws `Error` when `s` is empty.
 * @since 2.0.0
 */
export const unsafeMax: (s: Solution<number>) => number = internal.unsafeMax

/**
 * Filters the solution by a predicate, preserving the order of survivors.
 * Result cardinality is at most that of the input.
 *
 * @param s - The solution to filter.
 * @param predicate - Keeps a value when it returns `true`.
 * @returns A solution holding the values that passed.
 * @since 2.0.0
 */
export const filter: <T>(s: Solution<T>, predicate: (v: T) => boolean) => Solution<T> =
  internal.filter

export const clip: {
  /**
   * Restricts a solution to values contained within an interval.
   *
   * @param i - The interval to retain values within.
   * @returns A function that takes a solution and returns the clipped solution.
   * @since 2.0.0
   */
  (i: Interval): (s: Solution<number>) => Solution<number>
  /**
   * Restricts the solution to values contained within an interval.
   * Endpoint inclusivity follows the interval's `kind`; pass an open
   * variant (e.g. `Interval.makeOpen(0, 1)` or `Interval.unitOpen`) for
   * strict containment.
   *
   * @param s - The solution to clip.
   * @param i - The interval to retain values within.
   * @returns A solution holding the contained values, in order.
   * @since 2.0.0
   */
  (s: Solution<number>, i: Interval): Solution<number>
} = internal.clip

export const clipApprox: {
  /**
   * Approximate-containment variant of `clip` for post-processing the
   * output of a numerical solver.
   *
   * @param i - The interval to retain values approximately within.
   * @returns A function that takes a solution and returns the clipped solution.
   * @since 2.0.0
   */
  (i: Interval): (s: Solution<number>) => Solution<number>
  /**
   * Approximate-containment variant of `clip` for post-processing the
   * output of a numerical solver. Retains values within `EPSILON` (from
   * `curvy/number`) of either boundary even if formally outside — a valid
   * root can land a few ulps past the boundary due to coefficient roundoff
   * in the solver, and strict `clip` would drop it. Endpoint inclusivity
   * is ignored at that scale.
   *
   * @param s - The solution to clip.
   * @param i - The interval to retain values approximately within.
   * @returns A solution holding the approximately contained values, in order.
   * @since 2.0.0
   */
  (s: Solution<number>, i: Interval): Solution<number>
} = internal.clipApprox

export const map: {
  /**
   * Maps every value in the solution to a new value, in order. Result
   * cardinality matches the input.
   *
   * @param s - The solution to transform.
   * @param f - Applied to each held value.
   * @returns A solution of the mapped values.
   * @since 2.0.0
   */
  <A, B>(s: Solution<A>, f: (v: A) => B): Solution<B>
  /**
   * Maps every value in a solution to a new value.
   *
   * @param f - Applied to each held value.
   * @returns A function that takes a solution and returns the mapped solution.
   * @since 2.0.0
   */
  <A, B>(f: (v: A) => B): (s: Solution<A>) => Solution<B>
} = internal.map

// Drops `None` from the union of the input solution type — used by `match` to
// give `onSome` a tighter parameter type. Distributive: a `Solution.AtMostOne<T>`
// becomes `One<T>`; a full `Solution<T>` keeps `Some<T>`.
type SomeOf<S> = S extends None ? never : S

export const match: {
  /**
   * Pattern matches on a solution, calling `onNone` for the empty case and
   * `onSome` for any non-empty case. The `onSome` parameter is typed
   * against the input's narrowed shape: for an `AtMostOne<T>` input,
   * `onSome` receives `One<T>` and can read `.value` directly.
   *
   * @param self - The solution to match on.
   * @param matcher - The `onNone` and `onSome` handlers.
   * @returns The value returned by whichever handler ran.
   * @since 2.0.0
   */
  <S extends Solution<unknown>, A, B>(
    self: S,
    matcher: { readonly onNone: () => A; readonly onSome: (s: SomeOf<S>) => B },
  ): A | B
  /**
   * Pattern matches on a solution.
   *
   * @param matcher - The `onNone` and `onSome` handlers.
   * @returns A function that takes a solution and returns whichever handler's result.
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
   * @since 2.0.0
   */
  <S extends Solution<unknown>, A, B>(matcher: {
    readonly onNone: () => A
    readonly onSome: (s: SomeOf<S>) => B
  }): (self: S) => A | B
} = internal.match as never
