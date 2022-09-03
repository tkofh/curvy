import { describe, test } from 'vitest'
import { bezierPoints } from '../src/builder'

describe('bezier builder', () => {
  test('it builds bezier splines with broken segments', ({ expect }) => {
    expect(
      bezierPoints([0, 0], [0, 1], [1, 1], [1, 0]).brokenTo([0, 0], [0, -1], [1, -1]).points
    ).toStrictEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
    ])
  })

  test('it builds bezier splines with asymmetric segments', ({ expect }) => {
    expect(
      bezierPoints([0, 0], [0, 1], [1, 1], [1, 0]).asymmetricTo(1.5, [2, -1.5], [2, 0]).points
    ).toStrictEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: -1.5 },
      { x: 2, y: -1.5 },
      { x: 2, y: 0 },
    ])
  })

  test('it builds bezier splines with symmetric segments', ({ expect }) => {
    expect(
      bezierPoints([0, 0], [0, 1], [1, 1], [1, 0]).symmetricTo([2, -1], [2, 0]).points
    ).toStrictEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 2, y: -1 },
      { x: 2, y: 0 },
    ])
  })
})
