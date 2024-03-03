import { describe, test } from 'vitest'
import { bezier, catmullRom, computeMonotonicity } from '../src'

describe('computeMonotonicity', () => {
  test('calculates positive monotonicity', ({ expect }) => {
    expect(
      computeMonotonicity([{ x: 0 }, { x: 1 }, { x: 2 }, { x: 3 }], catmullRom),
    ).toStrictEqual({
      x: 'positive',
    })
  })
  test('calculates negative monotonicity', ({ expect }) => {
    expect(
      computeMonotonicity([{ x: 3 }, { x: 2 }, { x: 1 }, { x: 0 }], catmullRom),
    ).toStrictEqual({
      x: 'negative',
    })
  })
  test('calculates no monotonicity', ({ expect }) => {
    expect(
      computeMonotonicity([{ x: 0 }, { x: 2 }, { x: -1 }, { x: 1 }], bezier),
    ).toStrictEqual({
      x: 'none',
    })
  })
})
