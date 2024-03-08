import { describe, expect, test } from 'vitest'
import { bezier, convertScalars, hermite } from '../src'

describe('convertControlPoint', () => {
  test('it converts bezier [0, 1, 0, 1] to hermite', () => {
    expect(convertScalars([0, 1, 0, 1], bezier, hermite)).toStrictEqual([
      0, 3, 1, 3,
    ])
  })

  test('it converts bezier [0, 0, 1, 1] to hermite', () => {
    expect(convertScalars([0, 0, 1, 1], bezier, hermite)).toStrictEqual([
      0, 0, 1, 0,
    ])
  })
})
