import { describe, test } from 'vitest'
import { bezierPoints } from '../src'

describe('bezier builder', () => {
  test('it builds bezier splines with broken segments', ({ expect }) => {
    expect(
      bezierPoints([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
      ]).brokenTo({ x: 0, y: 0 }, { x: 0, y: -1 }, { x: 1, y: -1 }).points,
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
      bezierPoints([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
      ]).asymmetricTo(1.5, { x: 2, y: -1.5 }, { x: 2, y: 0 }).points,
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
      bezierPoints([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
      ]).symmetricTo({ x: 2, y: -1 }, { x: 2, y: 0 }).points,
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
