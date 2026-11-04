import { describe, expect, test } from 'vitest'
import {
  atMost,
  before,
  coincident,
  epsEquals,
  inside,
  overlaps,
  touches,
  within,
} from '../src/number.ts'

describe('coincident', () => {
  test('covers the neighborhood of zero with the absolute floor', () => {
    expect(coincident(0, 0)).toBe(true)
    expect(coincident(0, 1e-11)).toBe(true)
    expect(coincident(1e-11, -1e-11)).toBe(true)
    expect(coincident(0, 1e-9)).toBe(false)
  })

  test('is never narrower than the absolute comparison', () => {
    for (const [a, b] of [
      [1, 1 + 1e-11],
      [-2, -2 - 1e-11],
      [1e6, 1e6 + 1e-11],
    ] as const) {
      expect(epsEquals(a, b)).toBe(true)
      expect(coincident(a, b)).toBe(true)
    }
  })

  test('widens with magnitude', () => {
    // half an ulp of 1e9 is ~1.2e-7 — pure storage noise at that magnitude,
    // invisible to the absolute band but coincident under the relative term
    expect(epsEquals(1e9, 1e9 + 1.2e-7)).toBe(false)
    expect(coincident(1e9, 1e9 + 1.2e-7)).toBe(true)
    // a genuine unit-sized difference at the same magnitude stays distinct
    expect(coincident(1e9, 1e9 + 1)).toBe(false)
  })

  test('accepts explicit tolerance overrides', () => {
    expect(coincident(0, 0.5, 1)).toBe(true)
    expect(coincident(1e9, 1e9 + 1, undefined, 1e-8)).toBe(true)
    expect(coincident(1, 1 + 1e-11, 0, 0)).toBe(false)
  })
})

describe('ordering', () => {
  const noise = 0.1 + 0.2 // 0.30000000000000004

  test.each<[string, number, number, boolean, boolean]>([
    // name, a, b, before(a, b), atMost(a, b)
    ['less', 1, 2, true, true],
    ['greater', 2, 1, false, false],
    ['equal', 1, 1, false, true],
    ['less by rounding noise', 0.3, noise, false, true],
    ['greater by rounding noise', noise, 0.3, false, true],
    ['less at large magnitude', 1e9, 1e9 + 1, true, true],
    ['noise at large magnitude', 1e9 + 1.2e-7, 1e9, false, true],
    ['finite before infinity', 1e300, Infinity, true, true],
    ['infinity after finite', Infinity, 1e300, false, false],
    ['negative infinity first', -Infinity, -1e300, true, true],
    ['infinity against itself', Infinity, Infinity, false, true],
    ['NaN first', Number.NaN, 1, false, false],
    ['NaN second', 1, Number.NaN, false, false],
  ])('%s', (_, a, b, isBefore, isAtMost) => {
    expect(before(a, b)).toBe(isBefore)
    expect(atMost(a, b)).toBe(isAtMost)
  })

  test('accepts explicit tolerance overrides', () => {
    expect(before(0, 0.5, 1)).toBe(false)
    expect(atMost(0.5, 0, 1)).toBe(true)
    expect(before(1, 1 + 1e-11, 0, 0)).toBe(true)
  })

  test('within and inside', () => {
    expect(within(0, 0, 1)).toBe(true)
    expect(within(1 + 1e-13, 0, 1)).toBe(true)
    expect(within(2, 0, 1)).toBe(false)
    expect(inside(0.5, 0, 1)).toBe(true)
    expect(inside(0, 0, 1)).toBe(false)
    expect(inside(1e-13, 0, 1)).toBe(false)
    expect(inside(5, 0, Infinity)).toBe(true)
  })

  test.each<[string, [number, number, number, number], boolean, boolean]>([
    // name, ranges, overlaps, touches
    ['crossing', [0, 2, 1, 3], true, true],
    ['nested', [0, 3, 1, 2], true, true],
    ['end to end', [0, 1, 1, 2], false, true],
    ['end to end by rounding noise', [0, 0.3, noise, 1], false, true],
    ['apart', [0, 1, 2, 3], false, false],
    ['a point strictly inside', [1, 1, 0, 2], true, true],
    ['a point on the end', [2, 2, 0, 2], false, true],
    ['against a half-infinite range', [5, 6, 0, Infinity], true, true],
  ])('ranges %s', (_, [a0, a1, b0, b1], isOverlapping, isTouching) => {
    expect(overlaps(a0, a1, b0, b1)).toBe(isOverlapping)
    expect(overlaps(b0, b1, a0, a1)).toBe(isOverlapping)
    expect(touches(a0, a1, b0, b1)).toBe(isTouching)
    expect(touches(b0, b1, a0, a1)).toBe(isTouching)
  })
})
