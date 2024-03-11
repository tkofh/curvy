import { describe, expect, test } from 'vitest'
import { splines } from '../src/splines'

describe('splines.basis.chunkCoefficients', () => {
  test('it makes basis coefficients with triplicated points', () => {
    const coefficients = splines.basis(true).chunkCoefficients([0, 1, 2, 3])
    expect(coefficients).toHaveLength(5)
  })

  test('it makes basis coefficients with non-triplicated points', () => {
    const coefficients = splines.basis(false).chunkCoefficients([0, 1, 2, 3])
    expect(coefficients).toHaveLength(1)
  })

  test('it throws for an invalid number of non-triplicated points', () => {
    expect(() => splines.basis(false).chunkCoefficients([0, 1, 2])).toThrow()
  })
})

describe('splines.bezier.chunkCoefficients', () => {
  test('it makes bezier coefficients', () => {
    const coefficients = splines.bezier.chunkCoefficients([0, 0, 0, 0, 0, 0, 0])
    expect(coefficients).toHaveLength(2)
  })

  test('it throws for an invalid number of points (6)', () => {
    expect(() => splines.bezier.chunkCoefficients([0, 0, 0, 0, 0, 0])).toThrow()
  })
  test('it throws for an invalid number of points (3)', () => {
    expect(() => splines.bezier.chunkCoefficients([0, 0, 0])).toThrow()
  })
})

describe('splines.cardinal.chunkCoefficients', () => {
  test('it makes cardinal coefficients with duplicated points', () => {
    const coefficients = splines
      .cardinal(0.5, true)
      .chunkCoefficients([0, 0, 0, 0])
    expect(coefficients).toHaveLength(3)
  })
  test('it makes cardinal coefficients with non-duplicated points', () => {
    const coefficients = splines
      .cardinal(0.5, false)
      .chunkCoefficients([0, 0, 0, 0])
    expect(coefficients).toHaveLength(1)
  })
  test('it throws for an invalid number of duplicated points', () => {
    expect(() => splines.cardinal(0.5, true).chunkCoefficients([0])).toThrow()
  })
  test('it throws for an invalid number of non-duplicated points', () => {
    expect(() =>
      splines.cardinal(0.5, false).chunkCoefficients([0, 0, 0]),
    ).toThrow()
  })
})

describe('splines.catmullRom.chunkCoefficients', () => {
  test('it makes catmull-rom coefficients with duplicated points', () => {
    const coefficients = splines
      .catmullRom(true)
      .chunkCoefficients([0, 0, 0, 0])
    expect(coefficients).toHaveLength(3)
  })
  test('it makes catmull-rom coefficients with non-duplicated points', () => {
    const coefficients = splines
      .catmullRom(false)
      .chunkCoefficients([0, 0, 0, 0])
    expect(coefficients).toHaveLength(1)
  })
  test('it throws for an invalid number of duplicated points', () => {
    expect(() => splines.catmullRom(true).chunkCoefficients([0])).toThrow()
  })
  test('it throws for an invalid number of non-duplicated points', () => {
    expect(() =>
      splines.catmullRom(false).chunkCoefficients([0, 0, 0]),
    ).toThrow()
  })
})

describe('splines.hermite.chunkCoefficients', () => {
  test('it makes hermite coefficients', () => {
    const coefficients = splines.hermite.chunkCoefficients([0, 0, 0, 0])
    expect(coefficients).toHaveLength(1)
  })
  test('it throws for an invalid number of points', () => {
    expect(() => splines.hermite.chunkCoefficients([0, 0, 0])).toThrow()
  })
})
