import { describe, expect, test } from 'vitest'
import * as vector2 from '../src/vector/vector2'
import * as vector3 from '../src/vector/vector3'
import * as vector4 from '../src/vector/vector4'

describe('vector2', () => {
  test('make', () => {
    expect(vector2.make(1, 2)).toMatchObject({
      x: 1,
      y: 2,
      [0]: 1,
      [1]: 2,
    })
  })
  test('isVector2', () => {
    expect(vector2.isVector2(vector2.make(1, 2))).toBe(true)
    expect(vector2.isVector2({ x: 1, y: 2, [0]: 1, [1]: 2 })).toBe(false)
  })
  test('magnitude', () => {
    expect(vector2.magnitude(vector2.make(2, 2))).toBe(2.82842712)
  })
  test('normalize', () => {
    expect(vector2.normalize(vector2.make(2, 2))).toEqual(
      vector2.make(Math.SQRT1_2, Math.SQRT1_2),
    )
  })
  test('dot', () => {
    expect(vector2.dot(vector2.make(1, 2), vector2.make(3, 4))).toBe(11)
  })
  test('components', () => {
    expect(vector2.components(vector2.make(1, 2))).toEqual([1, 2])
  })
  test('softmax', () => {
    expect(vector2.softmax(vector2.make(1, 2))).toEqual(
      vector2.make(0.26894142, 0.73105858),
    )
  })
  test('add', () => {
    expect(vector2.add(vector2.make(1, 2), vector2.make(3, 4))).toEqual(
      vector2.make(4, 6),
    )
  })
  test('subtract', () => {
    expect(vector2.subtract(vector2.make(1, 2), vector2.make(3, 4))).toEqual(
      vector2.make(-2, -2),
    )
  })
  test('hadamard', () => {
    expect(vector2.hadamard(vector2.make(1, 2), vector2.make(3, 4))).toEqual(
      vector2.make(3, 8),
    )
  })
})

describe('vector3', () => {
  test('make', () => {
    expect(vector3.make(1, 2, 3)).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
      [0]: 1,
      [1]: 2,
      [2]: 3,
    })
  })
  test('isVector3', () => {
    expect(vector3.isVector3(vector3.make(1, 2, 3))).toBe(true)
    expect(
      vector3.isVector3({ x: 1, y: 2, z: 3, [0]: 1, [1]: 2, [2]: 3 }),
    ).toBe(false)
  })
  test('magnitude', () => {
    expect(vector3.magnitude(vector3.make(2, 2, 2))).toBe(3.46410162)
  })
  test('normalize', () => {
    expect(vector3.normalize(vector3.make(2, 2, 2))).toEqual(
      vector3.make(0.57735027, 0.57735027, 0.57735027),
    )
  })
  test('dot', () => {
    expect(vector3.dot(vector3.make(1, 2, 3), vector3.make(3, 4, 5))).toBe(26)
  })
  test('components', () => {
    expect(vector3.components(vector3.make(1, 2, 3))).toEqual([1, 2, 3])
  })
  test('softmax', () => {
    expect(vector3.softmax(vector3.make(1, 2, 3))).toEqual(
      vector3.make(0.09003057, 0.24472847, 0.66524096),
    )
  })
  test('add', () => {
    expect(vector3.add(vector3.make(1, 2, 3), vector3.make(3, 4, 5))).toEqual(
      vector3.make(4, 6, 8),
    )
  })
  test('subtract', () => {
    expect(
      vector3.subtract(vector3.make(1, 2, 3), vector3.make(3, 4, 5)),
    ).toEqual(vector3.make(-2, -2, -2))
  })
  test('hadamard', () => {
    expect(
      vector3.hadamard(vector3.make(1, 2, 3), vector3.make(3, 4, 5)),
    ).toEqual(vector3.make(3, 8, 15))
  })
})

describe('vector4', () => {
  test('make', () => {
    expect(vector4.make(1, 2, 3, 4)).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
      w: 4,
      [0]: 1,
      [1]: 2,
      [2]: 3,
      [3]: 4,
    })
  })
  test('isVector4', () => {
    expect(vector4.isVector4(vector4.make(1, 2, 3, 4))).toBe(true)
    expect(
      vector4.isVector4({
        x: 1,
        y: 2,
        z: 3,
        w: 4,
        [0]: 1,
        [1]: 2,
        [2]: 3,
        [3]: 4,
      }),
    ).toBe(false)
  })
  test('magnitude', () => {
    expect(vector4.magnitude(vector4.make(2, 2, 2, 2))).toBe(4)
  })
  test('normalize', () => {
    expect(vector4.normalize(vector4.make(2, 2, 2, 2))).toEqual(
      vector4.make(0.5, 0.5, 0.5, 0.5),
    )
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
    expect(vector4.softmax(vector4.make(1, 2, 3, 4))).toEqual(
      vector4.make(0.0320586, 0.08714432, 0.23688282, 0.64391426),
    )
  })
  test('add', () => {
    expect(
      vector4.add(vector4.make(1, 2, 3, 4), vector4.make(3, 4, 5, 6)),
    ).toEqual(vector4.make(4, 6, 8, 10))
  })
  test('subtract', () => {
    expect(
      vector4.subtract(vector4.make(1, 2, 3, 4), vector4.make(3, 4, 5, 6)),
    ).toEqual(vector4.make(-2, -2, -2, -2))
  })
  test('hadamard', () => {
    expect(
      vector4.hadamard(vector4.make(1, 2, 3, 4), vector4.make(3, 4, 5, 6)),
    ).toEqual(vector4.make(3, 8, 15, 24))
  })
})
