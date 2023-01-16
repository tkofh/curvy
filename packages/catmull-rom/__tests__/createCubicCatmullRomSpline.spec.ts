import { describe, test } from 'vitest'
import { createCubicCatmullRomSpline } from '../src'

describe('createCubicCatmullRomSpline', () => {
  test('it throws for empty array', ({ expect }) => {
    expect(() => createCubicCatmullRomSpline([])).toThrowError(
      'At least one cubic segment (four points) must be provided'
    )
  })
  test('it throws for an array shorter than four', ({ expect }) => {
    expect(() => createCubicCatmullRomSpline([{ x: 0 }, { x: 2 }])).toThrowError(
      'At least one cubic segment (four points) must be provided'
    )
  })
})
