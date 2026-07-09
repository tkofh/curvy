import { describe, expect, test } from 'vitest'
import { coincident, epsEquals } from '../src/number.ts'

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
    expect(coincident(0, 0.5, { absolute: 1 })).toBe(true)
    expect(coincident(1e9, 1e9 + 1, { relative: 1e-8 })).toBe(true)
    expect(coincident(1, 1 + 1e-11, { absolute: 0, relative: 0 })).toBe(false)
  })
})
