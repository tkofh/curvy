import { describe, expect, test } from 'vitest'
import { createCurveAxis } from '../src/axis'
import { createBezierCoefficients } from '../src/splines'

const testPrecision = 8

describe('createCurveAxis', () => {
  test('finds increasing monotonicity for [0, 0, 1, 1, 1, 2, 2]', () => {
    expect(
      createCurveAxis(createBezierCoefficients([0, 0, 1, 1, 1, 2, 2]))
        .monotonicity,
    ).toBe('increasing')
  })

  test('finds decreasing monotonicity for [2, 2, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(createBezierCoefficients([2, 2, 1, 1, 1, 0, 0]))
        .monotonicity,
    ).toBe('decreasing')
  })
  test('finds constant monotonicity for [0, 0, 0, 0, 0, 0, 0]', () => {
    expect(
      createCurveAxis(createBezierCoefficients([0, 0, 0, 0, 0, 0, 0]))
        .monotonicity,
    ).toBe('constant')
  })
  test('finds no monotonicity for [0, 1, 1, 0, -1, -1, 0]', () => {
    expect(
      createCurveAxis(createBezierCoefficients([0, 1, 1, 0, -1, -1, 0]))
        .monotonicity,
    ).toBe('none')
  })
  test('finds no monotonicity for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]))
        .monotonicity,
    ).toBe('none')
  })

  test('finds extrema for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(createBezierCoefficients([0, 0, 1, 1, 1, 0, 0])).extrema,
    ).toStrictEqual([0, 0.5, 1])
  })

  test('finds extrema for [0, 3, 3, 0, -3, -3, 0]', () => {
    console.log(
      createCurveAxis(createBezierCoefficients([0, 3, 3, 0, -3, -3, 0]))
        .segments,
    )
    expect(
      createCurveAxis(createBezierCoefficients([0, 3, 3, 0, -3, -3, 0]))
        .extrema,
    ).toStrictEqual([0, 0.25, 0.75, 1])
  })

  test('finds postition 0 at t=0 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solvePosition(0),
    ).toBeCloseTo(0, testPrecision)
  })

  test('finds position 0.5 at t=0.25 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solvePosition(0.25),
    ).toBeCloseTo(0.5, testPrecision)
  })

  test('finds position 1 at t=0.5 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solvePosition(0.5),
    ).toBeCloseTo(1, testPrecision)
  })

  test('finds position 0.5 at t=0.75 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solvePosition(0.75),
    ).toBeCloseTo(0.5, testPrecision)
  })

  test('finds postition 0 at t=1 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solvePosition(1),
    ).toBeCloseTo(0, testPrecision)
  })

  test('finds velocity 0 at t=0 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solveVelocity(0),
    ).toBeCloseTo(0, testPrecision)
  })

  test('finds velocity greater than 0 at t=0.25 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solveVelocity(0.25),
    ).toBeGreaterThan(0)
  })

  test('finds velocity 0 at t=0.5 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solveVelocity(0.5),
    ).toBeCloseTo(0, testPrecision)
  })

  test('finds velocity less than 0 at t=0.75 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solveVelocity(0.75),
    ).toBeLessThan(0)
  })

  test('finds velocity 0 at t=1 for [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurveAxis(
        createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
      ).solveVelocity(1),
    ).toBeCloseTo(0, testPrecision)
  })

  test('finds t [0.25, 0.75] at position=0.5 for [0, 0, 1, 1, 1, 0, 0]', () => {
    const solution = createCurveAxis(
      createBezierCoefficients([0, 0, 1, 1, 1, 0, 0]),
    ).solveT(0.5, [0, 1])
    expect(solution).toHaveLength(2)
    expect(solution[0]).toBeCloseTo(0.25, testPrecision)
    expect(solution[1]).toBeCloseTo(0.75, testPrecision)
  })
})
