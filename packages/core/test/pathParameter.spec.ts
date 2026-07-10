import { describe, expect, test } from 'vitest'
import * as cubicCurve2d from '../src/curve/cubic2d.ts'
import * as cubicPath2d from '../src/path/cubic2d.ts'
import * as cubicPolynomial from '../src/polynomial/cubic.ts'

// Two unit-speed segments along the x axis: x covers [0, 1], then [1, 2].
const segment = (x0: number) =>
  cubicCurve2d.fromPolynomials(cubicPolynomial.make(x0, 1, 0, 0), cubicPolynomial.make(0, 0, 0, 0))

const path = cubicPath2d.make(segment(0), segment(1))

describe('path solve parameter contract', () => {
  test('snaps parameters within EPSILON of the boundaries', () => {
    expect(cubicPath2d.solve(path, 1 + 1e-12)).toEqual(cubicPath2d.solve(path, 1))
    expect(cubicPath2d.solve(path, -1e-12)).toEqual(cubicPath2d.solve(path, 0))
  })
  test('evaluates the junction by uniform subdivision', () => {
    expect(cubicPath2d.solve(path, 0.5).x).toBeCloseTo(1)
  })
  test('throws beyond the grazing band', () => {
    expect(() => cubicPath2d.solve(path, 1.5)).toThrow('path parameter')
    expect(() => cubicPath2d.solve(path, -0.5)).toThrow('path parameter')
    expect(() => cubicPath2d.solve(path, Number.NaN)).toThrow('path parameter')
  })
})
