import { describe, expect, test } from 'vitest'
import { createIntervalTree, takeCenterInterval } from '../src/interval'

describe('takeCenterInterval', () => {
  test('takes the center interval for a large enough array', () => {
    expect(takeCenterInterval([0, 1, 2, 3, 4, 5])).toStrictEqual({
      center: [2, 3],
      left: [0, 1, 2],
      right: [3, 4, 5],
    })
  })

  test('handles one remaining interval', () => {
    expect(takeCenterInterval([0, 1])).toStrictEqual({
      center: [0, 1],
      left: null,
      right: null,
    })
  })

  test('handles two remaining intervals', () => {
    expect(takeCenterInterval([0, 1, 2])).toStrictEqual({
      center: [1, 2],
      left: [0, 1],
      right: null,
    })
  })

  test('handles three remaining intervals', () => {
    expect(takeCenterInterval([0, 1, 2, 3])).toStrictEqual({
      center: [1, 2],
      left: [0, 1],
      right: [2, 3],
    })
  })
})

describe('createIntervalTree', () => {
  const intervals = Array.from({ length: 101 }, (_, i) => i)

  const tree = createIntervalTree(intervals)

  test('finds intervals that are present (0)', () => {
    expect(tree.search(0)).toStrictEqual([0, 1])
  })

  test('finds intervals that are present (500.5)', () => {
    expect(tree.search(50.5)).toStrictEqual([50, 51])
  })

  test('finds intervals that are present (100)', () => {
    expect(tree.search(100)).toStrictEqual([99, 100])
  })

  test('does not find intervals that are not present (-1)', () => {
    expect(tree.search(-1)).toStrictEqual(null)
  })

  test('does not find intervals that are not present (1001.5)', () => {
    expect(tree.search(101.5)).toStrictEqual(null)
  })
})
