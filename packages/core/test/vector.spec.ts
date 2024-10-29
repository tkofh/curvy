import { describe, expect, test } from 'vitest'
import * as vector2 from '../src/vector/vector2'
import * as vector3 from '../src/vector/vector3'
import * as vector4 from '../src/vector/vector4'

describe('vector2', () => {
  test('make', () => {
    expect(vector2.make(1, 2)).toMatchObject({
      v0: 1,
      v1: 2,
    })
    expect(vector2.make(1.5555, 0, 3)).toMatchObject({
      v0: 1.556,
      v1: 0,

      precision: 3,
    })
  })

  test('isVector2', () => {
    expect(vector2.isVector2(vector2.make(1, 2))).toBe(true)
    expect(vector2.isVector2({ v0: 1, v1: 2 })).toBe(false)
  })

  test('magnitude', () => {
    expect(vector2.magnitude(vector2.make(2, 2, 2))).toBe(2.83)
  })

  test('dot', () => {
    expect(vector2.dot(vector2.make(1, 2), vector2.make(3, 4))).toBe(11)
  })

  test('components', () => {
    expect(vector2.components(vector2.make(1, 2))).toEqual([1, 2])
  })

  test('softmax', () => {
    expect(vector2.softmax(vector2.make(1, 2, 4))).toEqual(
      vector2.make(0.2689, 0.7311, 4),
    )
  })
})

describe('vector3', () => {
  test('make', () => {
    expect(vector3.make(1, 2, 3)).toMatchObject({
      v0: 1,
      v1: 2,
      v2: 3,
    })
    expect(vector3.make(1.55555, 0, 0, 4)).toMatchObject({
      v0: 1.5556,
      v1: 0,
      v2: 0,

      precision: 4,
    })
  })

  test('isVector3', () => {
    expect(vector3.isVector3(vector3.make(1, 2, 3))).toBe(true)
    expect(vector3.isVector3({ v0: 1, v1: 2, v2: 3 })).toBe(false)
  })

  test('magnitude', () => {
    expect(vector3.magnitude(vector3.make(2, 2, 2, 2))).toBe(3.46)
  })

  test('dot', () => {
    expect(vector3.dot(vector3.make(1, 2, 3), vector3.make(3, 4, 5))).toBe(26)
  })

  test('components', () => {
    expect(vector3.components(vector3.make(1, 2, 3))).toEqual([1, 2, 3])
  })

  test('softmax', () => {
    expect(vector3.softmax(vector3.make(1, 2, 3, 4))).toEqual(
      vector3.make(0.09, 0.2447, 0.6652, 4),
    )
  })
})

describe('vector4', () => {
  test('make', () => {
    expect(vector4.make(1, 2, 3, 4)).toMatchObject({
      v0: 1,
      v1: 2,
      v2: 3,
      v3: 4,
    })
    expect(vector4.make(1.555555, 0, 3, 4, 5)).toMatchObject({
      v0: 1.55556,
      v1: 0,
      v2: 3,
      v3: 4,

      precision: 5,
    })
  })

  test('isVector4', () => {
    expect(vector4.isVector4(vector4.make(1, 2, 3, 4))).toBe(true)
    expect(vector4.isVector4({ v0: 1, v1: 2, v2: 3, v3: 4 })).toBe(false)
  })

  test('magnitude', () => {
    expect(vector4.magnitude(vector4.make(2, 2, 2, 2, 2))).toBe(4)
  })

  test('dot', () => {
    expect(
      vector4.dot(vector4.make(1, 2, 3, 4), vector4.make(3, 4, 5, 6)),
    ).toBe(50)
  })

  test('components', () => {
    expect(vector4.components(vector4.make(1, 2, 3, 4))).toEqual([1, 2, 3, 4])
  })

  test('softmax', () => {
    expect(vector4.softmax(vector4.make(1, 2, 3, 4, 5))).toEqual(
      vector4.make(0.03206, 0.08714, 0.23688, 0.64391, 5),
    )
  })
})
