import { describe, expect, test } from 'vitest'
import * as Interval from '../src/interval/interval'

describe('interval', () => {
  test('make', () => {
    expect(Interval.make(0)).toMatchObject({
      start: 0,
      end: 0,
      kind: 'closed',
    })
    expect(Interval.make(0, 1)).toMatchObject({
      start: 0,
      end: 1,
      kind: 'closed',
    })
    expect(() => Interval.make(0, -1)).toThrowError()
  })

  test('makeOpenStart / makeOpenEnd / makeOpen', () => {
    expect(Interval.makeOpenStart(0, 1)).toMatchObject({ start: 0, end: 1, kind: 'open-start' })
    expect(Interval.makeOpenEnd(0, 1)).toMatchObject({ start: 0, end: 1, kind: 'open-end' })
    expect(Interval.makeOpen(0, 1)).toMatchObject({ start: 0, end: 1, kind: 'open' })
  })

  test('fromSize', () => {
    expect(Interval.fromSize(10)).toMatchObject(Interval.make(0, 10))
    expect(Interval.fromSize(5, 10)).toMatchObject(Interval.make(5, 15))
  })

  test('fromMinMax accepts values in any order', () => {
    expect(Interval.fromMinMax(3, 1, 2)).toMatchObject(Interval.make(1, 3))
  })

  test('isInterval', () => {
    expect(Interval.isInterval(Interval.make(0))).toBe(true)
    expect(Interval.isInterval(Interval.makeOpen(0, 1))).toBe(true)
    expect(Interval.isInterval({ start: 0, end: 1 })).toBe(false)
  })

  test('size is kind-agnostic', () => {
    expect(Interval.size(Interval.make(0))).toBe(0)
    expect(Interval.size(Interval.make(0, 1))).toBe(1)
    expect(Interval.size(Interval.makeOpen(0, 1))).toBe(1)
  })

  test('filter respects kind', () => {
    expect(Interval.filter(Interval.make(0, 1), [-0.5, 0, 0.5, 1, 1.5])).toEqual([0, 0.5, 1])
    expect(Interval.filter(Interval.makeOpen(0, 1), [-0.5, 0, 0.5, 1, 1.5])).toEqual([0.5])
    expect(Interval.filter(Interval.makeOpenStart(0, 1), [0, 0.5, 1])).toEqual([0.5, 1])
    expect(Interval.filter(Interval.makeOpenEnd(0, 1), [0, 0.5, 1])).toEqual([0, 0.5])
  })

  test('contains dispatches on kind', () => {
    expect(Interval.contains(Interval.make(0, 1), 0)).toBe(true)
    expect(Interval.contains(Interval.make(0, 1), 1)).toBe(true)
    expect(Interval.contains(Interval.makeOpenStart(0, 1), 0)).toBe(false)
    expect(Interval.contains(Interval.makeOpenStart(0, 1), 1)).toBe(true)
    expect(Interval.contains(Interval.makeOpenEnd(0, 1), 0)).toBe(true)
    expect(Interval.contains(Interval.makeOpenEnd(0, 1), 1)).toBe(false)
    expect(Interval.contains(Interval.makeOpen(0, 1), 0)).toBe(false)
    expect(Interval.contains(Interval.makeOpen(0, 1), 1)).toBe(false)
    expect(Interval.contains(Interval.makeOpen(0, 1), 0.5)).toBe(true)
  })

  test('clamp is kind-agnostic', () => {
    expect(Interval.clamp(Interval.make(0, 1), -0.5)).toBe(0)
    expect(Interval.clamp(Interval.make(0, 1), 0)).toBe(0)
    expect(Interval.clamp(Interval.make(0, 1), 0.5)).toBe(0.5)
    expect(Interval.clamp(Interval.make(0, 1), 1)).toBe(1)
    expect(Interval.clamp(Interval.make(0, 1), 1.5)).toBe(1)

    expect(Interval.clamp(Interval.make(0, 1), [-0.5, 0, 0.5, 1, 1.5])).toEqual([0, 0, 0.5, 1, 1])

    expect(Interval.clamp(Interval.makeOpen(0, 1), -0.5)).toBe(0)
    expect(Interval.clamp(Interval.makeOpen(0, 1), 1.5)).toBe(1)
  })

  test('lerp / normalize / remap are kind-agnostic', () => {
    expect(Interval.lerp(Interval.make(0, 2), 0.5)).toBe(1)
    expect(Interval.lerp(Interval.makeOpen(0, 2), 0.5)).toBe(1)
    expect(Interval.normalize(Interval.make(0, 10), 5)).toBe(0.5)
    expect(Interval.remap(Interval.make(0, 1), Interval.make(0, 2), 0.5)).toBe(1)
    expect(Interval.remap(Interval.make(0, 1), Interval.make(0.1, 0.2), 1)).toBe(0.2)
  })

  test('equals requires matching kind', () => {
    expect(Interval.equals(Interval.make(0, 1), Interval.make(0, 1))).toBe(true)
    expect(Interval.equals(Interval.make(0, 1), Interval.makeOpen(0, 1))).toBe(false)
    expect(Interval.equals(Interval.makeOpenStart(0, 1), Interval.makeOpenStart(0, 1))).toBe(true)
    expect(Interval.equals(Interval.make(0, 1), Interval.make(0, 2))).toBe(false)
  })

  test('aligned compares numeric range only', () => {
    expect(Interval.aligned(Interval.make(0, 1), Interval.makeOpen(0, 1))).toBe(true)
    expect(Interval.aligned(Interval.make(0, 1), Interval.make(0, 2))).toBe(false)
    expect(Interval.aligned({ start: 0, end: 1 }, Interval.make(0, 1))).toBe(true)
  })

  describe('modifiers', () => {
    test('toStartOpen', () => {
      expect(Interval.toStartOpen(Interval.make(0, 1)).kind).toBe('open-start')
      expect(Interval.toStartOpen(Interval.makeOpenEnd(0, 1)).kind).toBe('open')
      const openStart = Interval.makeOpenStart(0, 1)
      expect(Interval.toStartOpen(openStart)).toBe(openStart)
    })
    test('toStartClosed', () => {
      expect(Interval.toStartClosed(Interval.makeOpenStart(0, 1)).kind).toBe('closed')
      expect(Interval.toStartClosed(Interval.makeOpen(0, 1)).kind).toBe('open-end')
      const closed = Interval.make(0, 1)
      expect(Interval.toStartClosed(closed)).toBe(closed)
    })
    test('toEndOpen', () => {
      expect(Interval.toEndOpen(Interval.make(0, 1)).kind).toBe('open-end')
      expect(Interval.toEndOpen(Interval.makeOpenStart(0, 1)).kind).toBe('open')
      const openEnd = Interval.makeOpenEnd(0, 1)
      expect(Interval.toEndOpen(openEnd)).toBe(openEnd)
    })
    test('toEndClosed', () => {
      expect(Interval.toEndClosed(Interval.makeOpenEnd(0, 1)).kind).toBe('closed')
      expect(Interval.toEndClosed(Interval.makeOpen(0, 1)).kind).toBe('open-start')
      const closed = Interval.make(0, 1)
      expect(Interval.toEndClosed(closed)).toBe(closed)
    })
    test('toOpen / toClosed force whole-interval kind', () => {
      expect(Interval.toOpen(Interval.make(0, 1)).kind).toBe('open')
      expect(Interval.toOpen(Interval.makeOpenStart(0, 1)).kind).toBe('open')
      const open = Interval.makeOpen(0, 1)
      expect(Interval.toOpen(open)).toBe(open)

      expect(Interval.toClosed(Interval.makeOpen(0, 1)).kind).toBe('closed')
      expect(Interval.toClosed(Interval.makeOpenEnd(0, 1)).kind).toBe('closed')
      const closed = Interval.make(0, 1)
      expect(Interval.toClosed(closed)).toBe(closed)
    })
  })

  describe('predicates', () => {
    test('variant predicates', () => {
      expect(Interval.isClosed(Interval.make(0, 1))).toBe(true)
      expect(Interval.isClosed(Interval.makeOpen(0, 1))).toBe(false)
      expect(Interval.isOpen(Interval.makeOpen(0, 1))).toBe(true)
      expect(Interval.isOpenStart(Interval.makeOpenStart(0, 1))).toBe(true)
      expect(Interval.isOpenEnd(Interval.makeOpenEnd(0, 1))).toBe(true)
    })
    test('edge predicates', () => {
      expect(Interval.isOpenAtStart(Interval.makeOpenStart(0, 1))).toBe(true)
      expect(Interval.isOpenAtStart(Interval.makeOpen(0, 1))).toBe(true)
      expect(Interval.isOpenAtStart(Interval.makeOpenEnd(0, 1))).toBe(false)

      expect(Interval.isOpenAtEnd(Interval.makeOpenEnd(0, 1))).toBe(true)
      expect(Interval.isOpenAtEnd(Interval.makeOpen(0, 1))).toBe(true)
      expect(Interval.isOpenAtEnd(Interval.makeOpenStart(0, 1))).toBe(false)

      expect(Interval.isClosedAtStart(Interval.make(0, 1))).toBe(true)
      expect(Interval.isClosedAtStart(Interval.makeOpenEnd(0, 1))).toBe(true)
      expect(Interval.isClosedAtStart(Interval.makeOpenStart(0, 1))).toBe(false)

      expect(Interval.isClosedAtEnd(Interval.make(0, 1))).toBe(true)
      expect(Interval.isClosedAtEnd(Interval.makeOpenStart(0, 1))).toBe(true)
      expect(Interval.isClosedAtEnd(Interval.makeOpenEnd(0, 1))).toBe(false)
    })
  })

  test('unit and biunit are closed', () => {
    expect(Interval.unit.kind).toBe('closed')
    expect(Interval.unit).toMatchObject({ start: 0, end: 1 })
    expect(Interval.biunit.kind).toBe('closed')
    expect(Interval.biunit).toMatchObject({ start: -1, end: 1 })
  })
})
