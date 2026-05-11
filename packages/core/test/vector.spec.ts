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
    expect(vector2.magnitude(vector2.make(2, 2))).toBeCloseTo(Math.hypot(2, 2), 12)
  })
  test('normalize', () => {
    expect(vector2.normalize(vector2.make(2, 2))).toBeCloseToValue(
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
    expect(vector2.softmax(vector2.make(1, 2))).toBeCloseToValue(
      vector2.make(0.2689414213699951, 0.7310585786300049),
    )
  })
  test('add', () => {
    expect(vector2.add(vector2.make(1, 2), vector2.make(3, 4))).toBeCloseToValue(vector2.make(4, 6))
  })
  test('subtract', () => {
    expect(vector2.subtract(vector2.make(1, 2), vector2.make(3, 4))).toBeCloseToValue(
      vector2.make(-2, -2),
    )
  })
  test('hadamard', () => {
    expect(vector2.hadamard(vector2.make(1, 2), vector2.make(3, 4))).toBeCloseToValue(
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
    expect(vector3.isVector3({ x: 1, y: 2, z: 3, [0]: 1, [1]: 2, [2]: 3 })).toBe(false)
  })
  test('magnitude', () => {
    expect(vector3.magnitude(vector3.make(2, 2, 2))).toBeCloseTo(Math.hypot(2, 2, 2), 12)
  })
  test('normalize', () => {
    const inv = 1 / Math.sqrt(3)
    expect(vector3.normalize(vector3.make(2, 2, 2))).toBeCloseToValue(vector3.make(inv, inv, inv))
  })
  test('dot', () => {
    expect(vector3.dot(vector3.make(1, 2, 3), vector3.make(3, 4, 5))).toBe(26)
  })
  test('components', () => {
    expect(vector3.components(vector3.make(1, 2, 3))).toEqual([1, 2, 3])
  })
  test('softmax', () => {
    expect(vector3.softmax(vector3.make(1, 2, 3))).toBeCloseToValue(
      vector3.make(0.09003057317038046, 0.24472847105479764, 0.6652409557748218),
    )
  })
  test('add', () => {
    expect(vector3.add(vector3.make(1, 2, 3), vector3.make(3, 4, 5))).toBeCloseToValue(
      vector3.make(4, 6, 8),
    )
  })
  test('subtract', () => {
    expect(vector3.subtract(vector3.make(1, 2, 3), vector3.make(3, 4, 5))).toBeCloseToValue(
      vector3.make(-2, -2, -2),
    )
  })
  test('hadamard', () => {
    expect(vector3.hadamard(vector3.make(1, 2, 3), vector3.make(3, 4, 5))).toBeCloseToValue(
      vector3.make(3, 8, 15),
    )
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
    expect(vector4.magnitude(vector4.make(2, 2, 2, 2))).toBeCloseTo(4, 12)
  })
  test('normalize', () => {
    expect(vector4.normalize(vector4.make(2, 2, 2, 2))).toBeCloseToValue(
      vector4.make(0.5, 0.5, 0.5, 0.5),
    )
  })
  test('dot', () => {
    expect(vector4.dot(vector4.make(1, 2, 3, 4), vector4.make(3, 4, 5, 6))).toBe(50)
  })
  test('components', () => {
    expect(vector4.components(vector4.make(1, 2, 3, 4))).toEqual([1, 2, 3, 4])
  })
  test('softmax', () => {
    expect(vector4.softmax(vector4.make(1, 2, 3, 4))).toBeCloseToValue(
      vector4.make(
        0.03205860328008499,
        0.08714431874203257,
        0.23688281808991013,
        0.6439142598879724,
      ),
    )
  })
  test('add', () => {
    expect(vector4.add(vector4.make(1, 2, 3, 4), vector4.make(3, 4, 5, 6))).toBeCloseToValue(
      vector4.make(4, 6, 8, 10),
    )
  })
  test('subtract', () => {
    expect(vector4.subtract(vector4.make(1, 2, 3, 4), vector4.make(3, 4, 5, 6))).toBeCloseToValue(
      vector4.make(-2, -2, -2, -2),
    )
  })
  test('hadamard', () => {
    expect(vector4.hadamard(vector4.make(1, 2, 3, 4), vector4.make(3, 4, 5, 6))).toBeCloseToValue(
      vector4.make(3, 8, 15, 24),
    )
  })
})

describe('transpose', () => {
  test('Vector2.transpose packs two channels from two inputs', () => {
    const a = { x: 1, y: 2 }
    const b = { x: 3, y: 4 }
    const [xs, ys] = vector2.transpose([a, b], (p) => [p.x, p.y])
    expect(xs).toBeCloseToValue(vector2.make(1, 3))
    expect(ys).toBeCloseToValue(vector2.make(2, 4))
  })

  test('Vector3.transpose packs three channels from three inputs', () => {
    const a = { x: 1, y: 2, w: 0.5 }
    const b = { x: 3, y: 4, w: 1 }
    const c = { x: 5, y: 6, w: 2 }
    const [xs, ys, ws] = vector3.transpose([a, b, c], (p) => [p.x, p.y, p.w])
    expect(xs).toBeCloseToValue(vector3.make(1, 3, 5))
    expect(ys).toBeCloseToValue(vector3.make(2, 4, 6))
    expect(ws).toBeCloseToValue(vector3.make(0.5, 1, 2))
  })

  test('Vector4.transpose packs the splines-pipeline channels from four inputs', () => {
    // The canonical use case: gather x and y across four control points.
    const p0 = vector2.make(0, 0)
    const p1 = vector2.make(1, 2)
    const p2 = vector2.make(3, 4)
    const p3 = vector2.make(5, 6)
    const [xs, ys] = vector4.transpose([p0, p1, p2, p3], (p) => [p.x, p.y])
    expect(xs).toBeCloseToValue(vector4.make(0, 1, 3, 5))
    expect(ys).toBeCloseToValue(vector4.make(0, 2, 4, 6))
  })

  test('Vector4.transpose fuses lift + transpose for rational/weighted inputs', () => {
    // Lift each Vector2.Weighted to homogeneous (w·x, w·y, w) inside the
    // projection — same shape RationalCubicCurve2d.fromBezierPoints uses.
    const p0 = vector2.makeWeighted(1, 0, 1)
    const p1 = vector2.makeWeighted(1, 1, 2)
    const p2 = vector2.makeWeighted(0, 1, 2)
    const p3 = vector2.makeWeighted(0, 0, 1)
    const [xs, ys, ws] = vector4.transpose([p0, p1, p2, p3], (p) => [
      p.x * p.weight,
      p.y * p.weight,
      p.weight,
    ])
    expect(xs).toBeCloseToValue(vector4.make(1, 2, 0, 0))
    expect(ys).toBeCloseToValue(vector4.make(0, 2, 2, 0))
    expect(ws).toBeCloseToValue(vector4.make(1, 2, 2, 1))
  })

  test('output tuple arity matches projection arity', () => {
    // Single-channel projection → one output vector.
    const result = vector4.transpose([{ v: 10 }, { v: 20 }, { v: 30 }, { v: 40 }], (p) => [p.v])
    expect(result).toHaveLength(1)
    expect(result[0]).toBeCloseToValue(vector4.make(10, 20, 30, 40))
  })
})
