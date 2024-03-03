import { describe, test } from 'vitest'
import { createCubicHermiteSpline } from '../src'

describe('createCubicHermiteSpline', () => {
  test('it throws for empty array', ({ expect }) => {
    expect(() => createCubicHermiteSpline([])).toThrowError(
      'At least one cubic segment (four points) must be provided',
    )
  })
  test('it throws for an array shorter than four', ({ expect }) => {
    expect(() => createCubicHermiteSpline([{ x: 0 }, { x: 2 }])).toThrowError(
      'At least one cubic segment (four points) must be provided',
    )
  })
  test('it throws for a non-even number of points', ({ expect }) => {
    expect(() =>
      createCubicHermiteSpline([
        { x: 0 },
        { x: 1 },
        { x: 1 },
        { x: 2 },
        { x: 3 },
      ]),
    ).toThrowError('An even number of points and velocities must be provided')
  })
})
