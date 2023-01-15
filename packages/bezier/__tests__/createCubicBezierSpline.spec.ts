import { describe, test } from 'vitest'
import { createCubicBezierSpline } from '../src'

describe('createCubicBezierSpline', () => {
  test('it throws for empty array', ({ expect }) => {
    expect(() => createCubicBezierSpline([])).toThrowError(
      'At least one cubic segment (four points) must be provided'
    )
  })
  test('it throws for array length less than four', ({ expect }) => {
    expect(() => createCubicBezierSpline([{ x: 0 }, { x: 1 }, { x: 2 }])).toThrowError(
      'At least one cubic segment (four points) must be provided'
    )
  })
  test('it throws for array of invalid length', ({ expect }) => {
    expect(() =>
      createCubicBezierSpline([{ x: 0 }, { x: 1 }, { x: 2 }, { x: 0 }, { x: 1 }, { x: 2 }])
    ).toThrowError('Point array must have a length of 3n+1')
  })
})
