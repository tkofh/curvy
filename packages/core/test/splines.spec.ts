import { describe, expect, test } from 'vitest'
import {
  createBasisCoefficients,
  createBezierCoefficients,
  createCardinalCoefficients,
  createCatmullRomCoefficients,
  createHermiteCoefficients,
} from '../src/splines'

describe('createBasisCoefficients', () => {
  test('it makes basis coefficients with triplicated points', () => {
    const coefficients = createBasisCoefficients([0, 1, 2, 3], true)
    expect(coefficients).toHaveLength(5)
  })

  test('it makes basis coefficients with non-triplicated points', () => {
    const coefficients = createBasisCoefficients([0, 1, 2, 3], false)
    expect(coefficients).toHaveLength(1)
  })

  test('it throws for an invalid number of non-triplicated points', () => {
    expect(() => createBasisCoefficients([0, 1, 2], false)).toThrow()
  })
})

describe('createBezierCoefficients', () => {
  test('it makes bezier coefficients', () => {
    const coefficients = createBezierCoefficients([0, 0, 0, 0, 0, 0, 0])
    expect(coefficients).toHaveLength(2)
  })

  test('it throws for an invalid number of points (6)', () => {
    expect(() => createBezierCoefficients([0, 0, 0, 0, 0, 0])).toThrow()
  })
  test('it throws for an invalid number of points (3)', () => {
    expect(() => createBezierCoefficients([0, 0, 0])).toThrow()
  })
})

describe('createCardinalCoefficients', () => {
  test('it makes cardinal coefficients with duplicated points', () => {
    const coefficients = createCardinalCoefficients([0, 0, 0, 0], 0.5, true)
    expect(coefficients).toHaveLength(3)
  })
  test('it makes cardinal coefficients with non-duplicated points', () => {
    const coefficients = createCardinalCoefficients([0, 0, 0, 0], 0.5, false)
    expect(coefficients).toHaveLength(1)
  })
  test('it throws for an invalid number of duplicated points', () => {
    expect(() => createCardinalCoefficients([0], 0.5, true)).toThrow()
  })
  test('it throws for an invalid number of non-duplicated points', () => {
    expect(() => createCardinalCoefficients([0, 0, 0], 0.5, false)).toThrow()
  })
})

describe('createCatmullRomCoefficients', () => {
  test('it makes catmull-rom coefficients with duplicated points', () => {
    const coefficients = createCatmullRomCoefficients([0, 0, 0, 0], true)
    expect(coefficients).toHaveLength(3)
  })
  test('it makes catmull-rom coefficients with non-duplicated points', () => {
    const coefficients = createCatmullRomCoefficients([0, 0, 0, 0], false)
    expect(coefficients).toHaveLength(1)
  })
  test('it throws for an invalid number of duplicated points', () => {
    expect(() => createCatmullRomCoefficients([0], true)).toThrow()
  })
  test('it throws for an invalid number of non-duplicated points', () => {
    expect(() => createCatmullRomCoefficients([0, 0, 0], false)).toThrow()
  })
})

describe('createHermiteCoefficients', () => {
  test('it makes hermite coefficients', () => {
    const coefficients = createHermiteCoefficients([0, 0, 0, 0])
    expect(coefficients).toHaveLength(1)
  })
  test('it throws for an invalid number of points', () => {
    expect(() => createHermiteCoefficients([0, 0, 0])).toThrow()
  })
})
