import { describe, expect, test } from 'vitest'
import * as Interval from '../src/interval'
import * as Solution from '../src/solution'

describe('Solution constructors', () => {
  test('none has tag/length and is empty', () => {
    expect(Solution.none._tag).toBe('none')
    expect(Solution.none.length).toBe(0)
    expect([...Solution.none]).toEqual([])
  })
  test('one carries a value with the right tag/length', () => {
    const s = Solution.one(5)
    expect(s._tag).toBe('one')
    expect(s.length).toBe(1)
    expect(s.value).toBe(5)
    expect([...s]).toEqual([5])
  })
  test('two carries values with the right tag/length', () => {
    const s = Solution.two(1, 2)
    expect(s._tag).toBe('two')
    expect(s.length).toBe(2)
    expect(s.values).toEqual([1, 2])
    expect([...s]).toEqual([1, 2])
  })
  test('three carries values with the right tag/length', () => {
    const s = Solution.three(1, 2, 3)
    expect(s._tag).toBe('three')
    expect(s.length).toBe(3)
    expect(s.values).toEqual([1, 2, 3])
    expect([...s]).toEqual([1, 2, 3])
  })
  test('fromArray dispatches by length', () => {
    expect(Solution.fromArray([])._tag).toBe('none')
    expect(Solution.fromArray([5])).toEqual(Solution.one(5))
    expect(Solution.fromArray([1, 2])).toEqual(Solution.two(1, 2))
    expect(Solution.fromArray([1, 2, 3])).toEqual(Solution.three(1, 2, 3))
    expect(() => Solution.fromArray([1, 2, 3, 4])).toThrow(/at most 3 values/)
  })
})

describe('Solution predicates', () => {
  test('isNone narrows the empty case', () => {
    expect(Solution.isNone(Solution.none)).toBe(true)
    expect(Solution.isNone(Solution.one(5))).toBe(false)
  })
  test('isSome narrows the non-empty cases', () => {
    expect(Solution.isSome(Solution.none)).toBe(false)
    expect(Solution.isSome(Solution.one(5))).toBe(true)
    expect(Solution.isSome(Solution.three(1, 2, 3))).toBe(true)
  })
})

describe('Solution accessors', () => {
  test('.value is accessible on every Some<T> variant', () => {
    expect(Solution.one(5).value).toBe(5)
    expect(Solution.two(7, 9).value).toBe(7)
    expect(Solution.three(1, 2, 3).value).toBe(1)
  })
  test('valueOrUndefined returns the primary value or undefined', () => {
    expect(Solution.valueOrUndefined(Solution.none)).toBeUndefined()
    expect(Solution.valueOrUndefined(Solution.one(5))).toBe(5)
    expect(Solution.valueOrUndefined(Solution.three(1, 2, 3))).toBe(1)
  })
  test('last on empty returns undefined; on populated returns the last element', () => {
    expect(Solution.last(Solution.none)).toBeUndefined()
    expect(Solution.last(Solution.one(5))).toBe(5)
    expect(Solution.last(Solution.two(7, 9))).toBe(9)
    expect(Solution.last(Solution.three(1, 2, 3))).toBe(3)
  })
  test('min/max on numeric solutions', () => {
    expect(Solution.min(Solution.three(3, 1, 2))).toBe(1)
    expect(Solution.max(Solution.three(3, 1, 2))).toBe(3)
    expect(Solution.min(Solution.none)).toBeUndefined()
    expect(Solution.max(Solution.none)).toBeUndefined()
  })
  test('unsafe variants throw on empty', () => {
    expect(() => Solution.unsafeLast(Solution.none)).toThrow(/empty Solution/)
    expect(() => Solution.unsafeMin(Solution.none)).toThrow(/empty Solution/)
    expect(() => Solution.unsafeMax(Solution.none)).toThrow(/empty Solution/)
  })
  test('unsafe variants return values on populated solutions', () => {
    expect(Solution.unsafeLast(Solution.three(1, 2, 3))).toBe(3)
    expect(Solution.unsafeMin(Solution.three(3, 1, 2))).toBe(1)
    expect(Solution.unsafeMax(Solution.three(3, 1, 2))).toBe(3)
  })
})

describe('Solution transformations', () => {
  test('filter retains values matching the predicate', () => {
    const s = Solution.three(1, 2, 3)
    expect(Solution.filter(s, (v) => v > 1)).toEqual(Solution.two(2, 3))
    expect(Solution.filter(s, (v) => v > 5)).toEqual(Solution.none)
  })
  test('clip keeps values within an interval', () => {
    const s = Solution.three(-1, 0.5, 2)
    expect([...Solution.clip(s, Interval.unit)]).toEqual([0.5])
  })
  test('clip respects the interval kind', () => {
    const s = Solution.three(0, 0.5, 1)
    expect([...Solution.clip(s, Interval.unit)]).toEqual([0, 0.5, 1])
    expect([...Solution.clip(s, Interval.toOpen(Interval.unit))]).toEqual([0.5])
    expect([...Solution.clip(s, Interval.makeOpenStart(0, 1))]).toEqual([0.5, 1])
  })
  test('map transforms each element', () => {
    const s = Solution.three(1, 2, 3)
    expect(Solution.map(s, (v) => v * 2)).toEqual(Solution.three(2, 4, 6))
  })
  test('map on none yields none', () => {
    expect(Solution.isNone(Solution.map(Solution.none, (v: number) => v * 2))).toBe(true)
  })
})

describe('Solution match', () => {
  test('match on none calls onNone', () => {
    const result = Solution.match(Solution.none, {
      onNone: () => 'empty',
      onSome: () => 'has value',
    })
    expect(result).toBe('empty')
  })
  test('match on one provides .value via the Some branch', () => {
    const result = Solution.match(Solution.one(5), {
      onNone: () => 0,
      onSome: ({ value }) => value * 2,
    })
    expect(result).toBe(10)
  })
  test('pipeable form composes through pipe', () => {
    const result = Solution.one(5).pipe(
      Solution.match({
        onNone: () => 0,
        onSome: ({ value }) => value + 1,
      }),
    )
    expect(result).toBe(6)
  })
})

describe('Solution iteration and pipe', () => {
  test('a Solution is iterable directly via for-of', () => {
    const collected: Array<number> = []
    for (const v of Solution.three(1, 2, 3)) {
      collected.push(v)
    }
    expect(collected).toEqual([1, 2, 3])
  })
  test('a Solution spreads into an array', () => {
    expect([...Solution.three(1, 2, 3)]).toEqual([1, 2, 3])
  })
  test('a Solution can pipe through transformation functions', () => {
    const out = Solution.one(5).pipe((s) => Solution.map(s, (v) => v * 3))
    expect([...out]).toEqual([15])
  })
})
