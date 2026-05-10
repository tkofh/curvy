import * as Interval from './interval'
import { dual, Pipeable } from './pipe'
import type {
  AtMostOne,
  AtMostThree,
  AtMostTwo,
  None,
  One,
  Solution,
  Some,
  Three,
  Two,
} from './solution'
import { invariant } from './utils'

// Empty iterator — shared across all None instances since None has no data.
const EMPTY_ITERATOR: Iterator<never> = {
  next: () => ({ done: true, value: undefined as never }),
}

class NoneImpl extends Pipeable implements None {
  readonly _tag = 'none' as const
  readonly length = 0 as const;

  [Symbol.iterator](): Iterator<never> {
    return EMPTY_ITERATOR
  }
}

class OneImpl<T> extends Pipeable implements One<T> {
  readonly _tag = 'one' as const
  readonly length = 1 as const

  constructor(readonly value: T) {
    super()
  }

  [Symbol.iterator](): Iterator<T> {
    return [this.value][Symbol.iterator]()
  }
}

class TwoImpl<T> extends Pipeable implements Two<T> {
  readonly _tag = 'two' as const
  readonly length = 2 as const

  constructor(readonly values: readonly [T, T]) {
    super()
  }

  get value(): T {
    return this.values[0]
  }

  [Symbol.iterator](): Iterator<T> {
    return this.values[Symbol.iterator]()
  }
}

class ThreeImpl<T> extends Pipeable implements Three<T> {
  readonly _tag = 'three' as const
  readonly length = 3 as const

  constructor(readonly values: readonly [T, T, T]) {
    super()
  }

  get value(): T {
    return this.values[0]
  }

  [Symbol.iterator](): Iterator<T> {
    return this.values[Symbol.iterator]()
  }
}

export const NONE_INSTANCE: None = new NoneImpl()

export const none: None = NONE_INSTANCE

export const one = <T>(value: T): One<T> => new OneImpl(value)

export const two = <T>(a: T, b: T): Two<T> => new TwoImpl([a, b])

export const three = <T>(a: T, b: T, c: T): Three<T> => new ThreeImpl([a, b, c])

export const fromArray = <T>(arr: ReadonlyArray<T>): Solution<T> => {
  switch (arr.length) {
    case 0:
      return NONE_INSTANCE
    case 1:
      return one(arr[0] as T)
    case 2:
      return two(arr[0] as T, arr[1] as T)
    case 3:
      return three(arr[0] as T, arr[1] as T, arr[2] as T)
    default:
      invariant(false, `Solution can hold at most 3 values, got ${arr.length}`)
  }
}

export const isNone = <T>(s: Solution<T>): s is None => s._tag === 'none'

export const isSome = <T>(s: Solution<T>): s is Some<T> => s._tag !== 'none'

export const valueOrUndefined = <T>(s: Solution<T>): T | undefined =>
  isNone(s) ? undefined : s.value

export const last: {
  <T>(s: Some<T>): T
  <T>(s: Solution<T>): T | undefined
} = (<T>(s: Solution<T>): T | undefined => {
  switch (s._tag) {
    case 'none':
      return undefined
    case 'one':
      return s.value
    case 'two':
      return s.values[1]
    case 'three':
      return s.values[2]
  }
}) as never

export const min: {
  (s: Some<number>): number
  (s: Solution<number>): number | undefined
} = ((s: Solution<number>): number | undefined => {
  switch (s._tag) {
    case 'none':
      return undefined
    case 'one':
      return s.value
    case 'two':
      return Math.min(s.values[0], s.values[1])
    case 'three':
      return Math.min(s.values[0], s.values[1], s.values[2])
  }
}) as never

export const max: {
  (s: Some<number>): number
  (s: Solution<number>): number | undefined
} = ((s: Solution<number>): number | undefined => {
  switch (s._tag) {
    case 'none':
      return undefined
    case 'one':
      return s.value
    case 'two':
      return Math.max(s.values[0], s.values[1])
    case 'three':
      return Math.max(s.values[0], s.values[1], s.values[2])
  }
}) as never

export const unsafeLast = <T>(s: Solution<T>): T => {
  invariant(isSome(s), 'Solution.unsafeLast on empty Solution')
  return last(s)
}

export const unsafeMin = (s: Solution<number>): number => {
  invariant(isSome(s), 'Solution.unsafeMin on empty Solution')
  return min(s)
}

export const unsafeMax = (s: Solution<number>): number => {
  invariant(isSome(s), 'Solution.unsafeMax on empty Solution')
  return max(s)
}

export const filter = <T>(s: Solution<T>, predicate: (v: T) => boolean): Solution<T> => {
  switch (s._tag) {
    case 'none':
      return s
    case 'one':
      return predicate(s.value) ? s : NONE_INSTANCE
    case 'two': {
      const a = predicate(s.values[0])
      const b = predicate(s.values[1])
      if (a && b) {
        return s
      }
      if (a) {
        return one(s.values[0])
      }
      if (b) {
        return one(s.values[1])
      }
      return NONE_INSTANCE
    }
    case 'three': {
      const survivors: Array<T> = []
      if (predicate(s.values[0])) {
        survivors.push(s.values[0])
      }
      if (predicate(s.values[1])) {
        survivors.push(s.values[1])
      }
      if (predicate(s.values[2])) {
        survivors.push(s.values[2])
      }
      return fromArray(survivors)
    }
  }
}

export const filterInterval = (s: Solution<number>, i: Interval.Interval): Solution<number> =>
  filter(s, (v) => Interval.contains(i, v))

export const map = <A, B>(s: Solution<A>, f: (v: A) => B): Solution<B> => {
  switch (s._tag) {
    case 'none':
      return s
    case 'one':
      return one(f(s.value))
    case 'two':
      return two(f(s.values[0]), f(s.values[1]))
    case 'three':
      return three(f(s.values[0]), f(s.values[1]), f(s.values[2]))
  }
}

export const match = dual(
  2,
  <T, A, B>(
    self: Solution<T>,
    matcher: { readonly onNone: () => A; readonly onSome: (s: Some<T>) => B },
  ): A | B => (isNone(self) ? matcher.onNone() : matcher.onSome(self)),
)

// Re-export type aliases that the namespace consumers expect to see at runtime.
// (Pure type re-exports — no runtime cost.)
export type { AtMostOne, AtMostThree, AtMostTwo, None, One, Solution, Some, Three, Two }
