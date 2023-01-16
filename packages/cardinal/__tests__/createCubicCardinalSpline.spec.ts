import { describe, test } from 'vitest'
import { createCubicCardinalSpline } from '../src'

describe('createCubicCardinalSpline', () => {
  test('it throws for empty array', ({ expect }) => {
    expect(() => createCubicCardinalSpline([])).toThrowError(
      'At least one cubic segment (four points) must be provided'
    )
  })
  test('it throws for an array shorter than four', ({ expect }) => {
    expect(() => createCubicCardinalSpline([{ x: 0 }, { x: 2 }])).toThrowError(
      'At least one cubic segment (four points) must be provided'
    )
  })
})
