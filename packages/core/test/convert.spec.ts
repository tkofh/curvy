import { describe, expect, test } from 'vitest'
import { convertScalars } from '../src/convert'
import { bezier, hermite } from '../src/splines'

describe('convertControlPoint', () => {
  test('it converts bezier [0, 1, 0, 1] to hermite', () => {
    expect(
      convertScalars([0, 1, 0, 1], bezier.matrix, hermite.matrix),
    ).toStrictEqual([0, 3, 1, 3])
  })

  test('it converts bezier [0, 0, 1, 1] to hermite', () => {
    expect(
      convertScalars([0, 0, 1, 1], bezier.matrix, hermite.matrix),
    ).toStrictEqual([0, 0, 1, 0])
  })
})
