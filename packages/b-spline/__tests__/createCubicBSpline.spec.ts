import { describe, test } from 'vitest'
import { createCubicBSpline } from '../src'

describe('createCubicBSpline', () => {
  test('it throws for empty array', ({ expect }) => {
    expect(() => createCubicBSpline([])).toThrowError(
      'At least one cubic segment (four points) must be provided'
    )
  })
  test('it throws for an array shorter than four', ({ expect }) => {
    expect(() => createCubicBSpline([{ x: 0 }, { x: 2 }])).toThrowError(
      'At least one cubic segment (four points) must be provided'
    )
  })
})
